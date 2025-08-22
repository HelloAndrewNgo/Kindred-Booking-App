'use strict';

const { httpError } = require('../errors');
const { getSlotById, isSlotBooked } = require('./slotsService');
const { createBooking } = require('./bookingService');
const { getActiveHoldBySlot, getHoldByIdAndToken, insertHold, markHoldReleased, releaseExpiredHoldsNow } = require('../models/holdModel');
const { findIdempotency, recordIdempotency } = require('../models/idempotencyModel');

// TTL for holds in seconds
/**
 * Read hold TTL (in seconds) from environment; defaults to 300 seconds (5 minutes)
 * @returns {number} TTL seconds
 */
function getTtlSeconds() {
	return parseInt(process.env.HOLD_TTL_SECONDS || '300');
}

/**
 * Get current time as ISO string
 * @returns {string}
 */
function nowIso() { return new Date().toISOString(); }

/**
 * Add seconds to a Date and return a new Date
 * @param {Date} date
 * @param {number} seconds
 * @returns {Date}
 */
function addSeconds(date, seconds) { return new Date(date.getTime() + seconds * 1000); }

/**
 * Create a temporary hold for a slot. Validates slot exists, is not booked, and has no active hold.
 * Generates a hold token and sets an expiration based on TTL.
 * @param {Object} prisma - Prisma client
 * @param {number} slotId - Slot to hold
 * @param {() => string} uuidv4 - Function to generate a unique token
 * @returns {Promise<{id:number, hold_token:string, expires_at:string}>}
 * @throws 404 if slot not found; 409 if already booked or already on hold
 */
async function createHold(prisma, slotId, uuidv4) {
	return prisma.$transaction(async (tx) => {
		const slot = await getSlotById(tx, slotId);
		const slotNotFound = !slot;
		if (slotNotFound) throw httpError(404, 'Slot not found');

		const slotAlreadyBooked = await isSlotBooked(tx, slotId);
		if (slotAlreadyBooked) throw httpError(409, 'Slot already booked');

		const slotHasActiveHold = await getActiveHoldBySlot(tx, slotId);
		if (slotHasActiveHold) throw httpError(409, 'Slot currently on hold');

		// Users should not be able to hold slots that are in the past and have already started.
		const slotStartsInPast = new Date(slot.startAt) <= new Date();
		if (slotStartsInPast) throw httpError(409, 'Slot is in the past or has already started');

		const token = uuidv4();
		const createdAt = nowIso();
		const expiresAt = addSeconds(new Date(), getTtlSeconds()).toISOString();
		const id = await insertHold(tx, slotId, token, createdAt, expiresAt);
		return { id, hold_token: token, expires_at: expiresAt };
	});
}

/**
 * Confirm a hold: validates hold token and unexpired status, creates a booking, and releases the hold.
 * Supports idempotency via an optional `idemKey`; if provided and found, returns the stored response.
 * @param {Object} prisma - Prisma client
 * @param {number} holdId - Hold ID to confirm
 * @param {string} holdToken - Hold token for authentication from bad actors
 * @param {string|undefined} idemKey - Optional idempotency key
 * @returns {Promise<Object>} When idempotent: { idempotent:true, statusCode:number, body:any }; otherwise { booking_created:true }
 * @throws 401/404/409/410 mapped by callers into HTTP responses
 */
async function confirmHold(prisma, holdId, holdToken, idemKey) {
	return prisma.$transaction(async (tx) => {
		if (idemKey) {
			const existing = await findIdempotency(tx, idemKey);
			const isIdempotentRequest = !!existing;
			if (isIdempotentRequest) {
				const body = existing.responseJson ? JSON.parse(existing.responseJson) : undefined;
				return { idempotent: true, statusCode: existing.status || 200, body };
			}
		}

		const hold = await getHoldByIdAndToken(tx, holdId, holdToken);
		const holdNotFound = !hold;
		if (holdNotFound) throw httpError(404, 'Hold not found');

		const isReleased = hold.releasedAt != null;
		const isExpired = new Date(hold.expiresAt) <= new Date();
		const holdIsInvalid = isReleased || isExpired;
		if (holdIsInvalid) throw httpError(410, 'Hold expired');

		try {
			await createBooking(tx, hold.slotId, nowIso());
		} catch (e) {
			throw httpError(409, 'Slot already booked');
		}
		
		await markHoldReleased(tx, hold.id, nowIso());

		const response = { booking_created: true };
        
		// If an idempotency key is provided, save the response so retries with the
		// same key return this result instead of running the booking again.
		if (idemKey) {
			await recordIdempotency(tx, idemKey, 'POST', `/holds/${holdId}/confirm`, nowIso(), 200, response);
		}
		return response;
	});
}

/**
 * Release a hold. If the hold exists and is active, mark it as released; otherwise, no-op.
 * @param {Object} prisma - Prisma client
 * @param {number} holdId - Hold ID to release
 * @param {string} holdToken - Hold token for authentication
 * @returns {Promise<{released:boolean}>}
 */
async function releaseHold(prisma, holdId, holdToken) {
	return prisma.$transaction(async (tx) => {
		const hold = await getHoldByIdAndToken(tx, holdId, holdToken);
		const holdExists = !!hold;
		const holdIsActive = holdExists && hold.releasedAt == null;
		
		if (holdIsActive) {
			await markHoldReleased(tx, holdId, nowIso());
		}
		
		return { released: true };
	});
}

/**
 * Mark all expired holds as released (internal maintenance operation).
 * @param {Object} prisma
 * @returns {Promise<{updated:number}>}
 */
async function cleanupExpiredHolds(prisma) {
	const updated = await releaseExpiredHoldsNow(prisma, nowIso());
	return { updated };
}

module.exports = { createHold, confirmHold, releaseHold, cleanupExpiredHolds };


