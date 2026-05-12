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

  // Load sidebar component and populate user info there
  const sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer) {
    try {
      const resp = await fetch('/components/sidebar.html');
      if (resp.ok) {
        const html = await resp.text();
        sidebarContainer.innerHTML = html;

        // Populate sidebar user info and stats
        const sidebarName = document.getElementById('sidebar-user-name');
        const sidebarEmail = document.getElementById('sidebar-user-email');
        const sidebarActive = document.getElementById('sidebar-active-count');
        const sidebarPending = document.getElementById('sidebar-pending-count');
        if (sidebarName) sidebarName.textContent = userName;
        if (sidebarEmail && session && session.email) sidebarEmail.textContent = session.email;
        if (sidebarActive) sidebarActive.textContent = '3';
        if (sidebarPending) sidebarPending.textContent = '1';
      }
    } catch (e) {
      console.warn('Failed to load sidebar component', e);
    }
  }

  // Mobile menu toggle
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });

    // Close menu when clicking a link
    const mobileMenuLinks = mobileMenu.querySelectorAll('a');
    mobileMenuLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
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
        await SwiftShipDB.deactivateActiveSessions();
      } catch (e) {
        console.warn('Logout cleanup failed', e);
      }
      location.href = '/pages/login.html';
    });
  }
});