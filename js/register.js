import { SwiftShipDB, getDashboardPathForRole } from './db.module.js';

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
  console.log("Validating name");
  const pattern = /^(?=.{3,}$)[A-Za-z]{2,}(?:\s[A-Za-z]{2,})+$/;
  return pattern.test(name);
}

function validateEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

function validatePhone(phone) {
  const allowedChars = /^[0-9+\s]+$/;
  const pattern = /^(?:\+91|91)?\s?[6-9]\d{9}$/;
  return allowedChars.test(phone) && pattern.test(phone);
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

function showRecoveryCodes(recoveryCodes) {
  // Hide form
  const form = el('register-form');
  if (form) form.style.display = 'none';

  // Show recovery codes section
  const section = el('recovery-codes-section');
  if (section) section.classList.remove('hidden');

  // Populate recovery codes
  const codesList = el('recovery-codes-list');
  if (codesList) {
    codesList.innerHTML = '';
    recoveryCodes.forEach((rc, idx) => {
      const codeDiv = document.createElement('div');
      codeDiv.textContent = `${idx + 1}. ${rc.code}`;
      codesList.appendChild(codeDiv);
    });
  }

  // Setup copy button
  const copyBtn = el('copy-codes-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const codesText = recoveryCodes.map((rc, idx) => `${idx + 1}. ${rc.code}`).join('\n');
      navigator.clipboard.writeText(codesText).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = 'Copy All';
        }, 2000);
      });
    });
  }

  // Setup download button
  const downloadBtn = el('download-codes-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const codesText = recoveryCodes.map((rc, idx) => `${idx + 1}. ${rc.code}`).join('\n');
      const blob = new Blob([`SwiftShip Recovery Codes\n========================\n\nSave these codes in a safe place.\nYou will need one to reset your password.\n\n${codesText}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'swiftship-recovery-codes.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // Setup continue button
  const continueBtn = el('continue-login-btn');
  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      window.location.href = '/pages/login.html';
    });
  }
}

async function redirectIfLoggedIn() {
  try {
    const session = await SwiftShipDB.getActiveSession();
    if (session) {
      window.location.href = getDashboardPathForRole(session.role);
      return true;
    }
  } catch (e) {
    // ignore and allow registration
  }
  return false;
}

async function init() {
  await redirectIfLoggedIn();

  const form = el('register-form');
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

    if (!validateFullName(fullName)) {
      setError('full_name', 'Please enter valid full name (3+ characters).');
      isValid = false;
    }

    if (!validatePhone(phone)) {
      setError('phone', 'Please enter a valid phone number (minimum 10 digits).');
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
    if (btnText) btnText.textContent = 'Creating account...';

    try {
      const existing = await SwiftShipDB.getUserByEmail(email);
      if (existing) {
        setError('email', 'An account with that email already exists.');
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.textContent = 'Create account';
        return;
      }

      const passwordHash = await hashPassword(password);
      await SwiftShipDB.addUser({
        email,
        password_hash: passwordHash,
        full_name: fullName,
        phone,
        role: 'customer',
      });

      // Get the newly created user to retrieve recovery codes
      const newUser = await SwiftShipDB.getUserByEmail(email);
      if (newUser && newUser.recovery_codes) {
        showRecoveryCodes(newUser.recovery_codes);
      } else {
        // Fallback if codes not immediately available
        msg.style.color = 'green';
        msg.textContent = 'Account created - redirecting to login...';
        setTimeout(() => {
          window.location.href = '/pages/login.html';
        }, 900);
      }
    } catch (error) {
      if (submitBtn) submitBtn.disabled = false;
      if (btnText) btnText.textContent = 'Create account';
      console.error(error);
      if (error && error.message === 'phone_required') {
        setError('phone', 'Phone number is required.');
        return;
      }

      msg.style.color = 'red';
      msg.textContent = 'Registration failed. Try again.';
      msg.classList.remove('hidden');
    }
  });
}

window.addEventListener('DOMContentLoaded', init);
