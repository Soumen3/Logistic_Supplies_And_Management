function el(id) { return document.getElementById(id); }

async function hashPassword(password) {
  const enc = new TextEncoder();
  const data = enc.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function waitForDB(timeout = 2000) {
  const start = Date.now();
  while (!window.SwiftShipDB && (Date.now() - start) < timeout) {
    await new Promise(r => setTimeout(r, 100));
  }
  return window.SwiftShipDB;
}

async function redirectIfLoggedIn() {
  const db = await waitForDB();
  if (!db) return false;
  try {
    const session = await db.getActiveSession();
    if (session) {
      const role = session.role;
      if (role === 1 || role === 'admin') {
        window.location.href = './admin/dashboard.html';
      } else if (role === 'staff' || role === 'staff') {
        window.location.href = './staff/dashboard.html';
      } else {
        window.location.href = './customer/dashboard.html';
      }
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';

    const email = el('email').value.trim().toLowerCase();
    const password = el('password').value;

    if (!window.SwiftShipDB) {
      msg.textContent = 'Database not ready.';
      return;
    }

    try {
      const user = await window.SwiftShipDB.getUserByEmail(email);
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
      await window.SwiftShipDB.db.sessions.add(session);
      await window.SwiftShipDB.updateLastLogin(user.id);

      msg.style.color = 'green';
      msg.textContent = 'Login successful — redirecting...';
      setTimeout(() => {
        if (user.role === 'admin'){
          window.location.href = './admin/dashboard.html';
        }else if (user.role === 'staff'){
          window.location.href = './staff/dashboard.html';
        }else {
          window.location.href = './customer/dashboard.html';
        }
      }, 700);
    } catch (err) {
      console.error(err);
      msg.textContent = 'Login failed.';
    }
  });
});
