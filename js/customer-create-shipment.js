import { SwiftShipDB } from './db.module.js';

window.addEventListener('DOMContentLoaded', async () => {
  const session = await SwiftShipDB.getActiveSession();
  if (!session) {
    location.href = '/pages/login.html';
    return;
  }

  if (session.role !== 'customer') {
    location.href = '/pages/login.html';
    return;
  }

  let userName = 'Customer';
  try {
    const user = await SwiftShipDB.getUserById(session.user_id);
    if (user && user.full_name) {
      userName = user.full_name.split(' ')[0];
    }
  } catch (error) {
    console.warn('Failed to fetch user:', error);
  }

  const userGreeting = document.getElementById('user-greeting');
  const userNameEl = document.getElementById('user-name');
  if (userGreeting) userGreeting.textContent = 'Welcome,';
  if (userNameEl) userNameEl.textContent = userName;

  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });

    const mobileMenuLinks = mobileMenu.querySelectorAll('a');
    mobileMenuLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }

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
