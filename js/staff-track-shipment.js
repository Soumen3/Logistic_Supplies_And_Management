import { SwiftShipDB } from '../js/db.module.js';

function el(id) { return document.getElementById(id); }

function statusBadge(status) {
  const normalized = (status || 'pending').toString().toLowerCase().replace(/\s+/g, '_');
  const map = {
    pending: ['bg-amber-100 text-amber-700', 'Pending'],
    in_transit: ['bg-blue-100 text-blue-700', 'In Transit'],
    delivered: ['bg-green-100 text-green-700', 'Delivered'],
    cancelled: ['bg-red-100 text-red-700', 'Cancelled'],
  };
  const [classes, label] = map[normalized] || ['bg-slate-100 text-slate-700', normalized.replace(/_/g, ' ')];
  return `<span class="px-2.5 py-1 rounded-full text-xs font-600 ${classes}">${label}</span>`;
}

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

function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function openModal() {
  el('track-modal')?.classList.remove('hidden');
  el('track-modal')?.classList.add('flex');
}

function closeModal() {
  el('track-modal')?.classList.add('hidden');
  el('track-modal')?.classList.remove('flex');
}

function shipmentRow(shipment) {
  return `
    <tr class="shipment-row cursor-pointer" data-shipment-code="${shipment.shipment_code || ''}">
      <td><span class="font-600" style="color:var(--text-head);">${shipment.shipment_code || '—'}</span></td>
      <td>${shipment.sender_name || '—'}</td>
      <td>${shipment.receiver_name || '—'}</td>
      <td>
        <span style="color:var(--text-muted);">${shipment.source_city || '—'}</span>
        <span class="mx-1" style="color:#F59000;">→</span>
        <span style="color:var(--text-muted);">${shipment.destination_city || '—'}</span>
      </td>
      <td>${shipment.delivery_type || '—'}</td>
      <td>${statusBadge(shipment.status || 'pending')}</td>
      <td style="color:var(--text-muted);">${fmtDate(shipment.updated_at || shipment.created_at)}</td>
      <td class="text-center">
        <span class="px-3 py-1.5 rounded-lg text-xs font-600" style="border:1px solid var(--border); color:var(--text-body);">Open</span>
      </td>
    </tr>`;
}

async function loadShipmentsList() {
  const list = el('shipments-list');
  if (!list) return;

  list.innerHTML = '<p class="text-sm" style="color:var(--text-muted);">Loading shipments…</p>';

  try {
    const shipments = await SwiftShipDB.listShipments();
    const sorted = [...shipments].sort((a, b) => (b.updated_at || b.created_at || 0) - (a.updated_at || a.created_at || 0));
    if (!sorted.length) {
      list.innerHTML = '<tr><td colspan="8" class="text-center py-12" style="color:var(--text-muted);">No shipments found.</td></tr>';
      return;
    }
    list.innerHTML = sorted.map(shipmentRow).join('');
  } catch (error) {
    console.error('Failed to load shipment list:', error);
    list.innerHTML = '<tr><td colspan="8" class="text-center py-12" style="color:#ef4444;">Failed to load shipments.</td></tr>';
  }
}

function openShipmentFromList(code) {
  if (!code) return;
  el('track-code').value = code;
  trackShipment(code);
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
      closeModal();
      return;
    }

    el('track-modal-code').textContent = shipment.shipment_code || '—';
    el('track-sender').textContent = shipment.sender_name || '—';
    el('track-receiver').textContent = shipment.receiver_name || '—';
    el('track-sender-phone').textContent = shipment.sender_phone || '—';
    el('track-sender-address').textContent = shipment.sender_address || '—';
    el('track-receiver-address').textContent = shipment.receiver_address || '—';
    el('track-route').textContent = `${shipment.source_city || '—'} → ${shipment.destination_city || '—'}`;
    el('track-type').textContent = shipment.delivery_type || '—';
    el('track-weight').textContent = shipment.weight_kg != null ? `${shipment.weight_kg} kg` : '—';
    el('track-distance').textContent = shipment.distance_km != null ? `${shipment.distance_km} km` : '—';
    el('track-cost').textContent = shipment.estimated_cost != null ? `₹${Number(shipment.estimated_cost).toLocaleString('en-IN')}` : '—';
    el('track-days').textContent = shipment.estimated_days != null ? `${shipment.estimated_days}` : '—';
    el('track-receiver-phone').textContent = shipment.receiver_phone || '—';
    el('track-status').innerHTML = statusBadge(shipment.status || 'pending');
    el('track-created').textContent = fmtDateTime(shipment.created_at);
    el('track-updated').textContent = fmtDateTime(shipment.updated_at);
    openModal();

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
            <span>${statusBadge(item.status || 'pending')}</span>
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

  el('shipments-list')?.addEventListener('click', (event) => {
    const row = event.target.closest('tr[data-shipment-code]');
    if (!row) return;
    openShipmentFromList(row.dataset.shipmentCode);
  });

  el('track-modal-close')?.addEventListener('click', closeModal);
  el('track-modal')?.addEventListener('click', (event) => {
    if (event.target === el('track-modal')) closeModal();
  });
}

async function init() {
  const blocked = await redirectIfNotStaff();
  if (blocked) return;

  await setupGreeting();
  setupLogout();
  setupSidebarToggle();
  setupHandlers();
  await loadShipmentsList();

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (code) {
    el('track-code').value = code;
    trackShipment(code);
  }
}

window.addEventListener('DOMContentLoaded', init);
