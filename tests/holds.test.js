
'use strict';

const request = require('supertest');
const { getPrisma } = require('../src/prisma');
const createApp = require('../index');

describe('Hold and booking flow', () => {
	let db;
	let app;

	beforeEach(async () => {
		process.env.HOLD_TTL_SECONDS = '2';
		db = getPrisma();

		// reset tables
		await db.booking.deleteMany({});
		await db.holding.deleteMany({});
		await db.slot.deleteMany({});
		await db.room.deleteMany({});
		
		// seed
		await db.room.create({ data: { id: 1, name: 'Room A' } });
		const now = new Date();
		const futureStart = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour ahead
		const futureEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours ahead
		await db.slot.create({ data: { id: 1, roomId: 1, startAt: futureStart, endAt: futureEnd } });
		app = createApp(db);
	});

	afterAll(async () => {
		await getPrisma().$disconnect();
	});

	test('expired hold allows new hold to be placed', async () => {
		// Create a hold, then mark it as expired directly in the DB to avoid real-time waits
		const res1 = await request(app).post('/holds').send({ slot_id: 1 });
		expect(res1.status).toBe(201);
		const holdId = res1.body.id;
		await db.holding.update({ where: { id: holdId }, data: { expiresAt: new Date(Date.now() - 1000) } });

		const res2 = await request(app).post('/holds').send({ slot_id: 1 });
		expect(res2.status).toBe(201);
	});

	test('concurrent holds: only one succeeds and subsequent holds fail', async () => {
		const [a, b, c] = await Promise.all([
			request(app).post('/holds').send({ slot_id: 1 }),
			request(app).post('/holds').send({ slot_id: 1 }),
			request(app).post('/holds').send({ slot_id: 1 }),
		]);
		const statuses = [a.status, b.status, c.status].sort();
		expect(statuses).toEqual([201, 409, 409]);
	});

	test('confirm hold creates booking and prevents others', async () => {
		const holdRes = await request(app).post('/holds').send({ slot_id: 1 });
		expect(holdRes.status).toBe(201);
		const { id: holdId, hold_token: token } = holdRes.body;

		const confirmRes = await request(app)
			.post(`/holds/${holdId}/confirm`)
			.set('x-hold-token', token)
			.send();
		expect(confirmRes.status).toBe(200);

		const secondHold = await request(app).post('/holds').send({ slot_id: 1 });
		expect(secondHold.status).toBe(409);
	});
});


