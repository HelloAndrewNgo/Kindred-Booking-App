'use strict';

/**
 * Middleware to restrict access to internal APIs.
 * Requires header x-api-key to match process.env.INTERNAL_API_KEY when set.
 */
function requireInternalAccess(req, res, next) {
	const configuredKey = process.env.INTERNAL_API_KEY;
	if (configuredKey && req.header('x-api-key') !== configuredKey) {
		return res.status(403).json({ error: 'Internal access required' });
	}
	return next();
}

module.exports = requireInternalAccess;



