import { SwiftShipDB } from '../js/db.module.js';
import { getDashboardStats, getRecentActivity } from './admin-data.js';

function el(id) {
  return document.getElementById(id);
}

// ✅ Auth Check
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

// ✅ STATS
async function loadStats() {
  const stats = await getDashboardStats();

  if (el('stat-shipments')) el('stat-shipments').textContent = stats.totalShipments;
  if (el('stat-users')) el('stat-users').textContent = stats.activeUsers;
  if (el('stat-transit')) el('stat-transit').textContent = stats.pendingShipments;
  if (el('stat-delivered')) el('stat-delivered').textContent = stats.deliveredShipments;
  if (el('stat-pending-large')) el('stat-pending-large').textContent = stats.pendingShipments;
}

// ✅ Recent Shipments
async function loadRecentShipments() {
  const listEl = el('recent-activity-list');
  if (!listEl) return;

  const activities = await getRecentActivity(3);

  if (!activities || activities.length === 0) {
    listEl.innerHTML = '<li>No recent activity found</li>';
    return;
  }

  listEl.innerHTML = activities.map(act => `
    <li>${act.icon} ${act.text}</li>
  `).join('');
}

// ✅ Greeting
async function setupGreeting(session) {
  try {
    const user = await SwiftShipDB.getUserById(session.user_id);
    if (user && el('user-greeting')) {
      el('user-greeting').textContent = `Welcome, ${user.full_name}`;
    }
  } catch (e) {
    console.warn("Greeting error", e);
  }
}

// ✅ Logout
function setupLogout() {
  const btn = el('logout-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    try {
      await SwiftShipDB.deactivateActiveSessions();
    } catch (e) {
      console.warn("Logout failed", e);
    }
    window.location.href = '/pages/login.html';
  });
}

// ✅ ✅ ✅ ADMIN ACTIONS (FIXED FINAL)
function setupAdminActions() {
  const cards = document.querySelectorAll('.glass-card.cursor-pointer');

  cards.forEach(card => {

    const label = card.querySelector('p')?.textContent?.trim();

    if (!label) return;

    if (label === 'Add Staff') {
      card.addEventListener('click', () => {
        window.location.href = '/pages/admin/create-staff.html';
      });
    }

    if (label === 'Manage Staff') {
      card.addEventListener('click', () => {
        window.location.href = '/pages/admin/manage-staff.html';
      });
    }

    if (label === 'Shipments') {
      card.addEventListener('click', () => {
        window.location.href = '/pages/admin/shipments.html';
      });
    }

    if (label === 'Reports') {
      card.addEventListener('click', () => {
        window.location.href = '/pages/admin/reports.html';
      });
    }

  });
}

// ✅ Search & Filter Modals
function setupSearchAndFilter() {
  const btnSearch = el('open-search');
  const panelSearch = el('search-panel');
  const closeSearch = el('close-search');
  
  const btnFilter = el('open-filter');
  const panelFilter = el('filter-panel');
  const closeFilter = el('close-filter');
  
  if (btnSearch && panelSearch) {
    btnSearch.addEventListener('click', () => {
      panelSearch.classList.toggle('hidden');
      if (panelFilter) panelFilter.classList.add('hidden');
    });
  }

  if (closeSearch && panelSearch) {
    closeSearch.addEventListener('click', () => {
      panelSearch.classList.add('hidden');
    });
  }

  if (btnFilter && panelFilter) {
    btnFilter.addEventListener('click', () => {
      panelFilter.classList.toggle('hidden');
      if (panelSearch) panelSearch.classList.add('hidden');
    });
  }

  if (closeFilter && panelFilter) {
    closeFilter.addEventListener('click', () => {
      panelFilter.classList.add('hidden');
    });
  }

  const applySearch = el('apply-search');
  if (applySearch) {
    applySearch.addEventListener('click', () => {
      panelSearch.classList.add('hidden');
      // Extend with actual search logic here later
    });
  }

  const applyFilter = el('apply-filter');
  if (applyFilter) {
    applyFilter.addEventListener('click', () => {
      panelFilter.classList.add('hidden');
      // Extend with actual filter logic here later
    });
  }
}

// ✅ INIT
async function init() {
  const blocked = await redirectIfNotAdmin();
  if (blocked) return;

  try {
    const session = await SwiftShipDB.getActiveSession();
    if (session) await setupGreeting(session);

    setupLogout();

    // ✅ IMPORTANT ADDITION
    setupAdminActions();
    setupSearchAndFilter();

    await loadStats();
    await loadRecentShipments();

  } catch (error) {
    console.error('Dashboard initialization failed:', error);
  }
}

window.addEventListener('DOMContentLoaded', init);