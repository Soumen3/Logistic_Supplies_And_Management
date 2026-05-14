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

function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function openModal() {
  el('update-modal')?.classList.remove('hidden');
  el('update-modal')?.classList.add('flex');
}

function closeModal() {
  el('update-modal')?.classList.add('hidden');
  el('update-modal')?.classList.remove('flex');
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

let activeShipment = null;

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
  const msg = el('lookup-msg');
  if (!msg) return;
  msg.classList.remove('hidden');
  msg.textContent = text;
  msg.className = 'mt-4 text-sm';
  if (type === 'error') msg.classList.add('text-red-500');
  if (type === 'success') msg.classList.add('text-green-500');
  if (type === 'info') msg.classList.add('text-[color:var(--text-muted)]');
}

function clearMessage() {
  const msg = el('lookup-msg');
  if (!msg) return;
  msg.classList.add('hidden');
  msg.textContent = '';
}

function showDetails(shipment) {
  el('detail-code').textContent = shipment.shipment_code || '—';
  el('detail-sender').textContent = shipment.sender_name || '—';
  el('detail-receiver').textContent = shipment.receiver_name || '—';
  el('detail-route').textContent = `${shipment.source_city || '—'} → ${shipment.destination_city || '—'}`;
  el('detail-status').innerHTML = statusBadge(shipment.status || 'pending');
  el('status-select').value = shipment.status || 'pending';
  el('status-notes').value = '';
  const delivered = (shipment.status || '').toString().toLowerCase().replace(/\s+/g, '_') === 'delivered';
  el('status-select').disabled = delivered;
  el('status-notes').disabled = delivered;
  el('update-btn').disabled = delivered;
  el('update-btn').textContent = delivered ? 'Delivered' : 'Update Status';
  openModal();
}

function clearDetails() {
  activeShipment = null;
  el('shipment-code').value = '';
  clearMessage();
  closeModal();
}

async function findShipment(code) {
  if (!code) {
    setMessage('Enter a shipment code to search.', 'error');
    return;
  }
  clearMessage();

  const btn = el('lookup-btn');
  btn.disabled = true;
  btn.textContent = 'Searching...';

  try {
    const shipment = await SwiftShipDB.getShipmentByCode(code.toUpperCase());
    if (!shipment) {
      setMessage('Shipment not found. Check the code and try again.', 'error');
      closeModal();
      return;
    }
    activeShipment = shipment;
    showDetails(shipment);
  } catch (err) {
    console.error('Search failed:', err);
    setMessage('Failed to search shipments. Please try again.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Find Shipment';
  }
}

async function updateStatus() {
  if (!activeShipment) {
    setMessage('Search for a shipment first.', 'error');
    return;
  }

  const btn = el('update-btn');
  if (btn.disabled) {
    setMessage('Delivered shipments can no longer be updated.', 'error');
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Updating...';

  try {
    const session = await SwiftShipDB.getActiveSession();
    const status = el('status-select').value.replace(/_/g, ' ');
    const notes = el('status-notes').value.trim() || null;

    await SwiftShipDB.updateShipmentStatus(activeShipment.id, status, {
      updated_by: session?.user_id || null,
      notes,
    });

    const refreshed = await SwiftShipDB.getShipmentById(activeShipment.id);
    activeShipment = refreshed;
    showDetails(refreshed);
    setMessage('Shipment status updated successfully.', 'success');
  } catch (err) {
    console.error('Update failed:', err);
    setMessage(err?.message === 'shipment_delivered_locked' ? 'Delivered shipments can no longer be updated.' : 'Failed to update shipment status.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Update Status';
  }
}

function setupHandlers() {
  el('lookup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    findShipment(el('shipment-code').value.trim());
  });

  el('shipments-list')?.addEventListener('click', (event) => {
    const row = event.target.closest('tr[data-shipment-code]');
    if (!row) return;
    findShipment(row.dataset.shipmentCode);
    el('shipment-code').value = row.dataset.shipmentCode || '';
  });

  el('update-modal-close')?.addEventListener('click', closeModal);
  el('update-modal')?.addEventListener('click', (event) => {
    if (event.target === el('update-modal')) closeModal();
  });

  el('update-btn').addEventListener('click', (e) => {
    e.preventDefault();
    updateStatus();
  });

  el('clear-btn').addEventListener('click', () => {
    clearDetails();
  });
}

async function init() {
  const blocked = await redirectIfNotStaff();
  if (blocked) return;

  await setupGreeting();
  setupLogout();
  setupSidebarToggle();
  setupHandlers();
  loadShipmentsList();
}

window.addEventListener('DOMContentLoaded', init);
