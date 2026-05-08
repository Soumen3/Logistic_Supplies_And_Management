window.addEventListener('DOMContentLoaded', async () => {
  if (!window.SwiftShipDB) {
    console.error('DB not ready');
    // Wait for db to initialize then reload
    setTimeout(() => location.href = '../login.html', 500);
    return;
  }

  const session = await window.SwiftShipDB.getActiveSession();
  if (!session) {
    // no active session — redirect to login
    location.href = '../login.html';
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
        await window.SwiftShipDB.db.sessions.where('is_active').equals(1).modify({ is_active: 0 });
      } catch (e) {
        console.warn('Logout cleanup failed', e);
      }
      location.href = '../login.html';
    });
  }
});
