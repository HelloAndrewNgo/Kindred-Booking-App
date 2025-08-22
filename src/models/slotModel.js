'use strict';

/**
 * Get a slot by its ID
 * @param {Object} prisma - Prisma client instance
 * @param {number} id - The slot ID to retrieve
 * @returns {Promise<Object|null>} The slot object or null if not found
 */
async function getSlotById(prisma, id) {
	return prisma.slot.findUnique({
		where: { id: Number(id) }
	});
}

// Booking check moved to slotsService for better layering

/**
 * List slots with their current status (available, held, or booked)
 * @param {Object} prisma - Prisma client instance
 * @param {{ limit?: number, offset?: number }} [options]
 * @returns {Promise<Array>} Array of slot objects with status information
 * Each slot includes: id, room_id, start_at, end_at, status, hold_expires_at
 */
async function listSlotsWithStatus(prisma, options = {}) {
	const { limit, offset } = options;
	const slots = await prisma.slot.findMany({
		include: {
			booking: true,
			holdings: {
				where: {
					releasedAt: null,
					expiresAt: { gt: new Date() }
				},
				select: { expiresAt: true }
			}
		},
		orderBy: { startAt: 'asc' },
		take: typeof limit === 'number' ? limit : undefined,
		skip: typeof offset === 'number' ? offset : undefined
	});

	return slots.map((s) => ({
		id: s.id,
		room_id: s.roomId,
		start_at: s.startAt.toISOString(),
		end_at: s.endAt.toISOString(),
		status: s.booking ? 'booked' : (s.holdings.length > 0 ? 'held' : 'available'),
		hold_expires_at: s.holdings[0]?.expiresAt?.toISOString() || null
	}));
}

/**
 * Count total number of slots (for pagination)
 * @param {Object} prisma - Prisma client instance
 * @returns {Promise<number>}
 */
async function countSlots(prisma) {
	return prisma.slot.count();
}

/**
 * Create a new time slot for a room
 * @param {Object} prisma - Prisma client instance
 * @param {number} roomId - The room ID for the slot
 * @param {string} startAt - Start time of the slot (ISO string)
 * @param {string} endAt - End time of the slot (ISO string)
 * @returns {Promise<number>} The ID of the created slot
 */
async function insertSlot(prisma, roomId, startAt, endAt) {
	const slot = await prisma.slot.create({
		data: {
			roomId: Number(roomId),
			startAt: new Date(startAt),
			endAt: new Date(endAt)
		}
	});
	return slot.id;
}

module.exports = {
	getSlotById,
	listSlotsWithStatus,
	countSlots,
	insertSlot
};


