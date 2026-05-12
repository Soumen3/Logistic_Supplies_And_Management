import { SwiftShipDB } from './db.module.js';
import { getEstimation } from './estimator.js';

(async function init() {
  // Bind UI elements synchronously first to prevent native form submission race conditions
  const form = document.getElementById('create-shipment-form');
  const msgEl = document.getElementById('form-msg');
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const logoutBtn = document.getElementById('logout-btn');

  function setError(id, message) {
    const input = document.getElementById(id);
    const err = document.getElementById('error_' + id);
    if (input) input.classList.add('border-red-500', 'bg-red-500/10');
    if (err) {
      err.textContent = message;
      err.classList.remove('hidden');
    }
  }

  function clearErrors() {
    const fields = ['source_city', 'source_state', 'source_pincode', 'source_address', 'receiver_name', 'destination_city', 'destination_state', 'destination_pincode', 'destination_address', 'package_type', 'package_weight'];
    fields.forEach(id => {
      const input = document.getElementById(id);
      const err = document.getElementById('error_' + id);
      if (input) input.classList.remove('border-red-500', 'bg-red-500/10');
      if (err) {
        err.textContent = '';
        err.classList.add('hidden');
      }
    });
    if (msgEl) {
      msgEl.classList.add('hidden');
      msgEl.className = 'hidden p-3 rounded-lg text-sm text-center font-600';
    }
  }

  // Session state to be loaded
  let session = null;
  let userName = 'Customer';

  // Attach form listener synchronously
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // If session isn't loaded yet, reject
      if (!session) {
        if (msgEl) {
          msgEl.textContent = 'Still loading session, please wait...';
          msgEl.className = 'p-3 rounded-lg text-sm text-center font-600 bg-red-500/20 text-red-400 border border-red-500/30';
          msgEl.classList.remove('hidden');
        }
        return;
      }

      clearErrors();

      const source_city = document.getElementById('source_city').value.trim();
      const source_state = document.getElementById('source_state').value.trim();
      const source_pincode = document.getElementById('source_pincode').value.trim();
      const source_address = document.getElementById('source_address').value.trim();

      const receiver_name = document.getElementById('receiver_name').value.trim();
      const destination_city = document.getElementById('destination_city').value.trim();
      const destination_state = document.getElementById('destination_state').value.trim();
      const destination_pincode = document.getElementById('destination_pincode').value.trim();
      const destination_address = document.getElementById('destination_address').value.trim();
      
      const type = document.getElementById('package_type').value;
      const weight = parseFloat(document.getElementById('package_weight').value);

      let isValid = true;

      if (!source_city) { setError('source_city', 'Required'); isValid = false; }
      if (!source_state) { setError('source_state', 'Required'); isValid = false; }
      if (!source_pincode) { setError('source_pincode', 'Required'); isValid = false; }
      if (!source_address) { setError('source_address', 'Required'); isValid = false; }
      if (!receiver_name) { setError('receiver_name', 'Required'); isValid = false; }
      if (!destination_city) { setError('destination_city', 'Required'); isValid = false; }
      if (!destination_state) { setError('destination_state', 'Required'); isValid = false; }
      if (!destination_pincode) { setError('destination_pincode', 'Required'); isValid = false; }
      if (!destination_address) { setError('destination_address', 'Required'); isValid = false; }
      if (!type) { setError('package_type', 'Required'); isValid = false; }
      if (isNaN(weight) || weight <= 0) { setError('package_weight', 'Invalid weight'); isValid = false; }

      if (!isValid) return;

      const submitBtn = document.getElementById('submit-btn');
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Calculating...';

      // Join address parts for the estimator
      // Format: "Street, City, State, Pincode"
      const senderFullAddress = `${source_address}, ${source_city}, ${source_state}, ${source_pincode}`;
      const receiverFullAddress = `${destination_address}, ${destination_city}, ${destination_state}, ${destination_pincode}`;
      const isExpress = type === 'express';

      const estimation = getEstimation(senderFullAddress, receiverFullAddress, weight, isExpress);

      const confirmModal = document.getElementById('confirmation-modal');
      const confirmDistance = document.getElementById('confirm-distance');
      const confirmTime = document.getElementById('confirm-time');
      const confirmCost = document.getElementById('confirm-cost');
      const confirmError = document.getElementById('confirm-error');

      if (estimation.status === 'Success') {
        confirmDistance.textContent = estimation.details.distance;
        confirmTime.textContent = estimation.details.deliveryTime;
        confirmCost.textContent = estimation.details.totalCost;
        confirmError.classList.add('hidden');
      } else {
        confirmDistance.textContent = 'N/A';
        confirmTime.textContent = 'N/A';
        confirmCost.textContent = 'N/A';
        confirmError.textContent = `Estimation Warning: ${estimation.message}. (We will calculate offline)`;
        confirmError.classList.remove('hidden');
      }

      // Show Modal
      confirmModal.classList.remove('hidden');

      // Setup Confirmation Buttons
      const cancelBtn = document.getElementById('cancel-confirm-btn');
      const proceedBtn = document.getElementById('proceed-confirm-btn');

      cancelBtn.onclick = () => {
        confirmModal.classList.add('hidden');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg> Create Shipment';
      };

      proceedBtn.onclick = async () => {
        proceedBtn.disabled = true;
        proceedBtn.innerHTML = 'Creating...';

        try {
          // Clean up the formatting for DB insertion
          const rawCost = estimation.status === 'Success' ? parseFloat(estimation.details.totalCost.replace(/[^0-9.]/g, '')) : 0;
          const rawDistance = estimation.status === 'Success' ? parseFloat(estimation.details.distance.replace(/[^0-9.]/g, '')) : 0;
          const rawDays = estimation.status === 'Success' ? parseInt(estimation.details.deliveryTime) : 3;

          const shipment = {
            created_by: session.user_id,
            sender_name: userName,
            sender_address: senderFullAddress, // Use the fully joined address
            source_city: source_city,
            receiver_name: receiver_name,
            receiver_address: receiverFullAddress, // Use the fully joined address
            destination_city: destination_city,
            weight_kg: weight,
            delivery_type: type,
            status: 'pending',
            distance_km: rawDistance,
            estimated_cost: rawCost,
            estimated_days: rawDays
          };

          const id = await SwiftShipDB.addShipment(shipment);

          confirmModal.classList.add('hidden');
          msgEl.textContent = 'Shipment created successfully! Redirecting...';
          msgEl.className = 'p-3 rounded-lg text-sm text-center font-600 bg-green-500/20 text-green-400 border border-green-500/30';
          msgEl.classList.remove('hidden');

          setTimeout(() => {
            location.href = '/pages/customer/my-shipments.html';
          }, 1500);

        } catch (error) {
          console.error("Failed to create shipment", error);
          proceedBtn.disabled = false;
          proceedBtn.innerHTML = 'Confirm & Pay';
          confirmError.textContent = 'An error occurred while saving to database.';
          confirmError.classList.remove('hidden');
        }
      };
    });
  }

  // Attach mobile menu listeners synchronously
  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });

    const mobileMenuLinks = mobileMenu.querySelectorAll('a');
    mobileMenuLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }

  // Attach logout listener synchronously
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

  // Now perform async operations
  session = await SwiftShipDB.getActiveSession();
  if (!session) {
    location.href = '/pages/login.html';
    return;
  }

  if (session.role !== 'customer') {
    location.href = '/pages/login.html';
    return;
  }

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

})();
