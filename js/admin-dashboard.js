import { SwiftShipDB } from '../js/db.module.js';

function el(id) {
  return document.getElementById(id);
}

async function redirectIfNotAdmin() {
  try {
    const session = await SwiftShipDB.getActiveSession();
    // If no session or not admin role, redirect to login
    if (!session || (session.role !== 'admin' && session.role !== 1)) {
      window.location.href = '/pages/login.html';
      return true;
    }
    return false;
  } catch (e) {
    // If any error, redirect to login for safety
    window.location.href = '/pages/login.html';
    return true;
  }
}

async function loadStats() {
  try {
    const shipments = await SwiftShipDB.listShipments();
    const users = await SwiftShipDB.db.users.toArray();

    const inTransit = shipments.filter(s => s.status === 'in_transit' || s.status === 'in transit').length;
    const delivered = shipments.filter(s => s.status === 'delivered').length;

    el('stat-shipments').textContent = shipments.length;
    el('stat-users').textContent = users.length;
    el('stat-transit').textContent = inTransit;
    el('stat-delivered').textContent = delivered;
  } catch (error) {
    console.warn('Failed to load stats:', error);
  }
}

async function loadRecentShipments() {
  try {
    const shipments = await SwiftShipDB.listShipments();
    const recent = shipments.slice(0, 5);

    const listEl = el('shipments-list');
    if (recent.length === 0) {
      listEl.innerHTML = '<tr><td colspan="5" class="text-center px-6 py-4 text-sm" style="color:var(--text-muted);">No shipments yet</td></tr>';
      return;
    }

    listEl.innerHTML = recent.map(ship => `
      <tr style="border-bottom:1px solid var(--border);">
        <td class="px-6 py-4 text-sm font-500" style="color:var(--text-head);">
          <a href="/pages/admin/track-shipment.html?code=${ship.shipment_code}" class="hover:underline" style="color:#F59000;">
            ${ship.shipment_code}
          </a>
        </td>
        <td class="px-6 py-4 text-sm" style="color:var(--text-body);">${ship.source_city || 'N/A'}</td>
        <td class="px-6 py-4 text-sm" style="color:var(--text-body);">${ship.destination_city || 'N/A'}</td>
        <td class="px-6 py-4 text-sm">
          <span class="px-2.5 py-1 rounded-full text-xs font-600 ${
            ship.status === 'delivered' ? 'bg-green-100 text-green-700' :
            ship.status === 'in_transit' || ship.status === 'in transit' ? 'bg-blue-100 text-blue-700' :
            'bg-amber-100 text-amber-700'
          }">
            ${ship.status || 'pending'}
          </span>
        </td>
        <td class="px-6 py-4 text-sm" style="color:var(--text-muted);">
          ${new Date(ship.created_at).toLocaleDateString()}
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.warn('Failed to load recent shipments:', error);
    const listEl = el('shipments-list');
    listEl.innerHTML = '<tr><td colspan="5" class="text-center px-6 py-4 text-sm text-red-500">Failed to load shipments</td></tr>';
  }
}

async function setupGreeting(session) {
  try {
    const user = await SwiftShipDB.getUserById(session.user_id);
    if (user) {
      const greetingEl = el('user-greeting');
      greetingEl.textContent = `Welcome, ${user.full_name}`;
    }
  } catch (error) {
    console.warn('Failed to load user:', error);
  }
}

async function setupLogout() {
  const logoutBtn = el('logout-btn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async () => {
    try {
      await SwiftShipDB.deactivateActiveSessions();
    } catch (error) {
      console.warn('Logout failed:', error);
    }
    window.location.href = '/pages/login.html';
  });
}

async function init() {
  // Check if user is admin
  const isNotAdmin = await redirectIfNotAdmin();
  if (isNotAdmin) return;

  try {
    const session = await SwiftShipDB.getActiveSession();
    if (session) {
      await setupGreeting(session);
    }

    setupLogout();
    await loadStats();
    await loadRecentShipments();
  } catch (error) {
    console.error('Dashboard initialization failed:', error);
  }
}

window.addEventListener('DOMContentLoaded', init);
