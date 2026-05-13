import Dexie from 'https://cdn.jsdelivr.net/npm/dexie@4.0.8/dist/dexie.mjs';

const db = new Dexie('SwiftShipDB_New');

// Fresh schema: single version without legacy migration chain.
db.version(1).stores({
  sessions: '++id, user_id, is_active, expires_at, role',
  users: 'id,&email,phone,full_name,role,created_at,last_login,recovery_codes',
  shipments: 'id, shipment_code, sender_name, sender_address, receiver_name, receiver_address, source_city, destination_city, weight_kg, distance_km, delivery_type, estimated_cost, estimated_days, status, created_by, created_at, updated_at',
  status_history: '++id, shipment_id, status, updated_by, notes, timestamp',
});

// Attempt to open the DB but do not block module evaluation.
// Using a non-blocking open prevents a hung/slow db.open() from stopping
// other modules (like auth) from initializing and updating UI.
db.open().catch((error) => {
  console.warn('DB open/upgrade failed (non-blocking):', error);
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

async function generateRecoveryCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push({ code, used: 0, created_at: Date.now() });
  }
  return codes;
}

async function addUser({ id, email, password_hash, full_name, phone, role }) {
  if (!phone) {
    throw new Error('phone_required');
  }
  if (!id) {
    id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
  }
  const now = Date.now();
  const recoveryCodes = await generateRecoveryCodes(10);
  const record = { id, email, phone, password_hash, full_name, role, recovery_codes: recoveryCodes, created_at: now, last_login: null };
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
  return db.transaction('rw', db.shipments, db.status_history, async () => {
    await db.shipments.put(record);
    await addStatusHistory({
      shipment_id: id,
      status: record.status || 'pending',
      updated_by: record.created_by || null,
      notes: 'Shipment created',
    });
    return id;
  });
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

async function verifyRecoveryCode(email, code) {
  const user = await db.users.where('email').equals(email).first();
  if (!user) return null;
  
  const recoveryCode = user.recovery_codes.find(rc => rc.code === code && rc.used === 0);
  if (!recoveryCode) return null;
  
  return user;
}

async function resetUserPassword(email, recoveryCode, newPasswordHash) {
  return db.transaction('rw', db.users, async () => {
    const user = await verifyRecoveryCode(email, recoveryCode);
    if (!user) throw new Error('invalid_recovery_code');
    
    // Mark code as used
    const codeIndex = user.recovery_codes.findIndex(rc => rc.code === recoveryCode);
    user.recovery_codes[codeIndex].used = 1;
    user.recovery_codes[codeIndex].used_at = Date.now();
    user.password_hash = newPasswordHash;
    
    await db.users.put(user);
    return true;
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
  generateRecoveryCodes,
  verifyRecoveryCode,
  resetUserPassword,
};

// Keep global compatibility for any remaining non-module scripts.
window.SwiftShipDB = SwiftShipDB;
