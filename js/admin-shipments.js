import { SwiftShipDB } from './db.module.js';

const PAGE_SIZE = 10;

let allShipments = [];
let filtered = [];
let currentPage = 1;
let pendingStatusUpdate = null; // { id, code }
let pendingDelete = null;       // { id, code }

function el(id) { return document.getElementById(id); }

// ── Auth ──────────────────────────────────────────────────────────────────────
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

// ── Greeting & Logout ─────────────────────────────────────────────────────────
async function setupGreeting() {
  try {
    const session = await SwiftShipDB.getActiveSession();
    if (!session) return;
    const user = await SwiftShipDB.getUserById(session.user_id);
    if (user && el('user-greeting')) el('user-greeting').textContent = `Welcome, ${user.full_name}`;
  } catch { }
}

function setupLogout() {
  el('logout-btn')?.addEventListener('click', async () => {
    await SwiftShipDB.deactivateActiveSessions();
    window.location.href = '/pages/login.html';
  });
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function statusBadge(status) {
  const normalized = (status || 'pending').toString().toLowerCase().replace(/\s+/g, '_');
  const map = {
    pending: ['badge-pending', '🕐 Pending'],
    in_transit: ['badge-in_transit', '🚚 In Transit'],
    delivered: ['badge-delivered', '✅ Delivered'],
    cancelled: ['badge-cancelled', '❌ Cancelled'],
  };
  const [cls, label] = map[normalized] || ['badge-pending', normalized.replace(/_/g, ' ')];
  return `<span class="badge ${cls}">${label}</span>`;
}

function typeLabel(t) {
  if (t === 'express') return '<span class="text-xs font-600" style="color:#F59000;">⚡ Express</span>';
  return '<span class="text-xs" style="color:#9baac4;">📦 Standard</span>';
}

function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function fmtCost(c) {
  if (!c && c !== 0) return '—';
  return `₹${Number(c).toLocaleString('en-IN')}`;
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function renderStats(ships) {
  el('s-total').textContent = ships.length;
  el('s-pending').textContent = ships.filter(s => s.status === 'pending').length;
  el('s-transit').textContent = ships.filter(s => s.status === 'in_transit').length;
  el('s-delivered').textContent = ships.filter(s => s.status === 'delivered').length;
}

// ── Table ─────────────────────────────────────────────────────────────────────
function renderTable() {
  const tbody = el('shipments-tbody');
  const start = (currentPage - 1) * PAGE_SIZE;
  const slice = filtered.slice(start, start + PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="10" class="text-center py-12" style="color:#9baac4;">
        <svg class="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
        No shipments found
      </td></tr>`;
    el('pagination').classList.add('hidden');
    return;
  }

  tbody.innerHTML = slice.map(s => `
    <tr class="fade-in cursor-pointer" data-id="${s.id}" data-code="${s.shipment_code || s.id}">
      <td><span class="font-600 text-white">${s.shipment_code || '—'}</span></td>
      <td>${s.sender_name || '—'}</td>
      <td class="hidden md:table-cell">${s.receiver_name || '—'}</td>
      <td>
        <span style="color:#9baac4;">${s.source_city || '—'}</span>
        <span class="mx-1" style="color:#F59000;">→</span>
        <span style="color:#9baac4;">${s.destination_city || '—'}</span>
      </td>
      <td class="hidden lg:table-cell">${typeLabel(s.delivery_type)}</td>
      <td class="hidden lg:table-cell" style="color:#9baac4;">${s.weight_kg != null ? s.weight_kg + ' kg' : '—'}</td>
      <td class="hidden md:table-cell font-600" style="color:#F59000;">${fmtCost(s.estimated_cost)}</td>
      <td>${statusBadge(s.status || 'pending')}</td>
      <td class="hidden lg:table-cell" style="color:#9baac4;">${fmtDate(s.created_at)}</td>
      <td>
        <div class="flex items-center justify-center gap-2">   
        <button
            class="view-btn px-3 py-1.5 rounded-lg text-xs font-600 border border-blue-400/40 text-blue-300 hover:bg-blue-500/10 transition-all"
            data-id="${s.id}">
            View
          </button>
          <button
            class="update-btn px-3 py-1.5 rounded-lg text-xs font-600 border border-white/10 text-white/70 hover:text-white hover:border-F59000 transition-all"
            data-id="${s.id}" data-code="${s.shipment_code || s.id}">
            Update
          </button>
          <button
            class="delete-btn px-3 py-1.5 rounded-lg text-xs font-600 border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
            data-id="${s.id}" data-code="${s.shipment_code || s.id}">
            Delete
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  // Pagination
  const pag = el('pagination');
  pag.classList.toggle('hidden', totalPages <= 1);
  if (totalPages > 1) {
    el('page-info').textContent = `Page ${currentPage} of ${totalPages} — ${filtered.length} records`;
    el('prev-page').disabled = currentPage === 1;
    el('next-page').disabled = currentPage === totalPages;
  }

  // Row button events
  document.querySelectorAll('tr[data-id]').forEach(row => {
    row.addEventListener('click', () => openHistoryModal(row.dataset.id, row.dataset.code));
  });

  document.querySelectorAll('.update-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openStatusModal(btn.dataset.id, btn.dataset.code);
    });
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openDeleteModal(btn.dataset.id, btn.dataset.code);
    });
  });
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openViewModal(btn.dataset.id);
    });
  });
}

