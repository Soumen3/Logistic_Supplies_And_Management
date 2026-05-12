import { SwiftShipDB } from './db.module.js';

(async function init() {
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

  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
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

  // --- Render Shipments ---
  const container = document.getElementById('shipments-container');
  if (container) {
    try {
      const shipments = await SwiftShipDB.listShipmentsByCreator(session.user_id);
      
      if (!shipments || shipments.length === 0) {
        container.innerHTML = `
          <div class="p-8 text-center">
            <svg class="w-12 h-12 mx-auto mb-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
            <p style="color:#9baac4;">You haven't created any shipments yet.</p>
          </div>
        `;
        return;
      }

      // Sort by newest first
      shipments.sort((a, b) => b.created_at - a.created_at);

      container.innerHTML = '';
      shipments.forEach(shipment => {
        const date = new Date(shipment.created_at).toLocaleDateString();
        const type = shipment.delivery_type === 'express' ? '<span class="px-2 py-1 text-xs font-700 bg-red-500/20 text-red-400 rounded-lg">Express</span>' : '<span class="px-2 py-1 text-xs font-700 bg-blue-500/20 text-blue-400 rounded-lg">Standard</span>';
        
        let statusColor = 'text-gray-400 bg-gray-400/20';
        if (shipment.status === 'pending') statusColor = 'text-yellow-400 bg-yellow-400/20';
        if (shipment.status === 'in_transit') statusColor = 'text-blue-400 bg-blue-400/20';
        if (shipment.status === 'delivered') statusColor = 'text-green-400 bg-green-400/20';

        const card = document.createElement('div');
        card.className = 'p-4 md:p-6 bg-white/5 border border-white/5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left transition-all hover:bg-white/10';
        
        card.innerHTML = `
          <div class="flex-1 space-y-1">
            <div class="flex items-center gap-3 mb-2">
              <span class="font-display font-800 text-lg text-white">${shipment.shipment_code}</span>
              <span class="px-2.5 py-1 text-xs font-700 rounded-lg capitalize ${statusColor}">${shipment.status.replace('_', ' ')}</span>
              ${type}
            </div>
            <div class="text-sm font-500" style="color:#9baac4;">
              <span class="text-white">${shipment.source_city}</span> &rarr; <span class="text-white">${shipment.destination_city}</span>
            </div>
            <div class="text-xs font-600" style="color:#9baac4;">
              Created on: ${date} &bull; Weight: ${shipment.weight_kg} kg &bull; Cost: ₹${shipment.estimated_cost}
            </div>
          </div>
          <div class="w-full md:w-auto flex gap-2">
            <a href="/pages/customer/track-shipment.html?code=${shipment.shipment_code}" class="flex-1 md:flex-none px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-700 rounded-xl transition-all text-center">
              Track
            </a>
          </div>
        `;
        container.appendChild(card);
      });

    } catch (err) {
      console.error('Failed to load shipments:', err);
      container.innerHTML = '<p class="text-red-400 p-4">Error loading shipments.</p>';
    }
  }
})();
