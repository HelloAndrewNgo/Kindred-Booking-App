'use strict';

const { insertRoom: insertRoomModel, listRooms: listRoomsModel, countRooms } = require('../models/roomModel');

/**
 * Service layer for room-related operations.
 * Only this layer should interact with the rooms model from controllers.
 */

/**
 * Create a room
 * @param {Object} prisma
 * @param {string} name
 * @returns {Promise<{ id:number }>}
 */
async function createRoom(prisma, name) {
    const id = await insertRoomModel(prisma, name);
    return { id };
}

/**
 * Get list of rooms with optional pagination
 * @param {Object} prisma
 * @param {{ limit?: number, offset?: number }} [options]
 * @returns {Promise<{ rooms: Array<{ id:number, name:string }>, total: number, limit?: number, offset?: number }>}
 */
async function getRooms(prisma, options = {}) {
    const { limit, offset } = options;
    const [rooms, total] = await Promise.all([
        listRoomsModel(prisma, { limit, offset }),
        countRooms(prisma)
    ]);
    return { rooms, total, limit, offset };
}

module.exports = {
    createRoom,
    getRooms
};



