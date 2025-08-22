'use strict';

const { getPrisma } = require('../src/prisma');

async function reset() {
	const prisma = getPrisma();
	
	console.log('🗑️  Starting database reset...');
	
	try {
		// Clear all data (in reverse order of dependencies)
		console.log('Clearing existing data...');
		
		await prisma.booking.deleteMany();
		await prisma.holding.deleteMany();
		await prisma.slot.deleteMany();
		await prisma.room.deleteMany();
		await prisma.idempotencyKey.deleteMany();
		
		console.log('Database cleared');
		
		// Re-seed with fresh data
		const { seed } = require('./seed');
		await seed();
		
		console.log('Database reset and re-seeded successfully');
		
	} catch (error) {
		console.error('Error resetting database:', error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

// Run if called directly
if (require.main === module) {
	reset()
		.then(() => {
			console.log('Reset completed successfully');
			process.exit(0);
		})
		.catch((error) => {
			console.error('Reset failed:', error);
			process.exit(1);
		});
}

module.exports = { reset };
