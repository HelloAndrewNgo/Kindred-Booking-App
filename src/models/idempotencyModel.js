'use strict';

/**
 * Find an existing idempotency key to check if request was already processed
 * @param {Object} prisma - Prisma client instance
 * @param {string} key - The idempotency key to search for
 * @returns {Promise<Object|null>} The idempotency record or null if not found
 */
async function findIdempotency(prisma, key) {
	return prisma.idempotencyKey.findUnique({
		where: { key }
	});
}

/**
 * Record a new idempotency key to prevent duplicate request processing
 * @param {Object} prisma - Prisma client instance
 * @param {string} key - The unique idempotency key
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} path - Request path
 * @param {string} createdAt - When the request was processed (ISO string)
 * @param {number} status - HTTP status code of the response
 * @param {Object} bodyObj - Response body object to store
 * @returns {Promise<Object>} The created idempotency record
 */
async function recordIdempotency(prisma, key, method, path, createdAt, status, bodyObj) {
	return prisma.idempotencyKey.create({
		data: {
			key,
			method,
			path,
			createdAt: new Date(createdAt),
			status,
			responseJson: JSON.stringify(bodyObj)
		}
	});
}

module.exports = {
	findIdempotency,
	recordIdempotency
};


