'use strict';

const express = require('express');
const { cleanupExpiredHolds } = require('../../services/holdService');

const router = express.Router();

/**
 * POST /internal/holds/cleanup-expired
 * Mark all expired, unreleased holds as released.
 * Response: { updated: number }
 */
router.post('/cleanup-expired', async (req, res, next) => {
	try {
		const db = req.db;
		const result = await cleanupExpiredHolds(db);
		return res.status(200).json(result);
	} catch (error) {
		return next(error);
	}
});

module.exports = router;



