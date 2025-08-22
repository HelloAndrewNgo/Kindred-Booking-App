'use strict';

const { getPrisma } = require('../src/prisma');

async function seed() {
	const prisma = getPrisma();
	
	console.log('🌱 Starting database seed...');
	
	try {
		// Create sample rooms
		console.log('Creating rooms...');
		const room1 = await prisma.room.create({
			data: { name: 'Room A' }
		});
		const room2 = await prisma.room.create({
			data: { name: 'Room B' }
		});
		const room3 = await prisma.room.create({
			data: { name: 'Room C' }
		});
		
		console.log(`Created rooms: ${room1.name}, ${room2.name}, ${room3.name}`);
		
		// Create sample time slots for today and tomorrow
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);
		
		// Helper to create slots for a given date
		function createSlotsForDate(date, roomId) {
			const slots = [];
			for (let hour = 9; hour <= 17; hour++) { // 9 AM to 5 PM
				const startTime = new Date(date);
				startTime.setHours(hour, 0, 0, 0);
				
				const endTime = new Date(date);
				endTime.setHours(hour + 1, 0, 0, 0);
				
				slots.push({
					roomId,
					startAt: startTime,
					endAt: endTime
				});
			}
			return slots;
		}
		
		console.log('Creating time slots...');
		
		// Create slots for today
		const todaySlots = [];
		[today, tomorrow].forEach(date => {
			[room1.id, room2.id, room3.id].forEach(roomId => {
				todaySlots.push(...createSlotsForDate(date, roomId));
			});
		});
		
		// Insert all slots
		const createdSlots = await prisma.slot.createMany({
			data: todaySlots
		});
		
		console.log(`Created ${createdSlots.count} time slots`);
		
		// Show summary
		const totalRooms = await prisma.room.count();
		const totalSlots = await prisma.slot.count();
		
		console.log('\n Database Summary:');
		console.log(`   Rooms: ${totalRooms}`);
		console.log(`   Time Slots: ${totalSlots}`);
		
		console.log('\n Sample data created successfully!');
		console.log('   You can now test the API endpoints:');
		console.log('   - GET /rooms - to see the rooms');
		console.log('   - GET /slots - to see the time slots');
		console.log('   - POST /holds - to create holds on slots');
		
	} catch (error) {
		console.error('Error seeding database:', error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

// Run if called directly
if (require.main === module) {
	seed()
		.then(() => {
			console.log('Seed completed successfully');
			process.exit(0);
		})
		.catch((error) => {
			console.error('Seed failed:', error);
			process.exit(1);
		});
}

module.exports = { seed };
