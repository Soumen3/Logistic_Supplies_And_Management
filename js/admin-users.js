import { SwiftShipDB } from './db.module.js';

function el(id) {
  return document.getElementById(id);
}

const ROLE_LABELS = {
  admin: 'Admin',
  1: 'Admin',
  staff: 'Staff',
  customer: 'Customer',
};

const ROLE_COLORS = {
  admin: '#F59000',
  1: '#F59000',
  staff: '#60a5fa',
  customer: '#4ade80',
};

let allUsers = [];
let filteredUsers = [];
let sortValue = 'created_desc';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeRole(role) {
  if (role === 1) return 'admin';
  return String(role || 'customer').toLowerCase();
}

function getUserLabel(user) {
  const role = normalizeRole(user.role);
  return ROLE_LABELS[role] || role;
}

function getUserColor(user) {
  const role = normalizeRole(user.role);
  return ROLE_COLORS[role] || '#9baac4';
}

function summarizeRecoveryCodes(recoveryCodes) {
  if (Array.isArray(recoveryCodes)) return `${recoveryCodes.length} codes`;
  if (recoveryCodes) return '1 code';
  return '0 codes';
}

function filterUsers() {
  const query = (el('search-input')?.value || '').toLowerCase().trim();
  const role = el('filter-role')?.value || '';

  filteredUsers = allUsers.filter((user) => {
    const matchQuery = !query || [
      user.id,
      user.full_name,
      user.email,
      user.phone,
      user.role,
    ].some((value) => String(value || '').toLowerCase().includes(query));

    const matchRole = !role || normalizeRole(user.role) === role;
    return matchQuery && matchRole;
  });

  applySort();
  renderUsers();
}

function applySort() {
  const users = [...filteredUsers];
  if (sortValue === 'name_asc') {
    users.sort((a, b) => String(a.full_name || '').localeCompare(String(b.full_name || '')));
  } else if (sortValue === 'name_desc') {
    users.sort((a, b) => String(b.full_name || '').localeCompare(String(a.full_name || '')));
  } else if (sortValue === 'created_asc') {
    users.sort((a, b) => Number(a.created_at || 0) - Number(b.created_at || 0));
  } else {
    users.sort((a, b) => Number(b.created_at || 0) - Number(a.created_at || 0));
  }
  filteredUsers = users;
}

function renderStats() {
  const total = allUsers.length;
  const admins = allUsers.filter((user) => normalizeRole(user.role) === 'admin').length;
  const staff = allUsers.filter((user) => normalizeRole(user.role) === 'staff').length;
  const customers = allUsers.filter((user) => normalizeRole(user.role) === 'customer').length;

  if (el('stat-total')) el('stat-total').textContent = total;
  if (el('stat-admin')) el('stat-admin').textContent = admins;
  if (el('stat-staff')) el('stat-staff').textContent = staff;
  if (el('stat-customer')) el('stat-customer').textContent = customers;
  if (el('users-count')) el('users-count').textContent = `${filteredUsers.length} visible / ${total} total`;
}

function rowDetail(label, value) {
  return `
    <div class="flex items-start justify-between gap-2 sm:gap-4 py-1.5 sm:py-2 border-b border-white/5 last:border-b-0">
      <span class="text-xs font-600 uppercase tracking-wider flex-shrink-0" style="color:#9baac4;">${escapeHtml(label)}</span>
      <span class="text-xs sm:text-sm font-600 text-right break-all" style="color:#fff;">${escapeHtml(value || '—')}</span>
    </div>`;
}

function openDetailsModal(user) {
  const modal = el('user-modal');
  const content = el('user-modal-content');
  const title = el('user-modal-title');
  if (!modal || !content || !title) return;

  title.textContent = user.full_name || 'User Details';
  const roleLabel = getUserLabel(user);
  const color = getUserColor(user);

  content.innerHTML = `
    <div class="flex items-start gap-2 sm:gap-3 mb-4">
      <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 text-xs sm:text-sm font-700 text-white"
           style="background:linear-gradient(135deg,#F59000,#FFAA1A);">
        ${escapeHtml((user.full_name || '?').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase())}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <p class="text-sm sm:text-base font-700 text-white truncate">${escapeHtml(user.full_name || '—')}</p>
          <span class="text-xs font-600 px-2 py-0.5 rounded-full flex-shrink-0"
                style="background:${color}20; color:${color}; border:1px solid ${color}40;">${escapeHtml(roleLabel)}</span>
        </div>
        <p class="text-xs mt-1 break-all" style="color:#9baac4;">${escapeHtml(user.email || '—')}</p>
      </div>
    </div>
    <div class="rounded-lg sm:rounded-xl p-2 sm:p-3" style="background:rgba(0,0,0,0.12); border:1px solid rgba(255,255,255,0.05);">
      ${rowDetail('User ID', user.id)}
      ${rowDetail('Full Name', user.full_name)}
      ${rowDetail('Email', user.email)}
      ${rowDetail('Phone', user.phone)}
      ${rowDetail('Role', roleLabel)}
      ${rowDetail('Created At', formatDate(user.created_at))}
      ${rowDetail('Last Login', formatDate(user.last_login))}
      ${rowDetail('Recovery Codes', summarizeRecoveryCodes(user.recovery_codes))}
    </div>
  `;

  modal.classList.remove('hidden');
}

