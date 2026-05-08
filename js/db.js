(function initDb(global) {
	if (!global.Dexie) {
		console.error('Dexie is not loaded. Make sure the Dexie CDN script is included before js/db.js.');
		return;
	}

	const db = new global.Dexie('SwiftShipDB');

	// Preserve original structure as version 1, then upgrade to version 2 with
	// the new `users` schema (string `id` PK, unique `email`).
	db.version(1).stores({
		sessions: '++id, is_active, expires_at, role',
		users: '++id',
	});

	db.version(2).stores({
		sessions: '++id, is_active, expires_at, role',
		users: 'id,&email,phone,full_name,role,created_at,last_login',
	}).upgrade(async (tx) => {
		// Migrate any existing numeric-autoinc users into the new schema.
		try {
			const oldUsers = await tx.table('users').toArray();
			if (oldUsers && oldUsers.length) {
				const newUsers = oldUsers.map(u => {
					const id = (u.id !== undefined && u.id !== null) ? String(u.id) :
						(global.crypto && global.crypto.randomUUID) ? global.crypto.randomUUID() : String(Date.now());
					return {
						id,
						email: u.email || `user_${id}@local`,
						phone: u.phone || u.phone_number || null,
						password_hash: u.password_hash || null,
						full_name: u.full_name || u.name || '',
						role: u.role || 0,
						created_at: u.created_at || Date.now(),
						last_login: u.last_login || null,
					};
				});
				await Promise.all(newUsers.map(nu => tx.table('users').put(nu)));
			}
		} catch (e) {
			console.warn('Users migration skipped or failed:', e);
		}
	});

	async function getActiveSession() {
		const now = Date.now();

		const active = await db.sessions
			.where('is_active')
			.equals(1)
			.and((session) => session.expires_at > now)
			.first();

		return active || null;
	}

	// User helpers for Dexie-backed users store
	async function addUser({ id, email, password_hash, full_name, phone, role }) {
		if (!phone) {
			throw new Error('phone_required');
		}
		if (!id) {
			id = (global.crypto && global.crypto.randomUUID) ? global.crypto.randomUUID() : String(Date.now());
		}
		const now = Date.now();
		const record = { id, email, phone, password_hash, full_name, role, created_at: now, last_login: null };
		return db.users.put(record);
	}

	async function getUserByEmail(email) {
		return db.users.where('email').equals(email).first();
	}

	async function getUserById(id) {
		return db.users.get(id);
	}

	async function updateLastLogin(id) {
		return db.users.update(id, { last_login: Date.now() });
	}

	global.SwiftShipDB = {
		db,
		getActiveSession,
		addUser,
		getUserByEmail,
		getUserById,
		updateLastLogin,
	};
})(window);
