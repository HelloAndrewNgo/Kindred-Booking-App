'use strict';

/**
 * Insert a new room
 * @param {Object} prisma - Prisma client instance
 * @param {string} name - The room name
 * @returns {Promise<number>} The ID of the created room
 */
async function insertRoom(prisma, name) {
    const room = await prisma.room.create({
        data: { name }
    });
    return room.id;
}

/**
 * List rooms ordered by id ascending with optional pagination
 * @param {Object} prisma - Prisma client instance
 * @param {{ limit?: number, offset?: number }} [options]
 * @returns {Promise<Array<{ id:number, name:string }>>}
 */
async function listRooms(prisma, options = {}) {
    const { limit, offset } = options;
    return prisma.room.findMany({
        orderBy: { id: 'asc' },
        select: { id: true, name: true },
        take: typeof limit === 'number' ? limit : undefined,
        skip: typeof offset === 'number' ? offset : undefined
    });
}

/**
 * Count total number of rooms (for pagination)
 * @param {Object} prisma - Prisma client instance
 * @returns {Promise<number>}
 */
async function countRooms(prisma) {
    return prisma.room.count();
}

module.exports = {
    insertRoom,
    listRooms,
    countRooms
};



