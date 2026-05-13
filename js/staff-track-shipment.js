import { SwiftShipDB } from '../js/db.module.js';

function el(id) { return document.getElementById(id); }

async function redirectIfNotStaff() {
  try {
    const session = await SwiftShipDB.getActiveSession();
    if (!session || (session.role !== 'staff' && session.role !== 'admin')) {
      window.location.href = '/pages/login.html';
      return true;
    }
    return false;
  } catch {
    window.location.href = '/pages/login.html';
    return true;
  }
}

async function setupGreeting() {
  try {
    const session = await SwiftShipDB.getActiveSession();
    if (!session) return;
    const user = await SwiftShipDB.getUserById(session.user_id);
    if (user && el('user-greeting')) el('user-greeting').textContent = `Welcome, ${user.full_name}`;
  } catch (e) {
    console.warn('Greeting error', e);
  }
}

function setupLogout() {
  el('logout-btn')?.addEventListener('click', async () => {
    try { await SwiftShipDB.deactivateActiveSessions(); } catch {}
    window.location.href = '/pages/login.html';
  });
}

function setupSidebarToggle() {
  const sidebar = el('sidebar');
  const overlay = el('sidebar-overlay');
  const openBtn = el('mobile-menu-toggle');
  const closeBtn = el('close-sidebar');

  const toggle = () => {
    sidebar?.classList.toggle('-translate-x-full');
    overlay?.classList.toggle('hidden');
  };

  openBtn?.addEventListener('click', toggle);
  closeBtn?.addEventListener('click', toggle);
  overlay?.addEventListener('click', toggle);
}

function setMessage(text, type = 'info') {
  const msg = el('track-msg');
  if (!msg) return;
  msg.classList.remove('hidden');
  msg.textContent = text;
  msg.className = 'mt-4 text-sm';
  if (type === 'error') msg.classList.add('text-red-500');
  if (type === 'success') msg.classList.add('text-green-500');
  if (type === 'info') msg.classList.add('text-[color:var(--text-muted)]');
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

async function trackShipment(code) {
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
    if (!shipment) {
      setMessage('Shipment not found. Check the code and try again.', 'error');
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
      timeline.innerHTML = '<p class="text-sm" style="color:var(--text-muted);">No history available.</p>';
      return;
    }

    history.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    timeline.innerHTML = history.map(item => {
      const note = item.notes ? item.notes : '—';
      return `
        <div class="timeline-item">
          <div class="flex items-center justify-between">
            <span class="text-sm font-600" style="color:var(--text-head);">${item.status || 'pending'}</span>
            <span class="text-xs" style="color:var(--text-muted);">${fmtDateTime(item.timestamp)}</span>
          </div>
          <div class="text-xs" style="color:var(--text-muted);">${note}</div>
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

function setupHandlers() {
  el('track-form').addEventListener('submit', (e) => {
    e.preventDefault();
    trackShipment(el('track-code').value.trim());
  });
}

async function init() {
  const blocked = await redirectIfNotStaff();
  if (blocked) return;

  await setupGreeting();
  setupLogout();
  setupSidebarToggle();
  setupHandlers();

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (code) {
    el('track-code').value = code;
    trackShipment(code);
  }
}

window.addEventListener('DOMContentLoaded', init);
