'use strict';

const {
	listSlotsWithStatus,
	countSlots,
	insertSlot,
	getSlotById
} = require('../models/slotModel');
const { findBookingBySlotId } = require('./bookingService');

/**
 * Service layer for slot-related operations.
 */

/**
 * List slots with status and total count using pagination options.
 * @param {Object} prisma
 * @param {{ limit?: number, offset?: number }} [options]
 * @returns {Promise<{ slots: Array<any>, total: number, limit?: number, offset?: number }>}
 */
async function getSlots(prisma, options = {}) {
	const { limit, offset } = options;
	const [rows, total] = await Promise.all([
		listSlotsWithStatus(prisma, { limit, offset }),
		countSlots(prisma)
	]);
	return { slots: rows, total, limit, offset };
}

/**
 * Create a slot
 * @param {Object} prisma
 * @param {number} roomId
 * @param {string} startAt
 * @param {string} endAt
 * @returns {Promise<{ id:number }>}
 */
async function createSlot(prisma, roomId, startAt, endAt) {
	const id = await insertSlot(prisma, roomId, startAt, endAt);
	return { id };
}

/**
 * Check if a slot is currently booked
 * @param {Object} prisma - Prisma client instance
 * @param {number} slotId - The slot ID to check
 * @returns {Promise<boolean>}
 */
async function isSlotBooked(prisma, slotId) {
	const booking = await findBookingBySlotId(prisma, slotId);
	return !!booking;
}

module.exports = {
	getSlots,
	createSlot,
	getSlotById,
	isSlotBooked
};




