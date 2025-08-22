'use strict';

function isInteger(value) {
	return typeof value === 'number' && Number.isInteger(value);
}

function isIsoDateString(value) {
	return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

/**
 * Express middleware factory that runs a validator and auto-sends error responses.
 * Attaches successful validation payload to req.validated
 * @param {Object} options
 * @param {(req: import('express').Request) => { ok: true, [key:string]: any } | { ok:false, error:string, status?:number }} options.validator
 * @param {string} [options.errorMessage] - Custom error message for validation failures
 */
function validate(options) {
	const validatorFn = typeof options === 'function' ? options : options?.validator;
	const errorMessage = (typeof options === 'object' && options?.errorMessage) || 'Bad Request';
	return (req, res, next) => {
		if (typeof validatorFn !== 'function') {
			return res.status(500).json({ error: 'Validator is not a function' });
		}
		const result = validatorFn(req);
		if (result && result.ok) {
			req.validated = result;
			return next();
		}
		const status = (result && result.status) || 400;
		return res.status(status).json({ error: result?.error || errorMessage });
	};
}

/**
 * Validate payload for creating a slot
 * @param {import('express').Request} req
 * @returns {{ ok: true } | { ok: false, error: string, status?: number }}
 */
function validateSlotCreationPayload(req) {
	const { room_id, start_at, end_at } = req.body || {};

	if (room_id == null || start_at == null || end_at == null) {
		return { ok: false, error: 'room_id, start_at, end_at required', status: 400 };
	}
	if (!isInteger(room_id)) {
		return { ok: false, error: 'room_id must be an integer', status: 400 };
	}
	if (!isIsoDateString(start_at)) {
		return { ok: false, error: 'start_at must be an ISO date string', status: 400 };
	}
	if (!isIsoDateString(end_at)) {
		return { ok: false, error: 'end_at must be an ISO date string', status: 400 };
	}
	if (new Date(end_at) <= new Date(start_at)) {
		return { ok: false, error: 'end_at must be after start_at', status: 400 };
	}

	return { ok: true };
}

/**
 * Validate payload for creating a room
 * @param {import('express').Request} req
 * @returns {{ ok: true, name: string } | { ok: false, error: string, status?: number }}
 */
function validateRoomCreationPayload(req) {
	const { name } = req.body || {};
	if (name == null) {
		return { ok: false, error: 'name required', status: 400 };
	}
	if (typeof name !== 'string' || name.trim().length === 0) {
		return { ok: false, error: 'name must be a non-empty string', status: 400 };
	}
	return { ok: true, name: name.trim() };
}

/**
 * Validate payload for creating a hold
 * @param {import('express').Request} req
 * @returns {{ ok: true } | { ok: false, error: string, status?: number }}
 */
function validateHoldCreationPayload(req) {
	const { slot_id } = req.body || {};
	if (slot_id == null) {
		return { ok: false, error: 'slot_id is required', status: 400 };
	}
	if (!isInteger(slot_id)) {
		return { ok: false, error: 'slot_id must be an integer', status: 400 };
	}
	return { ok: true };
}

/**
 * Validate confirm request for hold (uses req to access headers)
 * @param {import('express').Request} req
 * @returns {{ ok: true, idNum: number, token: string, idemKey?: string } | { ok: false, error: string, status?: number }}
 */
function validateHoldConfirmRequest(req) {
	const idNum = Number(req.params?.id);
	if (!Number.isInteger(idNum)) {
		return { ok: false, error: 'id must be an integer', status: 400 };
	}
	const token = req.header('x-hold-token');
	if (!token) {
		return { ok: false, error: 'x-hold-token header required', status: 401 };
	}
	const idemKey = req.header('idempotency-key');
	return { ok: true, idNum, token, idemKey };
}

/**
 * Validate delete request for hold (uses req to access headers)
 * @param {import('express').Request} req
 * @returns {{ ok: true, idNum: number, token: string } | { ok: false, error: string, status?: number }}
 */
function validateHoldDeleteRequest(req) {
	const idNum = Number(req.params?.id);
	if (!Number.isInteger(idNum)) {
		return { ok: false, error: 'id must be an integer', status: 400 };
	}
	const token = req.header('x-hold-token');
	if (!token) {
		return { ok: false, error: 'x-hold-token header required', status: 401 };
	}
	return { ok: true, idNum, token };
}

/**
 * Validate pagination parameters (limit and offset)
 * @param {import('express').Request} req
 * @returns {{ ok: true, limit: number, offset: number } | { ok: false, error: string, status?: number }}
 */
function validatePaginationParams(req) {
	const { limit: limitRaw, offset: offsetRaw } = req.query || {};
	const DEFAULT_LIMIT = 50;
	const MAX_LIMIT = 200;

	if (limitRaw !== undefined && (!Number.isInteger(Number(limitRaw)) || Number(limitRaw) <= 0)) {
		return { ok: false, error: 'limit must be a positive integer', status: 400 };
	}
	if (offsetRaw !== undefined && (!Number.isInteger(Number(offsetRaw)) || Number(offsetRaw) < 0)) {
		return { ok: false, error: 'offset must be a non-negative integer', status: 400 };
	}

	const limit = limitRaw !== undefined ? Math.min(Number(limitRaw), MAX_LIMIT) : DEFAULT_LIMIT;
	const offset = offsetRaw !== undefined ? Number(offsetRaw) : 0;

	return { ok: true, limit, offset };
}

module.exports = {
	validate,
	validateSlotCreationPayload,
	validateRoomCreationPayload,
	validateHoldCreationPayload,
	validateHoldConfirmRequest,
	validateHoldDeleteRequest,
	validatePaginationParams
};
