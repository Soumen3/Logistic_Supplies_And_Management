import { SwiftShipDB } from '../js/db.module.js';

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

function validateEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

function validatePhone(phone) {
  const pattern = /^\+?[0-9\s\-()]{7,20}$/;
  return pattern.test(phone);
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
  ['full_name', 'phone', 'email', 'password', 'password_confirm'].forEach((id) => {
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

async function init() {
  // Only admins can access this page
  const isNotAdmin = await redirectIfNotAdmin();
  if (isNotAdmin) return;

  const form = el('create-staff-form');
  const msg = el('msg');
  if (!form || !msg) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors();

    const fullName = el('full_name').value.trim();
    const phone = el('phone').value.trim();
    const email = el('email').value.trim().toLowerCase();
    const password = el('password').value;
    const passwordConfirm = el('password_confirm').value;

    let isValid = true;

    if (!fullName || fullName.length < 2) {
      setError('full_name', 'Please enter staff full name (2+ characters).');
      isValid = false;
    }

    if (!validatePhone(phone)) {
      setError('phone', 'Please enter a valid phone number (minimum 7 digits).');
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

    try {
      const existing = await SwiftShipDB.getUserByEmail(email);
      if (existing) {
        setError('email', 'An account with that email already exists.');
        return;
      }

      const passwordHash = await hashPassword(password);
      await SwiftShipDB.addUser({
        email,
        password_hash: passwordHash,
        full_name: fullName,
        phone,
        role: 'staff',
      });

      msg.style.color = 'green';
      msg.textContent = 'Staff user created successfully! Redirecting...';
      setTimeout(() => {
        window.location.href = '/pages/admin/dashboard.html';
      }, 1500);
    } catch (error) {
      console.error(error);
      if (error && error.message === 'phone_required') {
        setError('phone', 'Phone number is required.');
        return;
      }

      msg.style.color = 'red';
      msg.textContent = 'Failed to create staff user. Try again.';
    }
  });
}

window.addEventListener('DOMContentLoaded', init);
