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
  const msg = el('msg');
  if (input) input.classList.add('border-red-500');
  if (msg) {
    msg.style.color = '#dc2626';
    msg.textContent = message;
  }
}

function clearErrors() {
  ['email', 'recovery_code', 'password', 'password_confirm'].forEach((id) => {
    const input = el(id);
    if (input) input.classList.remove('border-red-500');
  });
  const msg = el('msg');
  if (msg) msg.textContent = '';
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

    // Email validation
    if (!email || !email.includes('@')) {
      setError('email', 'Please enter a valid email address');
      return;
    }

    // Recovery code validation
    if (!recoveryCode || recoveryCode.length < 6) {
      setError('recovery_code', 'Please enter a valid recovery code');
      return;
    }

    // Password validation
    if (!password || password.length < 6) {
      setError('password', 'Password must be at least 6 characters');
      return;
    }

    if (password !== passwordConfirm) {
      setError('password_confirm', 'Passwords do not match');
      return;
    }

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
