import { SwiftShipDB } from '../js/db.module.js';

function el(id) {
  return document.getElementById(id);
}

// ✅ Password Hash
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

// ✅ Validators (same logic)
function validateFullName(name) {
  const pattern = /^(?=.{3,}$)[A-Za-z]{2,}(?:\s[A-Za-z]{2,})+$/;
  return pattern.test(name);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  const allowedChars = /^[0-9+\s]+$/;
  const pattern = /^(?:\+91|91)?\s?[6-9]\d{9}$/;
  return allowedChars.test(phone) && pattern.test(phone);
}

function validatePassword(password) {
  return password && password.length >= 6 && /(?=.*[A-Za-z])(?=.*\d)/.test(password);
}

// ✅ Error UI
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
  ['full_name', 'phone', 'email', 'password', 'password_confirm'].forEach(id => {
    el(id)?.classList.remove('border-red-500');
  });

  const msg = el('msg');
  if (msg) msg.textContent = '';
}

// ✅ Admin check
async function redirectIfNotAdmin() {
  try {
    const session = await SwiftShipDB.getActiveSession();
    if (!session || (session.role !== 'admin' && session.role !== 1)) {
      window.location.href = '/pages/login.html';
      return true;
    }
    return false;
  } catch {
    window.location.href = '/pages/login.html';
    return true;
  }
}

// ✅ INIT
async function init() {

  const isNotAdmin = await redirectIfNotAdmin();
  if (isNotAdmin) return;

  const form = el('create-staff-form');
  const msg = el('msg');
  if (!form || !msg) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors();

    const fullName = el('full_name')?.value.trim();
    const phone = el('phone')?.value.trim();
    const email = el('email')?.value.trim().toLowerCase();
    const password = el('password')?.value;
    const passwordConfirm = el('password_confirm')?.value;

    // ✅ VALIDATION
    if (!validateFullName(fullName)) {
      setError('full_name', 'Please enter a valid full name (First and Last).');
      return;
    }

    if (!validatePhone(phone)) {
      setError('phone', 'Please enter a valid Indian phone number.');
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

    const submitBtn = el('submit-btn');
    const btnText = el('btn-text');

    if (submitBtn) submitBtn.disabled = true;
    if (btnText) btnText.textContent = 'Creating Staff...';

    try {

      // ✅ EXISTING CHECK
      const existing = await SwiftShipDB.getUserByEmail(email);
      if (existing) {
        setError('email', 'An account with that email already exists.');
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.textContent = 'Create Staff User';
        return;
      }

      // ✅ SAVE USER
      const passwordHash = await hashPassword(password);

      await SwiftShipDB.addUser({
        email,
        password_hash: passwordHash,
        full_name: fullName,
        phone,
        role: 'staff'
      });

      msg.style.color = 'green';
      msg.textContent = 'Staff user created successfully! Redirecting...';

      // ✅ RESET FORM
      form.reset();

      setTimeout(() => {
        window.location.href = '/pages/admin/dashboard.html';
      }, 1500);

    } catch (error) {
      if (submitBtn) submitBtn.disabled = false;
      if (btnText) btnText.textContent = 'Create Staff User';
      console.error(error);

      if (error?.message === 'phone_required') {
        setError('phone', 'Phone number is required.');
        return;
      }

      msg.style.color = 'red';
      msg.textContent = 'Failed to create staff user. Try again.';
      msg.classList.remove('hidden');
    }
  });
}

window.addEventListener('DOMContentLoaded', init);