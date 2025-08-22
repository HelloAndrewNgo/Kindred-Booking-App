'use strict';

const Database = require('better-sqlite3');

const DEFAULT_DB_FILE = process.env.DB_FILE || 'kindred.db';

function openDatabase(dbFile = DEFAULT_DB_FILE) {
	const db = new Database(dbFile);
	db.pragma('journal_mode = WAL');
	db.pragma('foreign_keys = ON');
	return db;
}

function migrate(db) {
	db.exec(`
		CREATE TABLE IF NOT EXISTS rooms (
			id INTEGER PRIMARY KEY,
			name TEXT NOT NULL
		);
		CREATE TABLE IF NOT EXISTS slots (
			id INTEGER PRIMARY KEY,
			room_id INTEGER NOT NULL,
			start_at TEXT NOT NULL,
			end_at TEXT NOT NULL,
			FOREIGN KEY(room_id) REFERENCES rooms(id)
		);
		CREATE TABLE IF NOT EXISTS holdings (
			id INTEGER PRIMARY KEY,
			slot_id INTEGER NOT NULL,
			hold_token TEXT NOT NULL,
			created_at TEXT NOT NULL,
			expires_at TEXT NOT NULL,
			released_at TEXT,
			FOREIGN KEY(slot_id) REFERENCES slots(id)
		);
		CREATE TABLE IF NOT EXISTS bookings (
			id INTEGER PRIMARY KEY,
			slot_id INTEGER NOT NULL UNIQUE,
			created_at TEXT NOT NULL,
			FOREIGN KEY(slot_id) REFERENCES slots(id)
		);
		CREATE TABLE IF NOT EXISTS idempotency_keys (
			id INTEGER PRIMARY KEY,
			key TEXT NOT NULL UNIQUE,
			method TEXT NOT NULL,
			path TEXT NOT NULL,
			created_at TEXT NOT NULL,
			status INTEGER,
			response_json TEXT
		);
	`);
}

function setupDatabase(dbFile = DEFAULT_DB_FILE) {
	const db = openDatabase(dbFile);
	migrate(db);
	return db;
}

module.exports = { setupDatabase, openDatabase, migrate };


