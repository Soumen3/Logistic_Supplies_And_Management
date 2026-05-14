import { SwiftShipDB } from './db.module.js';

window.addEventListener('DOMContentLoaded', async () => {
  const session = await SwiftShipDB.getActiveSession();
  if (!session) {
    // no active session — redirect to login
    location.href = '/pages/login.html';
    return;
  }

  // Redirect non-customers to login
  if (session.role !== 'customer') {
    location.href = '/pages/login.html';
    return;
  }

  // Get user details
  let userName = 'Customer';
  try {
    const user = await SwiftShipDB.getUserById(session.user_id);
    if (user && user.full_name) {
      userName = user.full_name.split(' ')[0]; // First name only
    }
  } catch (error) {
    console.warn('Failed to fetch user:', error);
  }

  // Update greeting
  const userGreeting = document.getElementById('user-greeting');
  const userNameEl = document.getElementById('user-name');
  if (userGreeting) userGreeting.textContent = 'Welcome,';
  if (userNameEl) userNameEl.textContent = userName;

  // Sidebar toggle (mobile)
  // const sidebar = document.getElementById('sidebar');
  // const overlay = document.getElementById('sidebar-overlay');
  // const openBtn = document.getElementById('mobile-menu-toggle');
  // const closeBtn = document.getElementById('close-sidebar');
  // const toggleSidebar = () => {
  //   sidebar?.classList.toggle('-translate-x-full');
  //   overlay?.classList.toggle('hidden');
  // };
  // openBtn?.addEventListener('click', toggleSidebar);
  // closeBtn?.addEventListener('click', toggleSidebar);
  // overlay?.addEventListener('click', toggleSidebar);

  const activeCount = document.getElementById('active-count');
  const deliveredCount = document.getElementById('delivered-count');
  const memberSince = document.getElementById('member-since');
  const recentActivity = document.getElementById('recent-activity');

  const refreshDashboard = async () => {
    try {
      const shipments = await SwiftShipDB.listShipmentsByCreator(session.user_id);
      shipments.sort((a, b) => {
        const aTime = a.updated_at || a.created_at || 0;
        const bTime = b.updated_at || b.created_at || 0;
        return bTime - aTime;
      });

      const active = shipments.filter(s => s.status !== 'delivered' && s.status !== 'cancelled');
      const delivered = shipments.filter(s => s.status === 'delivered');

      if (activeCount) activeCount.textContent = String(active.length);
      if (deliveredCount) deliveredCount.textContent = String(delivered.length);

      if (recentActivity) {
        if (shipments.length === 0) {
          recentActivity.textContent = 'No recent activity';
        } else {
          const last = shipments[0];
          const status = last.status ? last.status.replace('_', ' ') : 'updated';
          recentActivity.textContent = `${last.shipment_code || 'Shipment'} ${status}`;
        }
      }

      if (memberSince) {
        const user = await SwiftShipDB.getUserById(session.user_id);
        const createdAt = user?.created_at || Date.now();
        memberSince.textContent = new Date(createdAt).toLocaleDateString();
      }
    } catch (e) {
      console.warn('Failed to refresh dashboard data', e);
    }
  };

  await refreshDashboard();
  setInterval(refreshDashboard, 15000);

  // Logout handler: deactivate active sessions and go to login
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await SwiftShipDB.deactivateActiveSessions();
      } catch (e) {
        console.warn('Logout cleanup failed', e);
      }
      location.href = '/pages/login.html';
    });
  }
});