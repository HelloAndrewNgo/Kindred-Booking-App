'use strict';

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapiDocument = require('./src/docs/openapi.json');
const { getPrisma } = require('./src/prisma');
const holdsRouter = require('./src/routes/holds');
const slotsRouter = require('./src/routes/slots');
const roomsRouter = require('./src/routes/rooms');
const internalRoomsRouter = require('./src/routes/internal/rooms');
const internalSlotsRouter = require('./src/routes/internal/slots');
const internalHoldsRouter = require('./src/routes/internal/holds');
const requireInternalAccess = require('./src/middleware/internalAccess');

function createApp(dbOrPrisma) {
	const app = express();
	app.use(express.json());

	// OpenAPI spec + Swagger UI
	app.get('/openapi.json', (req, res) => res.json(openapiDocument));
	app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument, { explorer: true }));

	// Health check
	app.get('/health', (req, res) => {
		return res.json({ status: 'ok', time: new Date().toISOString() });
	});

	// Attach db to request
	app.use((req, res, next) => {
		// Attach prisma compatibly under req.db used by routes
		req.db = dbOrPrisma;
		next();
	});

	// Internal routes (protected)
	app.use('/internal', requireInternalAccess);
	app.use('/internal/rooms', internalRoomsRouter);
	app.use('/internal/slots', internalSlotsRouter);
	app.use('/internal/holds', internalHoldsRouter);

	// Routes
	app.use('/holds', holdsRouter);
	app.use('/slots', slotsRouter);
	app.use('/rooms', roomsRouter);

	// Error handler
	app.use((err, req, res, next) => {
		// eslint-disable-next-line no-console
		console.error(err);
		if (res.headersSent) return next(err);
		res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
	});

	return app;
}

if (require.main === module) {
	const prisma = getPrisma();
	const app = createApp(prisma);
	const port = process.env.PORT || 3000;
	app.listen(port, () => {
		// eslint-disable-next-line no-console
		console.log(`Server listening on http://localhost:${port}`);
	});
}

module.exports = createApp;


