import { SwiftShipDB, getDashboardPathForRole } from './db.module.js';

function el(id) { return document.getElementById(id); }

async function hashPassword(password) {
  const enc = new TextEncoder();
  const data = enc.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function redirectIfLoggedIn() {
  try {
    const session = await SwiftShipDB.getActiveSession();
    if (session) {
      window.location.href = getDashboardPathForRole(session.role);
      return true;
    }
  } catch (e) {
    // allow login flow on error
  }
  return false;
}

window.addEventListener('DOMContentLoaded', async () => {
  await redirectIfLoggedIn();
  const form = el('login-form');
  const msg = el('msg');

  if (!form || !msg) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';

    const email = el('email').value.trim().toLowerCase();
    const password = el('password').value;

    try {
      const user = await SwiftShipDB.getUserByEmail(email);
      if (!user) {
        msg.textContent = 'Invalid credentials.';
        return;
      }

      const password_hash = await hashPassword(password);
      if (password_hash !== user.password_hash) {
        msg.textContent = 'Invalid credentials.';
        return;
      }

      // create session
      const session = { is_active: 1, expires_at: Date.now() + 1000 * 60 * 60 * 24 * 7, role: user.role };
      await SwiftShipDB.db.sessions.add(session);
      await SwiftShipDB.updateLastLogin(user.id);

      msg.style.color = 'green';
      msg.textContent = 'Login successful — redirecting...';
      setTimeout(() => {
        window.location.href = getDashboardPathForRole(user.role);
      }, 700);
    } catch (err) {
      console.error(err);
      msg.textContent = 'Login failed.';
    }
  });
});
