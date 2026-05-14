import { SwiftShipDB } from './db.module.js';
import { calculateShipmentEstimate } from './estimator.js';

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
    const fields = ['source_city', 'source_state', 'source_pincode', 'source_address', 'sender_phone', 'receiver_name', 'receiver_phone', 'destination_city', 'destination_state', 'destination_pincode', 'destination_address', 'package_type', 'package_weight'];
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

  function normalizePhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
  }

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
      const sender_phone = normalizePhone(document.getElementById('sender_phone').value.trim());

      const receiver_name = document.getElementById('receiver_name').value.trim();
      const receiver_phone = normalizePhone(document.getElementById('receiver_phone').value.trim());
      const destination_city = document.getElementById('destination_city').value.trim();
      const destination_state = document.getElementById('destination_state').value.trim();
      const destination_pincode = document.getElementById('destination_pincode').value.trim();
      const destination_address = document.getElementById('destination_address').value.trim();
      
      const type = document.getElementById('package_type').value;
      const weight = parseFloat(document.getElementById('package_weight').value);

      let isValid = true;

      const nameRegex = /^[A-Za-z\s]{2,50}$/;
      const pinRegex = /^[1-9][0-9]{5}$/;
      const phoneRegex = /^[6-9]\d{9}$/;
      
      if (!source_city || !nameRegex.test(source_city)) { setError('source_city', 'Enter a valid city name'); isValid = false; }
      if (!source_state || !nameRegex.test(source_state)) { setError('source_state', 'Enter a valid state name'); isValid = false; }
      if (!source_pincode || !pinRegex.test(source_pincode)) { setError('source_pincode', 'Must be a 6-digit pincode'); isValid = false; }
      if (!source_address || source_address.length < 5) { setError('source_address', 'Address is too short'); isValid = false; }
      if (sender_phone && !phoneRegex.test(sender_phone)) { setError('sender_phone', 'Enter valid Indian phone number'); isValid = false; }
      
      if (!receiver_name || !nameRegex.test(receiver_name)) { setError('receiver_name', 'Enter a valid name'); isValid = false; }
      if (!receiver_phone || !phoneRegex.test(receiver_phone)) { setError('receiver_phone', 'Enter valid Indian phone number'); isValid = false; }
      if (!destination_city || !nameRegex.test(destination_city)) { setError('destination_city', 'Enter a valid city name'); isValid = false; }
      if (!destination_state || !nameRegex.test(destination_state)) { setError('destination_state', 'Enter a valid state name'); isValid = false; }
      if (!destination_pincode || !pinRegex.test(destination_pincode)) { setError('destination_pincode', 'Must be a 6-digit pincode'); isValid = false; }
      if (!destination_address || destination_address.length < 5) { setError('destination_address', 'Address is too short'); isValid = false; }
      
      if (!type) { setError('package_type', 'Required'); isValid = false; }
      if (isNaN(weight) || weight <= 0 || weight > 2000) { setError('package_weight', 'Invalid weight (max 2000kg)'); isValid = false; }

      if (!isValid) return;

      const submitBtn = document.getElementById('submit-btn');
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Calculating...';

      const pickup = {
        city: source_city,
        state: source_state,
        pincode: source_pincode,
        street: source_address
      };

      const delivery = {
        name: receiver_name,
        city: destination_city,
        state: destination_state,
        pincode: destination_pincode,
        street: destination_address
      };

      const estimation = calculateShipmentEstimate(pickup, delivery, weight, type);

      const confirmModal = document.getElementById('confirmation-modal');
      const confirmDistance = document.getElementById('confirm-distance');
      const confirmTime = document.getElementById('confirm-time');
      const confirmCost = document.getElementById('confirm-cost');
      const confirmError = document.getElementById('confirm-error');
      
      const breakdownBase = document.getElementById('breakdown-base');
      const breakdownDist = document.getElementById('breakdown-dist');
      const breakdownWeight = document.getElementById('breakdown-weight');
      const breakdownTax = document.getElementById('breakdown-tax');

      const cancelBtn = document.getElementById('cancel-confirm-btn');
      const proceedBtn = document.getElementById('proceed-confirm-btn');

      if (estimation.success) {
        confirmDistance.textContent = `${estimation.distanceKm} km`;
        confirmTime.textContent = estimation.time.label;
        confirmCost.textContent = `₹${estimation.price.total.toLocaleString()}`;
        
        breakdownBase.textContent = `₹${estimation.price.baseFare}`;
        breakdownDist.textContent = `₹${estimation.price.distanceCharge}`;
        breakdownWeight.textContent = `₹${estimation.price.weightCharge}`;
        breakdownTax.textContent = `₹${estimation.price.gst + estimation.price.fuelSurcharge}`;
        
        confirmError.classList.add('hidden');
        proceedBtn.disabled = false;
        proceedBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      } else {
        confirmDistance.textContent = 'N/A';
        confirmTime.textContent = 'N/A';
        confirmCost.textContent = 'N/A';
        breakdownBase.textContent = '—';
        breakdownDist.textContent = '—';
        breakdownWeight.textContent = '—';
        breakdownTax.textContent = '—';
        
        confirmError.textContent = `Estimation Error: ${estimation.error}`;
        confirmError.classList.remove('hidden');
        proceedBtn.disabled = true;
        proceedBtn.classList.add('opacity-50', 'cursor-not-allowed');
      }

      // Show Modal
      confirmModal.classList.remove('hidden');

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
          const rawCost = estimation.success ? estimation.price.total : 0;
          const rawDistance = estimation.success ? estimation.distanceKm : 0;
          const rawDays = estimation.success ? estimation.time.maxDays : 3;

          const shipment = {
            created_by: session.user_id,
            sender_name: userName,
            sender_phone: sender_phone || null,
            sender_address: `${source_address}, ${source_city}, ${source_state}, ${source_pincode}`, 
            source_city: source_city,
            receiver_name: receiver_name,
            receiver_phone: receiver_phone,
            receiver_address: `${destination_address}, ${destination_city}, ${destination_state}, ${destination_pincode}`,
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
    const senderPhoneInput = document.getElementById('sender_phone');
    if (senderPhoneInput && user && user.phone) {
      senderPhoneInput.value = user.phone;
    }
  } catch (error) {
    console.warn('Failed to fetch user:', error);
  }

  const userGreeting = document.getElementById('user-greeting');
  const userNameEl = document.getElementById('user-name');
  if (userGreeting) userGreeting.textContent = 'Welcome,';
  if (userNameEl) userNameEl.textContent = userName;

})();
