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

function showError(id, message) {
  const el = document.getElementById(id);
  el.textContent = message;
  el.classList.remove('hidden');
}

function clearErrors() {
  ['email-error', 'password-error'].forEach(id => {
    const el = document.getElementById(id);
    el.textContent = '';
    el.classList.add('hidden');
  });
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

window.addEventListener('DOMContentLoaded', async () => {
  await redirectIfLoggedIn();
  const form = el('login-form');
  const msg = el('msg');

  if (!form || !msg) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    clearErrors();
    msg.textContent = '';

    const email = el('email').value.trim().toLowerCase();
    const password = el('password').value;
    let isValid=true;
    
    // ✅ Email validation
    if (!email) {
      showError('email-error', 'Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      showError('email-error', 'Enter valid email');
      isValid = false;
    }
    
    // ✅ Password validation
    if (!password) {
      showError('password-error', 'Password is required');
      isValid = false;
    } else if (password.length < 6) {
      showError('password-error', 'Minimum 6 characters required');
      isValid = false;
    }

    // ❌ Stop if invalid
    if (!isValid) return;

    if (window.setLoading) window.setLoading(true);

    try {
      const user = await SwiftShipDB.getUserByEmail(email);
      if (!user) {
        if (window.setLoading) window.setLoading(false);
        msg.textContent = 'Invalid credentials.';
        msg.classList.remove('hidden');
        form.classList.add('shake');
        setTimeout(() => form.classList.remove('shake'), 400);
        return;
      }

      const password_hash = await hashPassword(password);
      if (password_hash !== user.password_hash) {
        if (window.setLoading) window.setLoading(false);
        msg.textContent = 'Invalid credentials.';
        msg.classList.remove('hidden');
        form.classList.add('shake');
        setTimeout(() => form.classList.remove('shake'), 400);
        return;
      }

      // create session
      await SwiftShipDB.createSession({
        user_id: user.id,
        role: user.role,
        expires_at: Date.now() + 1000 * 60 * 60 * 24 * 7,
      });
      await SwiftShipDB.updateLastLogin(user.id);

      msg.style.color = 'green';
      msg.textContent = 'Login successful — redirecting...';
      msg.classList.remove('hidden');
      setTimeout(() => {
        window.location.href = getDashboardPathForRole(user.role);
      }, 700);
    } catch (err) {
      if (window.setLoading) window.setLoading(false);
      console.error(err);
      msg.textContent = 'Login failed.';
      msg.classList.remove('hidden');
    }
  });
});
