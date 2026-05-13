import { SwiftShipDB } from './db.module.js';

function el(id) { return document.getElementById(id); }

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function normalizeRole(role) {
  if (role === 1) return 'admin';
  return role || 'customer';
}

async function redirectIfNotAdmin() {
  try {
    const session = await SwiftShipDB.getActiveSession();
    if (!session || (session.role !== 'admin' && session.role !== 1)) {
      window.location.href = '/pages/login.html';
      return true;
    }
    return false;
  } catch {
    window.location.href = '/pages/login.html';
    return true;
  }
}

async function setupGreeting() {
  try {
    const session = await SwiftShipDB.getActiveSession();
    if (!session) return;
    const user = await SwiftShipDB.getUserById(session.user_id);
    if (user && el('user-greeting')) el('user-greeting').textContent = `Welcome, ${user.full_name}`;
  } catch (e) {
    console.warn('Greeting error', e);
  }
}

function setupLogout() {
  el('logout-btn')?.addEventListener('click', async () => {
    try { await SwiftShipDB.deactivateActiveSessions(); } catch {}
    window.location.href = '/pages/login.html';
  });
}

function getRangeStart(rangeKey) {
  const now = new Date();
  if (rangeKey === 'last30') return new Date(now.getTime() - 30 * DAY_MS);
  if (rangeKey === 'last90') return new Date(now.getTime() - 90 * DAY_MS);
  if (rangeKey === 'ytd') return new Date(now.getFullYear(), 0, 1);
  return new Date(now.getTime() - 7 * DAY_MS);
}

function matchesFilters(shipment, filters) {
  const createdAt = shipment.created_at || 0;
  if (filters.rangeStart && createdAt < filters.rangeStart) return false;
  if (filters.status && shipment.status !== filters.status) return false;
  if (filters.search) {
    const code = (shipment.shipment_code || '').toLowerCase();
    if (!code.includes(filters.search)) return false;
  }
  return true;
}

