import { SwiftShipDB } from './db.module.js';

function el(id) { return document.getElementById(id); }

function setMessage(text, type = 'info') {
  const msg = el('track-msg');
  if (!msg) return;
  msg.classList.remove('hidden');
  msg.textContent = text;
  msg.className = 'mt-4 text-sm';
  if (type === 'error') msg.classList.add('text-red-500');
  if (type === 'success') msg.classList.add('text-green-500');
  if (type === 'info') msg.classList.add('text-[#9baac4]');
}

function clearMessage() {
  const msg = el('track-msg');
  if (!msg) return;
  msg.classList.add('hidden');
  msg.textContent = '';
}

function fmtDateTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function trackShipment(code, session) {
  if (!code) {
    setMessage('Enter a shipment code to track.', 'error');
    return;
  }
  clearMessage();

  const btn = el('track-btn');
  btn.disabled = true;
  btn.textContent = 'Searching...';

  try {
    const shipment = await SwiftShipDB.getShipmentByCode(code.toUpperCase());
    if (!shipment || shipment.created_by !== session.user_id) {
      setMessage('Shipment not found for your account.', 'error');
      el('track-details').classList.add('hidden');
      return;
    }

    el('track-sender').textContent = shipment.sender_name || '—';
    el('track-receiver').textContent = shipment.receiver_name || '—';
    el('track-route').textContent = `${shipment.source_city || '—'} → ${shipment.destination_city || '—'}`;
    el('track-status').textContent = shipment.status || 'pending';
    el('track-details').classList.remove('hidden');

    const history = await SwiftShipDB.getShipmentHistory(shipment.id);
    const timeline = el('track-timeline');
    if (!history || history.length === 0) {
      timeline.innerHTML = '<p class="text-sm" style="color:#9baac4;">No history available.</p>';
      return;
    }

    history.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    timeline.innerHTML = history.map((item, index) => {
      const note = item.notes ? item.notes : '—';
      const isLast = index === history.length - 1;
      return `
        <div class="flex gap-4">
          <div class="flex flex-col items-center">
            <div class="w-4 h-4 rounded-full bg-[#F59000] flex items-center justify-center ring-4 ring-[#F59000]/20">
              <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
            </div>
            ${!isLast ? `<div class="w-0.5 h-full bg-white/10 my-1"></div>` : ''}
          </div>
          <div class="pb-6 flex-1">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-600 text-white">${item.status || 'pending'}</span>
              <span class="text-xs" style="color:#9baac4;">${fmtDateTime(item.timestamp)}</span>
            </div>
            <div class="text-xs" style="color:#9baac4;">${note}</div>
          </div>
        </div>`;
    }).join('');
  } catch (err) {
    console.error('Track failed:', err);
    setMessage('Failed to track shipment.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Track';
  }
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

  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const openBtn = document.getElementById('mobile-menu-toggle');
  const closeBtn = document.getElementById('close-sidebar');
  const toggleSidebar = () => {
    sidebar?.classList.toggle('-translate-x-full');
    overlay?.classList.toggle('hidden');
  };
  openBtn?.addEventListener('click', toggleSidebar);
  closeBtn?.addEventListener('click', toggleSidebar);
  overlay?.addEventListener('click', toggleSidebar);

  const trackForm = el('track-form');
  trackForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = el('track-code').value.trim();
    trackShipment(code, session);
    
    const url = new URL(window.location);
    url.searchParams.set('code', code);
    window.history.pushState({}, '', url);
  });

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (code) {
    el('track-code').value = code;
    trackShipment(code, session);
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
});
