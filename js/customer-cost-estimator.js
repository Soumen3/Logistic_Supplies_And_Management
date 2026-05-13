import { SwiftShipDB } from './db.module.js';
import { calculateShipmentEstimate } from './estimator.js';
import { getAvailableCities } from './cities.js';

function el(id) { return document.getElementById(id); }

function setMessage(text, type = 'info') {
  const msg = el('estimate-msg');
  if (!msg) return;
  msg.classList.remove('hidden');
  msg.textContent = text;
  msg.className = 'mt-4 text-sm font-500';
  if (type === 'error') msg.classList.add('text-red-500');
  if (type === 'success') msg.classList.add('text-green-500');
  if (type === 'info') msg.classList.add('text-[#9baac4]');
}

function clearMessage() {
  const msg = el('estimate-msg');
  if (!msg) return;
  msg.classList.add('hidden');
  msg.textContent = '';
}

window.addEventListener('DOMContentLoaded', async () => {
  const session = await SwiftShipDB.getActiveSession();
  if (!session) {
    location.href = '/pages/login.html';
    return;
  }

  if (session.role !== 'customer') {
    location.href = '/pages/login.html';
    return;
  }

  let userName = 'Customer';
  try {
    const user = await SwiftShipDB.getUserById(session.user_id);
    if (user && user.full_name) {
      userName = user.full_name.split(' ')[0];
    }
  } catch (error) {
    console.warn('Failed to fetch user:', error);
  }

  const userGreeting = document.getElementById('user-greeting');
  const userNameEl = document.getElementById('user-name');
  if (userGreeting) userGreeting.textContent = 'Welcome,';
  if (userNameEl) userNameEl.textContent = userName;

  // Populate cities datalist
  const citiesList = el('cities-list');
  if (citiesList) {
    const cities = getAvailableCities();
    citiesList.innerHTML = cities.map(city => `<option value="${city.toUpperCase()}">${city.toUpperCase()}</option>`).join('');
  }

  const form = el('estimate-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    clearMessage();

    const pickup = el('pickup-city').value.trim().toLowerCase();
    const delivery = el('delivery-city').value.trim().toLowerCase();
    const weight = parseFloat(el('weight').value);
    const mode = el('shipping-mode').value;

    if (!pickup || !delivery || !weight) {
      setMessage('Please fill in all fields.', 'error');
      return;
    }

    try {
      const result = calculateShipmentEstimate({ city: pickup }, { city: delivery }, weight, mode);
      
      if (!result.success) {
        setMessage(result.error || 'Failed to calculate estimate.', 'error');
        el('result-card').classList.add('hidden');
        el('result-placeholder').classList.remove('hidden');
        return;
      }

      // Show results
      el('res-distance').textContent = `${result.distanceKm} km`;
      el('res-time').textContent = result.time.label;
      el('res-cost').textContent = `₹${result.price.total}`;

      el('result-card').classList.remove('hidden');
      el('result-placeholder').classList.add('hidden');
      
      setMessage('Estimate calculated successfully.', 'success');
    } catch (err) {
      console.error('Estimate failed:', err);
      setMessage(err.message || 'Failed to calculate estimate.', 'error');
      el('result-card').classList.add('hidden');
      el('result-placeholder').classList.remove('hidden');
    }
  });

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await SwiftShipDB.deactivateActiveSessions();
      } catch (e) {
        console.warn('Logout cleanup failed', e);
      }
      location.href = '/pages/login.html';
    });
  }
});
