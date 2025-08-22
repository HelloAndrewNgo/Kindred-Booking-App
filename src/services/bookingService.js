'use strict';

const { createBooking: createBookingModel, getBookingBySlotId, deleteBookingBySlotId } = require('../models/bookingModel');

/**
 * Service layer for booking-related operations. Encapsulates direct model access
 * so other services/controllers depend on this layer rather than models for better separation of concerns.
 */

/**
 * Create a booking for a slot
 * @param {Object} prisma - Prisma client instance or transaction client
 * @param {number} slotId - The slot ID to book
 * @param {string} createdAt - ISO timestamp when booking is created
 * @returns {Promise<Object>} The created booking object
 */
async function createBooking(prisma, slotId, createdAt) {
	return createBookingModel(prisma, slotId, createdAt);
}

/**
 * Get a booking by the slot id
 * @param {Object} prisma
 * @param {number} slotId
 * @returns {Promise<Object|null>}
 */
async function findBookingBySlotId(prisma, slotId) {
	return getBookingBySlotId(prisma, slotId);
}

module.exports = {
	createBooking,
	findBookingBySlotId
};
