import { SwiftShipDB } from '../js/db.module.js';

function el(id) { return document.getElementById(id); }

let allShipments = [];
let filtered = [];

async function redirectIfNotStaff() {
  try {
    const session = await SwiftShipDB.getActiveSession();
    if (!session || (session.role !== 'staff' && session.role !== 'admin')) {
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

function setupSidebarToggle() {
  const sidebar = el('sidebar');
  const overlay = el('sidebar-overlay');
  const openBtn = el('mobile-menu-toggle');
  const closeBtn = el('close-sidebar');

  const toggle = () => {
    sidebar?.classList.toggle('-translate-x-full');
    overlay?.classList.toggle('hidden');
  };

  openBtn?.addEventListener('click', toggle);
  closeBtn?.addEventListener('click', toggle);
  overlay?.addEventListener('click', toggle);
}

function statusBadge(status) {
  const map = {
    pending:    ['badge-pending',    'Pending'],
    in_transit: ['badge-in_transit', 'In Transit'],
    delivered:  ['badge-delivered',  'Delivered'],
    cancelled:  ['badge-cancelled',  'Cancelled'],
  };
  const [cls, label] = map[status] || ['badge-pending', status || 'pending'];
  return `<span class="badge ${cls}">${label}</span>`;
}

function typeLabel(t) {
  if (t === 'express') return '<span class="text-xs font-600" style="color:#F59000;">Express</span>';
  return '<span class="text-xs" style="color:var(--text-muted);">Standard</span>';
}

function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtCost(c) {
  if (!c && c !== 0) return '—';
  return `₹${Number(c).toLocaleString('en-IN')}`;
}

function renderTable() {
  const tbody = el('shipments-tbody');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center py-12" style="color:var(--text-muted);">
          No shipments found
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(s => `
    <tr>
      <td><span class="font-600" style="color:var(--text-head);">${s.shipment_code || '—'}</span></td>
      <td>${s.sender_name || '—'}</td>
      <td>${s.receiver_name || '—'}</td>
      <td>
        <span style="color:var(--text-muted);">${s.source_city || '—'}</span>
        <span class="mx-1" style="color:#F59000;">→</span>
        <span style="color:var(--text-muted);">${s.destination_city || '—'}</span>
      </td>
      <td>${typeLabel(s.delivery_type)}</td>
      <td style="color:var(--text-muted);">${s.weight_kg != null ? s.weight_kg + ' kg' : '—'}</td>
      <td class="font-600" style="color:#F59000;">${fmtCost(s.estimated_cost)}</td>
      <td>${statusBadge(s.status || 'pending')}</td>
      <td style="color:var(--text-muted);">${fmtDate(s.created_at)}</td>
      <td class="text-center">
        <a href="/pages/staff/track-shipment.html?code=${encodeURIComponent(s.shipment_code || '')}"
           class="px-3 py-1.5 rounded-lg text-xs font-600" style="border:1px solid var(--border); color:var(--text-body);">
          View
        </a>
      </td>
    </tr>
  `).join('');
}

function applyFilters() {
  const q = (el('search-input')?.value || '').toLowerCase().trim();
  const status = el('filter-status')?.value || '';
  const type = el('filter-type')?.value || '';

  filtered = allShipments.filter(s => {
    const matchQ = !q || [
      s.shipment_code, s.sender_name, s.receiver_name,
      s.source_city, s.destination_city
    ].some(v => (v || '').toLowerCase().includes(q));

    const matchStatus = !status || s.status === status;
    const matchType = !type || s.delivery_type === type;

    return matchQ && matchStatus && matchType;
  });

  renderTable();
}

function setupFilters() {
  el('search-input')?.addEventListener('input', applyFilters);
  el('filter-status')?.addEventListener('change', applyFilters);
  el('filter-type')?.addEventListener('change', applyFilters);
  el('clear-filters')?.addEventListener('click', () => {
    if (el('search-input')) el('search-input').value = '';
    if (el('filter-status')) el('filter-status').value = '';
    if (el('filter-type')) el('filter-type').value = '';
    applyFilters();
  });
}

async function loadShipments() {
  try {
    allShipments = await SwiftShipDB.listShipments();
    allShipments.sort((a, b) => {
      const aTime = a.updated_at || a.created_at || 0;
      const bTime = b.updated_at || b.created_at || 0;
      return bTime - aTime;
    });
    filtered = [...allShipments];
    renderTable();
  } catch (err) {
    console.error('Failed to load shipments:', err);
    const tbody = el('shipments-tbody');
    if (tbody) {
      tbody.innerHTML = `
        <tr><td colspan="10" class="text-center py-12" style="color:#ef4444;">Failed to load shipments.</td></tr>
      `;
    }
  }
}

async function init() {
  const blocked = await redirectIfNotStaff();
  if (blocked) return;

  await setupGreeting();
  setupLogout();
  setupSidebarToggle();
  setupFilters();
  await loadShipments();
}

window.addEventListener('DOMContentLoaded', init);
