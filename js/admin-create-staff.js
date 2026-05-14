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

// ✅ Phone Normalization - Extract last 10 digits
function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-10);
}

// ✅ Error UI
function setError(fieldId, message) {
  const input = el(fieldId);
  const errEl = el('error_' + fieldId);

  if (input) input.classList.add('border-red-500');
  
  if (errEl) {
    errEl.classList.remove('hidden');
    errEl.textContent = message;
  }
}

function clearErrors() {
  ['full_name', 'phone', 'email', 'password', 'password_confirm'].forEach(id => {
    const input = el(id);
    const errEl = el('error_' + id);
    
    if (input) input.classList.remove('border-red-500');
    if (errEl) {
      errEl.classList.add('hidden');
      errEl.textContent = '';
    }
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

  // ✅ CLEAR ERRORS ON INPUT
  ['full_name', 'phone', 'email', 'password', 'password_confirm'].forEach(id => {
    el(id)?.addEventListener('input', () => {
      const input = el(id);
      const errEl = el('error_' + id);
      if (input) input.classList.remove('border-red-500');
      if (errEl) {
        errEl.classList.add('hidden');
        errEl.textContent = '';
      }
      if (msg) msg.textContent = '';
    });
  });

  // ✅ PASSWORD TOGGLE
  const togglePw = el('toggle-pw');
  const eyeIcon = el('eye-icon');
  const passwordInput = el('password');

  if (togglePw && passwordInput) {
    togglePw.addEventListener('click', (e) => {
      e.preventDefault();
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
    });
  }

  const togglePw2 = el('toggle-pw2');
  const eyeIcon2 = el('eye-icon2');
  const passwordConfirmInput = el('password_confirm');

  if (togglePw2 && passwordConfirmInput) {
    togglePw2.addEventListener('click', (e) => {
      e.preventDefault();
      const isPassword = passwordConfirmInput.type === 'password';
      passwordConfirmInput.type = isPassword ? 'text' : 'password';
    });
  }

  // ✅ PASSWORD STRENGTH BAR (using register.html formula)
  const strengthLevels = [
    { w: '20%', bg: '#ef4444', text: 'Too weak' },
    { w: '45%', bg: '#f97316', text: 'Weak' },
    { w: '65%', bg: '#eab308', text: 'Fair' },
    { w: '85%', bg: '#22c55e', text: 'Strong' },
    { w: '100%', bg: '#10b981', text: 'Very strong' }
  ];

  function updatePasswordStrength(password) {
    const strengthFill = el('strength-fill');
    const strengthLabel = el('strength-label');
    if (!strengthFill || !strengthLabel) return;

    if (!password) {
      strengthFill.style.width = '0%';
      strengthLabel.textContent = '';
      return;
    }

    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const level = strengthLevels[Math.min(score, 4)];
    strengthFill.style.width = level.w;
    strengthFill.style.background = level.bg;
    strengthLabel.textContent = level.text;
    strengthLabel.style.color = level.bg;
  }

  if (passwordInput) {
    passwordInput.addEventListener('input', (e) => {
      updatePasswordStrength(e.target.value);

      // Also check password match
      if (passwordConfirmInput && passwordConfirmInput.value) {
        updatePasswordMatch();
      }
    });
  }

  // ✅ PASSWORD MATCH INDICATOR
  function updatePasswordMatch() {
    const matchLabel = el('match-label');
    if (!matchLabel || !passwordInput || !passwordConfirmInput) return;

    const pw1 = passwordInput.value;
    const pw2 = passwordConfirmInput.value;

    if (!pw2) {
      matchLabel.classList.add('hidden');
      return;
    }

    if (pw1 === pw2) {
      matchLabel.classList.remove('hidden');
      matchLabel.textContent = '✓ Passwords match';
      matchLabel.style.color = '#10b981';
    } else {
      matchLabel.classList.remove('hidden');
      matchLabel.textContent = '✗ Passwords do not match';
      matchLabel.style.color = '#ef4444';
    }
  }

  if (passwordConfirmInput) {
    passwordConfirmInput.addEventListener('input', updatePasswordMatch);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors();

    const fullName = el('full_name')?.value.trim();
    const phone = el('phone')?.value.trim();
    const email = el('email')?.value.trim().toLowerCase();
    const password = el('password')?.value;
    const passwordConfirm = el('password_confirm')?.value;

    // ✅ VALIDATION - Check ALL fields and collect errors
    const errors = {};
    let hasErrors = false;

    if (!validateFullName(fullName)) {
      errors.full_name = 'Please enter a valid full name (First and Last).';
      hasErrors = true;
    }

    if (!validatePhone(phone)) {
      errors.phone = 'Please enter a valid Indian phone number.';
      hasErrors = true;
    }

    if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address.';
      hasErrors = true;
    }

    if (!validatePassword(password)) {
      errors.password = 'Password must be 6+ chars and include letters and numbers.';
      hasErrors = true;
    }

    if (password !== passwordConfirm) {
      errors.password_confirm = 'Passwords do not match.';
      hasErrors = true;
    }

    // ✅ SHOW ALL ERRORS AT ONCE
    if (hasErrors) {
      Object.keys(errors).forEach(fieldId => {
        setError(fieldId, errors[fieldId]);
      });
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
      const normalizedPhone = normalizePhone(phone);

      await SwiftShipDB.addUser({
        email,
        password_hash: passwordHash,
        full_name: fullName,
        phone: normalizedPhone,
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