// ── Filters ───────────────────────────────────────────────────────────────────
function applyFilters() {
  const q = (el('search-input').value || '').toLowerCase().trim();
  const status = el('filter-status').value;
  const type = el('filter-type').value;

  filtered = allShipments.filter(s => {
    const matchQ = !q || [
      s.shipment_code, s.sender_name, s.receiver_name,
      s.source_city, s.destination_city
    ].some(v => (v || '').toLowerCase().includes(q));

    const matchStatus = !status || s.status === status;
    const matchType = !type || s.delivery_type === type;

    return matchQ && matchStatus && matchType;
  });

  currentPage = 1;
  renderTable();
}

function setupFilters() {
  el('search-input').addEventListener('input', applyFilters);
  el('filter-status').addEventListener('change', applyFilters);
  el('filter-type').addEventListener('change', applyFilters);
  el('clear-filters').addEventListener('click', () => {
    el('search-input').value = '';
    el('filter-status').value = '';
    el('filter-type').value = '';
    applyFilters();
  });

  el('prev-page').addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(); } });
  el('next-page').addEventListener('click', () => {
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    if (currentPage < totalPages) { currentPage++; renderTable(); }
  });
}

// ── Load Data ─────────────────────────────────────────────────────────────────
async function loadShipments() {
  try {
    allShipments = await SwiftShipDB.listShipments();
    allShipments.sort((a, b) => {
      const aTime = a.updated_at || a.created_at || 0;
      const bTime = b.updated_at || b.created_at || 0;
      return bTime - aTime;
    });
    filtered = [...allShipments];
    renderStats(allShipments);
    renderTable();
  } catch (err) {
    console.error('Failed to load shipments:', err);
    el('shipments-tbody').innerHTML = `<tr><td colspan="10" class="text-center py-8" style="color:#ef4444;">Failed to load shipments. Please refresh.</td></tr>`;
  }
}

// ── Status Modal ──────────────────────────────────────────────────────────────
function openStatusModal(id, code) {
  pendingStatusUpdate = { id, code };
  el('modal-shipment-code').textContent = `Shipment: ${code}`;
  // pre-select current status
  const ship = allShipments.find(s => s.id === id);
  const delivered = (ship?.status || '').toString().toLowerCase().replace(/\s+/g, '_') === 'delivered';
  if (ship) el('modal-status-select').value = ship.status || 'pending';
  el('modal-status-select').disabled = delivered;
  el('modal-notes').disabled = delivered;
  el('modal-confirm').disabled = delivered;
  el('modal-confirm').textContent = delivered ? 'Delivered' : 'Update Status';
  el('modal-notes').value = '';
  el('status-modal').classList.remove('hidden');
}

function closeStatusModal() {
  el('status-modal').classList.add('hidden');
  pendingStatusUpdate = null;
}

function setupStatusModal() {
  el('modal-cancel').addEventListener('click', closeStatusModal);
  el('status-modal').addEventListener('click', e => { if (e.target === el('status-modal')) closeStatusModal(); });

  el('modal-confirm').addEventListener('click', async () => {
    if (!pendingStatusUpdate) return;
    const btn = el('modal-confirm');
    if (btn.disabled) return;
    btn.textContent = 'Updating…';
    btn.disabled = true;

    try {
      const session = await SwiftShipDB.getActiveSession();
      await SwiftShipDB.updateShipmentStatus(
        pendingStatusUpdate.id,
        el('modal-status-select').value,
        { updated_by: session?.user_id, notes: el('modal-notes').value.trim() || null }
      );
      closeStatusModal();
      await loadShipments();
    } catch (err) {
      console.error('Status update failed:', err);
      alert(err?.message === 'shipment_delivered_locked' ? 'Delivered shipments can no longer be updated.' : 'Failed to update status. Please try again.');
    } finally {
      btn.textContent = 'Update Status';
      btn.disabled = false;
    }
  });
}

// ── Delete Modal ──────────────────────────────────────────────────────────────
function openDeleteModal(id, code) {
  pendingDelete = { id, code };
  el('delete-modal-text').textContent = `Are you sure you want to permanently delete shipment ${code}? This action cannot be undone.`;
  el('delete-modal').classList.remove('hidden');
}

function closeDeleteModal() {
  el('delete-modal').classList.add('hidden');
  pendingDelete = null;
}

function setupDeleteModal() {
  el('delete-cancel').addEventListener('click', closeDeleteModal);
  el('delete-modal').addEventListener('click', e => { if (e.target === el('delete-modal')) closeDeleteModal(); });

  el('delete-confirm').addEventListener('click', async () => {
    if (!pendingDelete) return;
    const btn = el('delete-confirm');
    btn.textContent = 'Deleting…';
    btn.disabled = true;

    try {
      await SwiftShipDB.deleteShipment(pendingDelete.id);
      closeDeleteModal();
      await loadShipments();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete shipment.');
    } finally {
      btn.textContent = 'Delete';
      btn.disabled = false;
    }
  });
}

