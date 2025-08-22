'use strict';

/**
 * Get the active (non-expired, non-released) hold for a specific slot
 * @param {Object} prisma - Prisma client instance
 * @param {number} slotId - The slot ID to check for active holds
 * @returns {Promise<Object|null>} The active hold object or null if none exists
 */
async function getActiveHoldBySlot(prisma, slotId) {
	return prisma.holding.findFirst({
		where: {
			slotId: Number(slotId),
			releasedAt: null,
			expiresAt: { gt: new Date() }
		}
	});
}

/**
 * Find a hold by its ID and token for authentication
 * @param {Object} prisma - Prisma client instance
 * @param {number} id - The hold ID
 * @param {string} token - The hold token for verification
 * @returns {Promise<Object|null>} The hold object or null if not found
 */
async function getHoldByIdAndToken(prisma, id, token) {
	return prisma.holding.findFirst({
		where: {
			id: Number(id),
			holdToken: token
		}
	});
}

/**
 * Create a new hold for a slot
 * @param {Object} prisma - Prisma client instance
 * @param {number} slotId - The slot ID to hold
 * @param {string} token - Unique token for the hold
 * @param {string} createdAt - When the hold was created (ISO string)
 * @param {string} expiresAt - When the hold expires (ISO string)
 * @returns {Promise<number>} The ID of the created hold
 */
async function insertHold(prisma, slotId, token, createdAt, expiresAt) {
	const hold = await prisma.holding.create({
		data: {
			slotId: Number(slotId),
			holdToken: token,
			createdAt: new Date(createdAt),
			expiresAt: new Date(expiresAt)
		}
	});
	return hold.id;
}

/**
 * Mark a hold as released by setting the releasedAt timestamp
 * @param {Object} prisma - Prisma client instance
 * @param {number} id - The hold ID to mark as released
 * @param {string} releasedAt - When the hold was released (ISO string)
 * @returns {Promise<Object>} The updated hold object
 */
async function markHoldReleased(prisma, id, releasedAt) {
	return prisma.holding.update({
		where: { id: Number(id) },
		data: { releasedAt: new Date(releasedAt) }
	});
}

/**
 * Mark all expired, unreleased holds as released now.
 * @param {Object} prisma - Prisma client instance
 * @param {string} nowIso - Timestamp to use for releasedAt
 * @returns {Promise<number>} Number of holds updated
 */
async function releaseExpiredHoldsNow(prisma, nowIso) {
	const result = await prisma.holding.updateMany({
		where: { releasedAt: null, expiresAt: { lt: new Date(nowIso) } },
		data: { releasedAt: new Date(nowIso) }
	});
	return result.count || 0;
}

module.exports = {
	getActiveHoldBySlot,
	getHoldByIdAndToken,
	insertHold,
	markHoldReleased,
	releaseExpiredHoldsNow
};


