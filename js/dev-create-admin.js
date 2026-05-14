import { SwiftShipDB } from '../js/db.module.js';

// Developer token - Change this to a strong secret!
// In production, this could come from environment variables or config
const DEVELOPER_TOKEN = 'SwiftShipDevSecret2026';

function el(id) {
  return document.getElementById(id);
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function validateFullName(name) {
  const pattern = /^(?=.{3,}$)[A-Za-z]{2,}(?:\s[A-Za-z]{2,})+$/;
  return pattern.test(name);
}

function validateEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

function validatePhone(phone) {
  return /^[6-9]\d{9}$/.test(normalizePhone(phone));
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function validatePassword(password) {
  if (!password || password.length < 6) return false;
  return /(?=.*[A-Za-z])(?=.*\d).+/.test(password);
}

function setError(fieldId, message) {
  const input = el(fieldId);
  const msg = el('msg'); // fallback message box
  const inlineError = el('error_' + fieldId);

  if (input) input.classList.add('error');

  if (inlineError) {
    inlineError.textContent = message;
    inlineError.classList.remove('hidden');
  } else if (msg) {
    msg.style.color = 'red';
    msg.textContent = message;
    msg.classList.remove('hidden');
  }
}

function clearErrors() {
  ['dev_token', 'full_name', 'phone', 'email', 'password', 'password_confirm'].forEach((id) => {
    const input = el(id);
    if (input) input.classList.remove('error');
    const inlineError = el('error_' + id);
    if (inlineError) {
      inlineError.textContent = '';
      inlineError.classList.add('hidden');
    }
  });

  const msg = el('msg');
  if (msg) {
    msg.textContent = '';
    msg.classList.add('hidden');
  }
}

async function init() {
  // If user is already logged in, redirect them
  try {
    const session = await SwiftShipDB.getActiveSession();
    if (session) {
      const roleStr = String(session.role).toLowerCase();
      if (roleStr === 'admin' || roleStr === '1') {
        window.location.href = '/pages/admin/dashboard.html';
      } else if (roleStr === 'staff' || roleStr === '2') {
        window.location.href = '/pages/staff/dashboard.html';
      } else {
        window.location.href = '/pages/customer/dashboard.html';
      }
      return;
    }
  } catch (e) {
    console.error("Session check failed", e);
  }

  const form = el('dev-create-admin-form');
  const msg = el('msg');
  if (!form || !msg) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors();

    const devToken = el('dev_token').value;
    const fullName = el('full_name').value.trim();
    const phone = normalizePhone(el('phone').value.trim());
    const email = el('email').value.trim().toLowerCase();
    const password = el('password').value;
    const passwordConfirm = el('password_confirm').value;

    let isValid = true;

    // Verify developer token
    if (devToken !== DEVELOPER_TOKEN) {
      setError('dev_token', 'Invalid developer token.');
      isValid = false;
    }

    if (!validateFullName(fullName)) {
      setError('full_name', 'Please enter a valid full name (First and Last).');
      isValid = false;
    }

    if (!validatePhone(phone)) {
      setError('phone', 'Please enter a valid Indian phone number.');
      isValid = false;
    }

    if (!validateEmail(email)) {
      setError('email', 'Please enter a valid email address.');
      isValid = false;
    }

    if (!validatePassword(password)) {
      setError('password', 'Password must be 6+ chars and include letters and numbers.');
      isValid = false;
    }

    if (password !== passwordConfirm) {
      setError('password_confirm', 'Passwords do not match.');
      isValid = false;
    }

    if (!isValid) return;

    const submitBtn = el('submit-btn');
    const btnText = el('btn-text');

    if (submitBtn) submitBtn.disabled = true;
    if (btnText) btnText.textContent = 'Creating Admin...';

    try {
      const existing = await SwiftShipDB.getUserByEmail(email);
      if (existing) {
        setError('email', 'An account with that email already exists.');
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.textContent = 'Create Admin User';
        return;
      }

      const passwordHash = await hashPassword(password);
      await SwiftShipDB.addUser({
        email,
        password_hash: passwordHash,
        full_name: fullName,
        phone,
        role: 'admin',
      });

      msg.style.color = 'green';
      msg.textContent = 'Admin user created successfully! Redirecting to login...';
      setTimeout(() => {
        window.location.href = '/pages/login.html';
      }, 1500);
    } catch (error) {
      if (submitBtn) submitBtn.disabled = false;
      if (btnText) btnText.textContent = 'Create Admin User';
      console.error(error);
      if (error && error.message === 'phone_required') {
        setError('phone', 'Phone number is required.');
        return;
      }

      msg.style.color = 'red';
      msg.textContent = 'Failed to create admin. Try again.';
      msg.classList.remove('hidden');
    }
  });
}

window.addEventListener('DOMContentLoaded', init);
