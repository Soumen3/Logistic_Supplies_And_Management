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

function validateEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

function validatePhone(phone) {
  const cleaned = phone.replace(/[^0-9]/g, '');
  return cleaned.length >= 7;
}

function validatePassword(password) {
  if (!password || password.length < 6) return false;
  return /(?=.*[A-Za-z])(?=.*\d).+/.test(password);
}

function setError(fieldId, message) {
  const input = el(fieldId);
  const msg = el('msg');
  if (input) input.classList.add('border-red-500');
  if (msg) {
    msg.style.color = 'red';
    msg.textContent = message;
  }
}

function clearErrors() {
  ['dev_token', 'full_name', 'phone', 'email', 'password', 'password_confirm'].forEach((id) => {
    const input = el(id);
    if (input) input.classList.remove('border-red-500');
  });

  const msg = el('msg');
  if (msg) msg.textContent = '';
}

async function init() {
  const form = el('dev-create-admin-form');
  const msg = el('msg');
  if (!form || !msg) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors();

    const devToken = el('dev_token').value;
    const fullName = el('full_name').value.trim();
    const phone = el('phone').value.trim();
    const email = el('email').value.trim().toLowerCase();
    const password = el('password').value;
    const passwordConfirm = el('password_confirm').value;

    // Verify developer token
    if (devToken !== DEVELOPER_TOKEN) {
      setError('dev_token', 'Invalid developer token.');
      return;
    }

    if (!fullName || fullName.length < 2) {
      setError('full_name', 'Please enter admin full name (2+ characters).');
      return;
    }

    if (!validatePhone(phone)) {
      setError('phone', 'Please enter a valid phone number (minimum 7 digits).');
      return;
    }

    if (!validateEmail(email)) {
      setError('email', 'Please enter a valid email address.');
      return;
    }

    if (!validatePassword(password)) {
      setError('password', 'Password must be 6+ chars and include letters and numbers.');
      return;
    }

    if (password !== passwordConfirm) {
      setError('password_confirm', 'Passwords do not match.');
      return;
    }

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
        role: 'admin',
      });

      msg.style.color = 'green';
      msg.textContent = 'Admin user created successfully! Redirecting to login...';
      setTimeout(() => {
        window.location.href = '/pages/login.html';
      }, 1500);
    } catch (error) {
      console.error(error);
      if (error && error.message === 'phone_required') {
        setError('phone', 'Phone number is required.');
        return;
      }

      msg.style.color = 'red';
      msg.textContent = 'Failed to create admin. Try again.';
    }
  });
}

window.addEventListener('DOMContentLoaded', init);