// ── History Modal ────────────────────────────────────────────────────────────
async function openHistoryModal(id, code) {
  const modal = el('history-modal');
  const list = el('history-list');
  const title = el('history-shipment-code');
  if (!modal || !list) return;

  title.textContent = `Shipment: ${code}`;
  list.innerHTML = '<p class="text-center text-sm py-6" style="color:#9baac4;">Loading history…</p>';
  modal.classList.remove('hidden');

  try {
    const history = await SwiftShipDB.getShipmentHistory(id);
    if (!history || history.length === 0) {
      list.innerHTML = '<p class="text-center text-sm py-6" style="color:#9baac4;">No status history found.</p>';
      return;
    }

    history.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    list.innerHTML = history.map(h => {
      const note = h.notes ? h.notes : '—';
      const updatedBy = h.updated_by ? `Updated by: ${h.updated_by}` : 'Updated by: —';
      return `
        <div class="p-3 rounded-xl" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);">
          <div class="flex items-center justify-between mb-1">
            ${statusBadge(h.status || 'pending')}
            <span class="text-xs" style="color:#9baac4;">${fmtDateTime(h.timestamp)}</span>
          </div>
          <div class="text-xs" style="color:#9baac4;">${updatedBy}</div>
          <div class="text-sm mt-1" style="color:#e8edf5;">${note}</div>
        </div>`;
    }).join('');
  } catch (err) {
    console.error('Failed to load history:', err);
    list.innerHTML = '<p class="text-center text-sm py-6" style="color:#ef4444;">Failed to load history.</p>';
  }
}

function closeHistoryModal() {
  el('history-modal')?.classList.add('hidden');
}

function setupHistoryModal() {
  el('history-close')?.addEventListener('click', closeHistoryModal);
  el('history-modal')?.addEventListener('click', e => {
    if (e.target === el('history-modal')) closeHistoryModal();
  });
}

function openViewModal(id) {
  const modal = el('view-modal');
  const container = el('view-details');
  const shipment = allShipments.find(s => s.id === id);

  if (!shipment) return;

  container.innerHTML = `
    <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem; margin-bottom: 1rem;">
      <p style="color:#F59000; font-weight:600; margin-bottom:0.5rem;">Shipment Info</p>
      <p><b>Code:</b> ${shipment.shipment_code || '—'}</p>
      <p><b>Status:</b> ${statusBadge(shipment.status || 'pending')}</p>
      <p><b>Type:</b> ${shipment.delivery_type || '—'}</p>
      <p><b>Created:</b> ${fmtDateTime(shipment.created_at)}</p>
    </div>

    <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem; margin-bottom: 1rem;">
      <p style="color:#F59000; font-weight:600; margin-bottom:0.5rem;">Sender Details</p>
      <p><b>Name:</b> ${shipment.sender_name || '—'}</p>
      <p><b>Phone:</b> ${shipment.sender_phone || '—'}</p>
      <p><b>Address:</b> ${shipment.sender_address || '—'}</p>
      <p><b>City:</b> ${shipment.source_city || '—'}</p>
    </div>

    <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem; margin-bottom: 1rem;">
      <p style="color:#F59000; font-weight:600; margin-bottom:0.5rem;">Receiver Details</p>
      <p><b>Name:</b> ${shipment.receiver_name || '—'}</p>
      <p><b>Phone:</b> ${shipment.receiver_phone || '—'}</p>
      <p><b>Address:</b> ${shipment.receiver_address || '—'}</p>
      <p><b>City:</b> ${shipment.destination_city || '—'}</p>
    </div>

    <div>
      <p style="color:#F59000; font-weight:600; margin-bottom:0.5rem;">Shipment Details</p>
      <p><b>Weight:</b> ${shipment.weight_kg || '—'} kg</p>
      <p><b>Distance:</b> ${shipment.distance_km || '—'} km</p>
      <p><b>Estimated Days:</b> ${shipment.estimated_days || '—'}</p>
      <p><b>Cost:</b> ${fmtCost(shipment.estimated_cost)}</p>
    </div>
  `;

  modal.classList.remove('hidden');
}

function closeViewModal() {
  el('view-modal')?.classList.add('hidden');
}

function setupViewModal() {
  el('view-close')?.addEventListener('click', closeViewModal);
  el('view-modal')?.addEventListener('click', (e) => {
    if (e.target === el('view-modal')) closeViewModal();
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  const blocked = await redirectIfNotAdmin();
  if (blocked) return;

  await setupGreeting();
  setupLogout();
  setupFilters();
  setupStatusModal();
  setupDeleteModal();
  setupHistoryModal();
  setupViewModal();
  await loadShipments();
}

window.addEventListener('DOMContentLoaded', init);
