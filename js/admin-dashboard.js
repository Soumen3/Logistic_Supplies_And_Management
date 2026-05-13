import { SwiftShipDB } from '../js/db.module.js';
import { getDashboardStats, getRecentActivity } from './admin-data.js';

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

// ── Stats ─────────────────────────────────────────────────────────────────────
async function loadStats() {
  const stats = await getDashboardStats();
  if (el('stat-shipments'))    el('stat-shipments').textContent    = stats.totalShipments;
  if (el('stat-users'))        el('stat-users').textContent        = stats.activeUsers;
  if (el('stat-transit'))      el('stat-transit').textContent      = stats.pendingShipments;
  if (el('stat-delivered'))    el('stat-delivered').textContent    = stats.deliveredShipments;
  if (el('stat-pending-large')) el('stat-pending-large').textContent = stats.pendingShipments;
}

// ── Recent Activity ───────────────────────────────────────────────────────────
async function loadRecentShipments() {
  const listEl = el('recent-activity-list');
  if (!listEl) return;
  const activities = await getRecentActivity(3);
  if (!activities || activities.length === 0) {
    listEl.innerHTML = '<li>No recent activity found</li>';
    return;
  }
  listEl.innerHTML = activities.map(act => `<li>${act.icon} ${act.text}</li>`).join('');
}

// ── Greeting ──────────────────────────────────────────────────────────────────
async function setupGreeting(session) {
  try {
    const user = await SwiftShipDB.getUserById(session.user_id);
    if (user && el('user-greeting')) el('user-greeting').textContent = `Welcome, ${user.full_name}`;
  } catch (e) { console.warn('Greeting error', e); }
}

// ── Logout ────────────────────────────────────────────────────────────────────
function setupLogout() {
  el('logout-btn')?.addEventListener('click', async () => {
    try { await SwiftShipDB.deactivateActiveSessions(); } catch {}
    window.location.href = '/pages/login.html';
  });
}

// ── Admin Actions (card nav via data-href) ────────────────────────────────────
function setupAdminActions() {
  document.querySelectorAll('.glass-card[data-href]').forEach(card => {
    card.addEventListener('click', () => {
      window.location.href = card.dataset.href;
    });
  });

  document.querySelectorAll('.glass-card[data-action="show-users"]').forEach(card => {
    card.addEventListener('click', openUsersModal);
  });
}

// ── Inline result card renderer ───────────────────────────────────────────────
function renderInlineResults(container, results) {
  if (!container) return;
  container.classList.remove('hidden');

  const statusColors = {
    pending:    '#fbbf24',
    in_transit: '#60a5fa',
    delivered:  '#4ade80',
    cancelled:  '#f87171'
  };

  if (results.length === 0) {
    container.innerHTML = `<p class="text-xs text-center py-3" style="color:#9baac4;">No shipments found.</p>`;
    return;
  }

  container.innerHTML = results.slice(0, 6).map(s => {
    const col = statusColors[s.status] || '#9baac4';
    return `
      <a href="/pages/admin/shipments.html"
         class="block p-3 rounded-xl border border-white/10 hover:border-white/20 transition-all"
         style="background:rgba(255,255,255,0.04);">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-700 text-white">${s.shipment_code || '—'}</span>
          <span class="text-xs font-600 capitalize" style="color:${col};">${(s.status || 'pending').replace('_', ' ')}</span>
        </div>
        <div class="text-xs" style="color:#9baac4;">${s.source_city || '—'} → ${s.destination_city || '—'}</div>
      </a>`;
  }).join('');

  if (results.length > 6) {
    container.innerHTML += `
      <a href="/pages/admin/shipments.html"
         class="block text-center text-xs font-600 mt-2 py-2 rounded-lg"
         style="color:#F59000;">View all ${results.length} results →</a>`;
  }
}

