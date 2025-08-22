'use strict';

/**
 * Create a booking for a slot
 * @param {Object} prisma - Prisma client instance
 * @param {number} slotId - The slot ID to book
 * @param {string} createdAt - When the booking was created (ISO string)
 * @returns {Promise<Object>} The created booking object
 */
async function createBooking(prisma, slotId, createdAt) {
	return prisma.booking.create({
		data: {
			slotId: Number(slotId),
			createdAt: new Date(createdAt)
		}
	});
}

/**
 * Get a booking by its slot ID
 * @param {Object} prisma - Prisma client instance
 * @param {number} slotId - The slot ID associated with the booking
 * @returns {Promise<Object|null>} The booking object or null if not found
 */
async function getBookingBySlotId(prisma, slotId) {
	return prisma.booking.findUnique({
		where: { slotId: Number(slotId) }
	});
}

/**
 * Delete a booking by its slot ID
 * @param {Object} prisma - Prisma client instance
 * @param {number} slotId - The slot ID associated with the booking
 * @returns {Promise<Object>} The deleted booking object
 */
async function deleteBookingBySlotId(prisma, slotId) {
	return prisma.booking.delete({
		where: { slotId: Number(slotId) }
	});
}

module.exports = {
	createBooking,
	getBookingBySlotId,
	deleteBookingBySlotId
};
