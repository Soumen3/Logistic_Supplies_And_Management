import { SwiftShipDB } from './db.module.js';

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

function setError(fieldId, message) {
  const input = el(fieldId);
  const msg = el('msg'); // fallback message box
  const inlineError = el('error_' + fieldId);

  if (input) input.classList.add('error');
  
  if (inlineError) {
    inlineError.textContent = message;
    inlineError.classList.remove('hidden');
  } else if (msg) {
    msg.style.color = '#dc2626';
    msg.textContent = message;
    msg.classList.remove('hidden');
  }
}

function clearErrors() {
  ['email', 'recovery_code', 'password', 'password_confirm'].forEach((id) => {
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
  const form = el('forgot-password-form');
  const msg = el('msg');
  if (!form || !msg) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors();

    const email = el('email').value.trim().toLowerCase();
    const recoveryCode = el('recovery_code').value.trim().toUpperCase();
    const password = el('password').value;
    const passwordConfirm = el('password_confirm').value;

    let isValid = true;

    // Email validation
    if (!email || !email.includes('@')) {
      setError('email', 'Please enter a valid email address');
      isValid = false;
    }

    // Recovery code validation
    if (!recoveryCode || recoveryCode.length < 6) {
      setError('recovery_code', 'Please enter a valid recovery code');
      isValid = false;
    }

    // Password validation
    if (!password || password.length < 6) {
      setError('password', 'Password must be at least 6 characters');
      isValid = false;
    }

    if (password !== passwordConfirm) {
      setError('password_confirm', 'Passwords do not match');
      isValid = false;
    }

    if (!isValid) return;

    try {
      msg.style.color = '#6b7280';
      msg.textContent = 'Verifying recovery code...';

      // Verify recovery code
      const user = await SwiftShipDB.verifyRecoveryCode(email, recoveryCode);
      if (!user) {
        setError('recovery_code', 'Invalid email or recovery code');
        return;
      }

      msg.style.color = '#6b7280';
      msg.textContent = 'Resetting password...';

      // Hash new password
      const passwordHash = await hashPassword(password);

      // Reset password
      await SwiftShipDB.resetUserPassword(email, recoveryCode, passwordHash);

      msg.style.color = '#10b981';
      msg.textContent = 'Password reset successfully! Redirecting to login...';
      
      setTimeout(() => {
        window.location.href = '/pages/login.html';
      }, 1500);
    } catch (error) {
      console.error(error);
      msg.style.color = '#dc2626';
      msg.textContent = error.message === 'invalid_recovery_code' 
        ? 'Invalid recovery code' 
        : 'Password reset failed. Try again.';
    }
  });
}

window.addEventListener('DOMContentLoaded', init);