function closeDetailsModal() {
  el('user-modal')?.classList.add('hidden');
}

function renderUsers() {
  const tbody = el('users-tbody');
  if (!tbody) return;

  if (filteredUsers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-8 sm:py-12" style="color:#9baac4;">
          No users found.
        </td>
      </tr>`;
    renderStats();
    return;
  }

  tbody.innerHTML = filteredUsers.map((user) => {
    const role = normalizeRole(user.role);
    const label = getUserLabel(user);
    const color = getUserColor(user);
    return `
      <tr>
        <td>
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-700 text-white flex-shrink-0"
                 style="background:linear-gradient(135deg,#F59000,#FFAA1A);">
              ${escapeHtml((user.full_name || '?').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase())}
            </div>
            <div class="min-w-0">
              <p class="font-600 text-white truncate text-xs sm:text-sm">${escapeHtml(user.full_name || '—')}</p>
              <p class="text-xs" style="color:#9baac4; display: none; " class="sm:display">${escapeHtml(user.id || '—')}</p>
            </div>
          </div>
        </td>
        <td class="hide-on-mobile">${escapeHtml(user.email || '—')}</td>
        <td class="hide-on-mobile">${escapeHtml(user.phone || '—')}</td>
        <td class="hidden sm:table-cell"><span class="text-xs font-600 px-2 py-0.5 rounded-full" style="background:${color}20; color:${color}; border:1px solid ${color}40;">${escapeHtml(label)}</span></td>
        <td class="hide-on-mobile">${escapeHtml(formatDate(user.created_at))}</td>
        <td>
          <div class="flex items-center justify-center">
            <button class="view-user-btn px-2 sm:px-3 py-1.5 rounded-lg text-xs font-600 border border-blue-400/40 text-blue-300 hover:bg-blue-500/10 transition-all" data-id="${escapeHtml(user.id)}">View</button>
          </div>
        </td>
      </tr>`;
  }).join('');

  document.querySelectorAll('.view-user-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const user = allUsers.find((entry) => String(entry.id) === String(button.dataset.id));
      if (user) openDetailsModal(user);
    });
  });

  renderStats();
}

async function loadUsers() {
  const tbody = el('users-tbody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-8 sm:py-12" style="color:#9baac4;">
          Loading users…
        </td>
      </tr>`;
  }

  try {
    allUsers = await SwiftShipDB.db.users.toArray();
    filteredUsers = [...allUsers];
    applySort();
    renderUsers();
  } catch (error) {
    console.error('Failed to load users', error);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-8 sm:py-12" style="color:#ef4444;">
            Failed to load users.
          </td>
        </tr>`;
    }
  }
}

async function setupGreeting() {
  try {
    const session = await SwiftShipDB.getActiveSession();
    if (!session) return;
    const user = await SwiftShipDB.getUserById(session.user_id);
    if (user && el('user-greeting')) el('user-greeting').textContent = `Welcome, ${user.full_name}`;
  } catch (error) {
    console.warn('Greeting error', error);
  }
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

function setupLogout() {
  el('logout-btn')?.addEventListener('click', async () => {
    try {
      await SwiftShipDB.deactivateActiveSessions();
    } catch {}
    window.location.href = '/pages/login.html';
  });
}

function setupSidebar() {
  const sidebar = el('sidebar');
  const overlay = el('sidebar-overlay');
  const openBtn = el('mobile-menu-toggle');
  const closeBtn = el('close-sidebar');

  const toggleSidebar = () => {
    sidebar?.classList.toggle('-translate-x-full');
    overlay?.classList.toggle('hidden');
  };

  openBtn?.addEventListener('click', toggleSidebar);
  closeBtn?.addEventListener('click', toggleSidebar);
  overlay?.addEventListener('click', toggleSidebar);
}

function setupFilters() {
  el('search-input')?.addEventListener('input', filterUsers);
  el('filter-role')?.addEventListener('change', filterUsers);
  el('sort-by')?.addEventListener('change', (event) => {
    sortValue = event.target.value;
    filterUsers();
  });
  el('clear-filters')?.addEventListener('click', () => {
    if (el('search-input')) el('search-input').value = '';
    if (el('filter-role')) el('filter-role').value = '';
    if (el('sort-by')) el('sort-by').value = 'created_desc';
    sortValue = 'created_desc';
    filterUsers();
  });
}

function setupModal() {
  el('close-user-modal')?.addEventListener('click', closeDetailsModal);
  el('user-modal')?.addEventListener('click', (event) => {
    if (event.target === el('user-modal')) {
      closeDetailsModal();
    }
  });
}

async function init() {
  const blocked = await redirectIfNotAdmin();
  if (blocked) return;

  await setupGreeting();
  setupLogout();
  setupSidebar();
  setupFilters();
  setupModal();
  await loadUsers();
}

window.addEventListener('DOMContentLoaded', init);
