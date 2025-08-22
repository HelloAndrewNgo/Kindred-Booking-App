'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { createHold, confirmHold, releaseHold } = require('../services/holdService');
const { validate, validateHoldCreationPayload, validateHoldConfirmRequest, validateHoldDeleteRequest } = require('../utils/validation');

const router = express.Router();

/**
 * POST /holds
 * Create a temporary hold for a slot to prevent double booking.
 *
 * Request body:
 *   { "slot_id": number }
 *
 * Responses:
 *   201: { "id": number, "hold_token": string, "expires_at": ISO8601 }
 *   404: { "error": "Slot not found" }
 *   409: { "error": "Slot already booked" | "Slot currently on hold" }
 */
router.post('/', validate(validateHoldCreationPayload), async (req, res, next) => {
	try {
		const db = req.db;
		const { slot_id } = req.body;
		const result = await createHold(db, slot_id, uuidv4);
		return res.status(201).json(result);
	} catch (error) {
		return next(error);
	}
});

/**
 * POST /holds/{id}/confirm
 * Confirm a hold and create a booking.
 *
 * Headers:
 *   - x-hold-token: string (required)
 *   - idempotency-key: string (optional; same response will be returned on retries)
 *
 * Responses:
 *   200: { "booking_created": true } (or previously stored body when idempotent)
 *   401: { "error": "x-hold-token header required" }
 *   404: { "error": "Hold not found" }
 *   409: { "error": "Slot already booked" }
 *   410: { "error": "Hold expired" }
 */
router.post('/:id/confirm', validate(validateHoldConfirmRequest), async (req, res, next) => {
	try {
		const db = req.db;
		const { idNum, token, idemKey } = req.validated;
		const result = await confirmHold(db, idNum, token, idemKey);
		if (result && result.idempotent) {
			return res.status(result.statusCode).json(result.body);
		}
		return res.status(200).json(result);
	} catch (error) {
		return next(error);
	}
});

/**
 * DELETE /holds/{id}
 * Release a hold (no-op if already released/expired). Soft deletes the hold for better auditability.
 *
 * Headers:
 *   - x-hold-token: string (required)
 *
 * Responses:
 *   204: No Content
 *   401: { "error": "x-hold-token header required" }
 */
router.delete('/:id', validate(validateHoldDeleteRequest), async (req, res, next) => {
	try {
		const db = req.db;
		const { idNum, token } = req.validated;
		await releaseHold(db, idNum, token);
		return res.status(204).send();
	} catch (error) {
		return next(error);
	}
});

module.exports = router;