// ── Search & Filter ───────────────────────────────────────────────────────────
function setupSearchAndFilter() {
  const btnSearch   = el('open-search');
  const panelSearch = el('search-panel');
  const closeSearch = el('close-search');
  const btnFilter   = el('open-filter');
  const panelFilter = el('filter-panel');
  const closeFilter = el('close-filter');

  // Toggle visibility
  btnSearch?.addEventListener('click', () => {
    panelSearch?.classList.toggle('hidden');
    panelFilter?.classList.add('hidden');
  });
  closeSearch?.addEventListener('click', () => panelSearch?.classList.add('hidden'));

  btnFilter?.addEventListener('click', () => {
    panelFilter?.classList.toggle('hidden');
    panelSearch?.classList.add('hidden');
  });
  closeFilter?.addEventListener('click', () => panelFilter?.classList.add('hidden'));

  // ── Apply Search ──────────────────────────────────────────────────────────
  el('apply-search')?.addEventListener('click', async () => {
    const codeQ = (el('search-id')?.value || '').toLowerCase().trim();
    const nameQ = (el('search-customer')?.value || '').toLowerCase().trim();
    if (!codeQ && !nameQ) return;

    const btn = el('apply-search');
    btn.textContent = 'Searching…';
    btn.disabled = true;

    try {
      const all = await SwiftShipDB.listShipments();
      const results = all.filter(s => {
        const matchCode = !codeQ || (s.shipment_code || '').toLowerCase().includes(codeQ);
        const matchName = !nameQ || [s.sender_name, s.receiver_name].some(n => (n || '').toLowerCase().includes(nameQ));
        return matchCode && matchName;
      });
      renderInlineResults(el('search-results'), results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      btn.textContent = 'Search';
      btn.disabled = false;
    }
  });

  // ── Apply Filter ──────────────────────────────────────────────────────────
  el('apply-filter')?.addEventListener('click', async () => {
    const status = el('filter-status')?.value || '';
    const type   = el('filter-type')?.value   || '';

    const btn = el('apply-filter');
    btn.textContent = 'Filtering…';
    btn.disabled = true;

    try {
      const all = await SwiftShipDB.listShipments();
      const results = all.filter(s => {
        const matchStatus = !status || s.status === status;
        const matchType   = !type   || s.delivery_type === type;
        return matchStatus && matchType;
      });
      renderInlineResults(el('filter-results'), results);
    } catch (err) {
      console.error('Filter failed:', err);
    } finally {
      btn.textContent = 'Apply Filter';
      btn.disabled = false;
    }
  });
}

// ── Users Modal ────────────────────────────────────────────────────
const ROLE_LABELS = { admin: 'Admin', 1: 'Admin', staff: 'Staff', customer: 'Customer' };
const ROLE_COLORS = { admin: '#F59000', 1: '#F59000', staff: '#60a5fa', customer: '#4ade80' };

async function openUsersModal() {
  const modal   = el('users-modal');
  const listEl  = el('users-modal-list');
  const countEl = el('users-modal-count');
  if (!modal || !listEl) return;

  listEl.innerHTML = '<p class="text-center text-sm py-6" style="color:#9baac4;">Loading…</p>';
  modal.classList.remove('hidden');

  try {
    const users = await SwiftShipDB.db.users.toArray();
    countEl.textContent = `${users.length} user${users.length !== 1 ? 's' : ''} registered`;

    if (users.length === 0) {
      listEl.innerHTML = '<p class="text-center text-sm py-6" style="color:#9baac4;">No users found.</p>';
      return;
    }

    listEl.innerHTML = users.map(u => {
      const role     = u.role || 'customer';
      const label    = ROLE_LABELS[role] || role;
      const color    = ROLE_COLORS[role] || '#9baac4';
      const initials = (u.full_name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
      return `
        <div class="flex items-center gap-3 p-3 rounded-xl" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07);">
          <div class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-700 text-white"
               style="background:linear-gradient(135deg,#F59000,#FFAA1A);">${initials}</div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-600 text-white truncate">${u.full_name || '—'}</p>
            <p class="text-xs truncate" style="color:#9baac4;">${u.email || '—'}</p>
          </div>
          <span class="text-xs font-600 px-2 py-0.5 rounded-full flex-shrink-0"
                style="background:${color}20; color:${color}; border:1px solid ${color}40;">${label}</span>
        </div>`;
    }).join('');
  } catch (err) {
    listEl.innerHTML = '<p class="text-center text-sm py-6" style="color:#ef4444;">Failed to load users.</p>';
    console.error(err);
  }
}

function setupUsersModal() {
  const modal = el('users-modal');
  el('close-users-modal')?.addEventListener('click', () => modal?.classList.add('hidden'));
  modal?.addEventListener('click', e => {
    if (e.target === modal || e.target === modal.firstElementChild)
      modal.classList.add('hidden');
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  const blocked = await redirectIfNotAdmin();
  if (blocked) return;

  try {
    const session = await SwiftShipDB.getActiveSession();
    if (session) await setupGreeting(session);

    setupLogout();
    setupAdminActions();
    setupSearchAndFilter();
    setupUsersModal();
    await loadStats();
    await loadRecentShipments();
  } catch (error) {
    console.error('Dashboard initialization failed:', error);
  }
}

window.addEventListener('DOMContentLoaded', init);