'use strict';

const express = require('express');
const { validate, validateRoomCreationPayload } = require('../../utils/validation');
const { createRoom } = require('../../services/roomsService');

const router = express.Router();

/**
 * POST /internal/rooms
 * Create a room (Internal API)
 *
 * Body: { "name": string }
 * Responses:
 *   201: { "id": number }
 *   400: { "error": "name required" }
 */
router.post('/', validate(validateRoomCreationPayload), async (req, res, next) => {
	try {
		const db = req.db;
		const { name } = req.validated;
		const result = await createRoom(db, name);
		return res.status(201).json(result);
	} catch (error) {
		return next(error);
	}
});

module.exports = router;



