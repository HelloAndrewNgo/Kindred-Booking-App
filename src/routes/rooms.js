'use strict';

const express = require('express');
const { getRooms } = require('../services/roomsService');
const { validate, validatePaginationParams } = require('../utils/validation');

const router = express.Router();

/**
 * GET /rooms
 * List rooms ordered by id with offset pagination via `limit` and `offset` params.
 * Defaults to limit=50.
 *
 * Response: { "rooms": Array<{ id: number, name: string }>, total: number, limit: number, offset: number }
 */
router.get('/', validate(validatePaginationParams), async (req, res, next) => {
	try {
		const db = req.db;
		const { limit, offset } = req.validated;
		const result = await getRooms(db, { limit, offset });
		return res.json(result);
	} catch (error) {
		return next(error);
	}
});

module.exports = router;


