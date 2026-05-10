import Dexie from 'https://cdn.jsdelivr.net/npm/dexie@4.0.8/dist/dexie.mjs';

const db = new Dexie('SwiftShipDB_New');

// Fresh schema: single version without legacy migration chain.
db.version(1).stores({
  sessions: '++id, user_id, is_active, expires_at, role',
  users: 'id,&email,phone,full_name,role,created_at,last_login',
  shipments: 'id, shipment_code, sender_name, sender_address, receiver_name, receiver_address, source_city, destination_city, weight_kg, distance_km, delivery_type, estimated_cost, estimated_days, status, created_by, created_at, updated_at',
  status_history: '++id, shipment_id, status, updated_by, notes, timestamp',
});

// Open immediately so schema upgrades run as soon as this module is imported.
try {
  await db.open();
} catch (error) {
  console.warn('DB open/upgrade failed:', error);
}

async function getActiveSession() {
  const now = Date.now();
  const active = await db.sessions
    .where('is_active')
    .equals(1)
    .and((session) => session.expires_at > now)
    .first();
  return active || null;
}

async function getSessionById(id) {
  return db.sessions.get(id);
}

async function deactivateActiveSessions() {
  return db.sessions.where('is_active').equals(1).modify({ is_active: 0 });
}

async function createSession({ user_id = null, role, expires_at, is_active = 1, deactivate_existing = true }) {
  const expiresAt = typeof expires_at === 'number' ? expires_at : Date.now() + 1000 * 60 * 60 * 24 * 7;
  return db.transaction('rw', db.sessions, async () => {
    if (deactivate_existing) {
      await deactivateActiveSessions();
    }

    return db.sessions.add({
      user_id,
      is_active,
      expires_at: expiresAt,
      role,
    });
  });
}

async function addUser({ id, email, password_hash, full_name, phone, role }) {
  if (!phone) {
    throw new Error('phone_required');
  }
  if (!id) {
    id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
  }
  const now = Date.now();
  const record = { id, email, phone, password_hash, full_name, role, created_at: now, last_login: null };
  return db.users.put(record);
}

async function updateUser(id, patch = {}) {
  const safePatch = { ...patch };
  delete safePatch.id;
  return db.users.update(id, safePatch);
}

async function deleteUser(id) {
  return db.users.delete(id);
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

function generateShipmentCode(prefix = 'SHP') {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const time = String(now.getTime()).slice(-6);
  return `${prefix}-${yy}${mm}${dd}-${time}`;
}

async function addShipment(shipment) {
  const now = Date.now();
  const id = shipment.id || ((crypto && crypto.randomUUID) ? crypto.randomUUID() : String(now));
  const record = {
    ...shipment,
    id,
    shipment_code: shipment.shipment_code || generateShipmentCode(),
    created_at: shipment.created_at || now,
    updated_at: shipment.updated_at || now,
  };
  return db.shipments.put(record);
}

async function getShipmentById(id) {
  return db.shipments.get(id);
}

async function getShipmentByCode(shipment_code) {
  return db.shipments.where('shipment_code').equals(shipment_code).first();
}

async function listShipments() {
  return db.shipments.orderBy('created_at').reverse().toArray();
}

async function listShipmentsByCreator(created_by) {
  return db.shipments.where('created_by').equals(created_by).toArray();
}

async function updateShipment(id, patch = {}) {
  const safePatch = { ...patch, updated_at: Date.now() };
  delete safePatch.id;
  return db.shipments.update(id, safePatch);
}

async function addStatusHistory({ shipment_id, status, updated_by = null, notes = null, timestamp }) {
  const record = {
    shipment_id,
    status,
    updated_by,
    notes,
    timestamp: timestamp || Date.now(),
  };
  return db.status_history.add(record);
}

async function getShipmentHistory(shipment_id) {
  return db.status_history.where('shipment_id').equals(shipment_id).toArray();
}

async function updateShipmentStatus(shipment_id, status, { updated_by = null, notes = null } = {}) {
  return db.transaction('rw', db.shipments, db.status_history, async () => {
    await db.shipments.update(shipment_id, { status, updated_at: Date.now() });
    await addStatusHistory({ shipment_id, status, updated_by, notes });
  });
}

async function deleteShipment(id) {
  return db.transaction('rw', db.shipments, db.status_history, async () => {
    await db.status_history.where('shipment_id').equals(id).delete();
    await db.shipments.delete(id);
  });
}

export function getDashboardPathForRole(role) {
  if (role === 1 || role === 'admin') return '/pages/admin/dashboard.html';
  if (role === 'staff') return '/pages/staff/dashboard.html';
  return '/pages/customer/dashboard.html';
}

export const SwiftShipDB = {
  db,
  generateShipmentCode,
  getSessionById,
  getActiveSession,
  deactivateActiveSessions,
  createSession,
  addUser,
  updateUser,
  deleteUser,
  getUserByEmail,
  getUserById,
  updateLastLogin,
  addShipment,
  getShipmentById,
  getShipmentByCode,
  listShipments,
  listShipmentsByCreator,
  updateShipment,
  updateShipmentStatus,
  deleteShipment,
  addStatusHistory,
  getShipmentHistory,
};

// Keep global compatibility for any remaining non-module scripts.
window.SwiftShipDB = SwiftShipDB;