function formatMoney(amount) {
  const value = Number(amount || 0);
  return value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

function getDeliveryDays(shipment) {
  if (!shipment.created_at || !shipment.updated_at) return null;
  const days = (shipment.updated_at - shipment.created_at) / DAY_MS;
  return Math.max(0, days);
}

function computeOnTimeRate(delivered) {
  if (delivered.length === 0) return 0;
  const onTime = delivered.filter(s => {
    const days = getDeliveryDays(s);
    if (days === null) return true;
    if (!s.estimated_days) return true;
    return days <= s.estimated_days;
  }).length;
  return Math.round((onTime / delivered.length) * 100);
}

function updateStatusBreakdown(counts, total) {
  const pct = (key) => total === 0 ? 0 : Math.round((counts[key] || 0) * 100 / total);
  const delivered = pct('delivered');
  const transit = pct('in_transit');
  const pending = pct('pending');
  const cancelled = pct('cancelled');

  if (el('status-delivered-pct')) el('status-delivered-pct').textContent = `${delivered}%`;
  if (el('status-transit-pct')) el('status-transit-pct').textContent = `${transit}%`;
  if (el('status-pending-pct')) el('status-pending-pct').textContent = `${pending}%`;
  if (el('status-cancelled-pct')) el('status-cancelled-pct').textContent = `${cancelled}%`;

  if (el('status-delivered-bar')) el('status-delivered-bar').style.width = `${delivered}%`;
  if (el('status-transit-bar')) el('status-transit-bar').style.width = `${transit}%`;
  if (el('status-pending-bar')) el('status-pending-bar').style.width = `${pending}%`;
  if (el('status-cancelled-bar')) el('status-cancelled-bar').style.width = `${cancelled}%`;
}

function updateExceptions({ lateCount, addressCount, capacityCount }) {
  if (el('exception-late')) el('exception-late').textContent = `${lateCount} shipments over SLA`;
  if (el('exception-address')) el('exception-address').textContent = `${addressCount} shipments awaiting correction`;
  if (el('exception-capacity')) el('exception-capacity').textContent = `${capacityCount} lanes near threshold`;
}

function updateTopLanes(laneMap) {
  const list = el('top-lanes-list');
  if (!list) return;
  const sorted = Array.from(laneMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
  if (sorted.length === 0) {
    list.innerHTML = '<p class="text-sm" style="color:#9baac4;">No lanes yet.</p>';
    return;
  }
  list.innerHTML = sorted.map(([lane, count]) => {
    return `<div class="flex items-center justify-between text-sm"><span>${lane}</span><span style="color:#F59000;">${count}</span></div>`;
  }).join('');
}

function updateCarrierPerformance(groups) {
  const update = (key, pctId, barId) => {
    const pct = groups[key] || 0;
    if (el(pctId)) el(pctId).textContent = `${pct}%`;
    if (el(barId)) el(barId).style.width = `${pct}%`;
  };

  update('express', 'carrier-express-pct', 'carrier-express-bar');
  update('standard', 'carrier-standard-pct', 'carrier-standard-bar');
  update('partner', 'carrier-partner-pct', 'carrier-partner-bar');
}

function updateWeeklyTrend(shipments) {
  const bars = Array.from({ length: 7 }, (_, i) => el(`trend-bar-${i}`));
  const start = new Date(Date.now() - 6 * DAY_MS);
  start.setHours(0, 0, 0, 0);

  const counts = new Array(7).fill(0);
  shipments.forEach(s => {
    const created = s.created_at ? new Date(s.created_at) : null;
    if (!created || created < start) return;
    const day = created.getDay();
    const index = (day + 6) % 7; // Mon=0
    counts[index] += 1;
  });

  const max = Math.max(1, ...counts);
  counts.forEach((count, i) => {
    const pct = Math.max(8, Math.round((count / max) * 100));
    if (bars[i]) {
      bars[i].style.height = `${pct}%`;
      bars[i].title = `${WEEK_LABELS[i]}: ${count}`;
    }
  });
}

async function loadReports() {
  const rangeKey = el('report-range')?.value || 'last7';
  const status = el('report-status')?.value || '';
  const search = (el('report-search')?.value || '').toLowerCase().trim();
  const rangeStart = getRangeStart(rangeKey).getTime();

  let shipments = [];
  try {
    shipments = await SwiftShipDB.listShipments();
  } catch (e) {
    console.warn('Failed to load shipments', e);
    shipments = [];
  }

  const filtered = shipments.filter(s => matchesFilters(s, { rangeStart, status, search }));

  const total = filtered.length;
  const delivered = filtered.filter(s => s.status === 'delivered');
  const pending = filtered.filter(s => s.status === 'pending');
  const inTransit = filtered.filter(s => s.status === 'in_transit');
  const cancelled = filtered.filter(s => s.status === 'cancelled');

  if (el('stat-total-shipments')) el('stat-total-shipments').textContent = total.toLocaleString();
  if (el('stat-on-time')) el('stat-on-time').textContent = `${computeOnTimeRate(delivered)}%`;

  const avgDays = delivered.length
    ? (delivered.reduce((sum, s) => sum + (getDeliveryDays(s) || 0), 0) / delivered.length)
    : 0;
  if (el('stat-avg-delivery')) el('stat-avg-delivery').textContent = `${avgDays.toFixed(1)} days`;

  const revenue = filtered.reduce((sum, s) => sum + Number(s.estimated_cost || 0), 0);
  if (el('stat-revenue')) el('stat-revenue').textContent = formatMoney(revenue);

  updateStatusBreakdown({
    delivered: delivered.length,
    in_transit: inTransit.length,
    pending: pending.length,
    cancelled: cancelled.length,
  }, total);

  const lateCount = delivered.filter(s => {
    const days = getDeliveryDays(s);
    return days !== null && s.estimated_days && days > s.estimated_days;
  }).length;
  const addressCount = filtered.filter(s => !s.sender_address || !s.receiver_address).length;

  const laneMap = new Map();
  filtered.forEach(s => {
    const lane = `${s.source_city || 'Unknown'} to ${s.destination_city || 'Unknown'}`;
    laneMap.set(lane, (laneMap.get(lane) || 0) + 1);
  });
  const capacityCount = Array.from(laneMap.values()).filter(count => count >= 10).length;

  updateExceptions({ lateCount, addressCount, capacityCount });
  updateTopLanes(laneMap);

  const byType = { express: [], standard: [], partner: [] };
  filtered.forEach(s => {
    if (s.delivery_type === 'express') byType.express.push(s);
    else if (s.delivery_type === 'standard') byType.standard.push(s);
    else byType.partner.push(s);
  });
  updateCarrierPerformance({
    express: computeOnTimeRate(byType.express),
    standard: computeOnTimeRate(byType.standard),
    partner: computeOnTimeRate(byType.partner),
  });

  updateWeeklyTrend(filtered);
}

function setupFilters() {
  ['report-range', 'report-status'].forEach(id => {
    el(id)?.addEventListener('change', loadReports);
  });
  el('report-search')?.addEventListener('input', () => {
    if (el('report-search').value.length === 0 || el('report-search').value.length > 2) {
      loadReports();
    }
  });
}

async function init() {
  const blocked = await redirectIfNotAdmin();
  if (blocked) return;
  await setupGreeting();
  setupLogout();
  setupFilters();
  await loadReports();

  setInterval(loadReports, 15000);
}

window.addEventListener('DOMContentLoaded', init);
