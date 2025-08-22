'use strict';

const express = require('express');
const { createSlot } = require('../../services/slotsService');
const { validate, validateSlotCreationPayload } = require('../../utils/validation');

const router = express.Router();

/**
 * POST /internal/slots
 * Create a time slot for a room (Internal API)
 *
 * Body: { "room_id": number, "start_at": ISO8601, "end_at": ISO8601 }
 * Responses:
 *   201: { "id": number }
 *   400: { "error": "room_id, start_at, end_at required" }
 */
router.post('/', validate(validateSlotCreationPayload), async (req, res, next) => {
	try {
		const db = req.db;
		const { room_id, start_at, end_at } = req.body || {};
		const { id } = await createSlot(db, room_id, start_at, end_at);
		return res.status(201).json({ id });
	} catch (error) {
		return next(error);
	}
});

module.exports = router;



