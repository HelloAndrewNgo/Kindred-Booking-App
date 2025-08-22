'use strict';

const express = require('express');
const { getSlots } = require('../services/slotsService');
const { validate, validatePaginationParams } = require('../utils/validation');

const router = express.Router();

/**
 * GET /slots
 * List slots with their current status (available, held, booked).
 * Supports offset pagination via `limit` and `offset` query parameters.
 * Defaults to limit=50.
 *
 * Response: {
 *   slots: Array<SlotWithStatus>,
 *   total: number,
 *   limit: number,
 *   offset: number
 * }
 */
router.get('/', validate(validatePaginationParams), async (req, res, next) => {
	try {
		const db = req.db;
		const { limit, offset } = req.validated;
		const result = await getSlots(db, { limit, offset });
		return res.json(result);
	} catch (error) {
		return next(error);
	}
});

module.exports = router;


