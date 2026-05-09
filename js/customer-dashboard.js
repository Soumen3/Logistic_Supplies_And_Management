import { SwiftShipDB } from './db.module.js';

window.addEventListener('DOMContentLoaded', async () => {
  const session = await SwiftShipDB.getActiveSession();
  if (!session) {
    // no active session — redirect to login
    location.href = '/pages/login.html';
    return;
  }

  // Show basic greeting / role
  const greeting = document.getElementById('user-greeting');
  if (greeting) {
    greeting.textContent = (session.role === 1) ? 'Admin' : 'Customer';
  }

  // Populate some demo values
  const activeCount = document.getElementById('active-count');
  const memberSince = document.getElementById('member-since');
  if (activeCount) activeCount.textContent = '3';
  if (memberSince) memberSince.textContent = new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toLocaleDateString();

  // Logout handler: deactivate active sessions and go to login
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await SwiftShipDB.db.sessions.where('is_active').equals(1).modify({ is_active: 0 });
      } catch (e) {
        console.warn('Logout cleanup failed', e);
      }
      location.href = '/pages/login.html';
    });
  }
});
