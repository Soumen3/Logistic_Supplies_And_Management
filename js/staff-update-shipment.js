import { SwiftShipDB } from '../js/db.module.js';

function el(id) { return document.getElementById(id); }

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
  el('detail-sender').textContent = shipment.sender_name || '—';
  el('detail-receiver').textContent = shipment.receiver_name || '—';
  el('detail-route').textContent = `${shipment.source_city || '—'} → ${shipment.destination_city || '—'}`;
  el('detail-status').textContent = shipment.status || 'pending';
  el('status-select').value = shipment.status || 'pending';
  el('status-notes').value = '';
  el('shipment-details').classList.remove('hidden');
}

function clearDetails() {
  activeShipment = null;
  el('shipment-details').classList.add('hidden');
  el('shipment-code').value = '';
  clearMessage();
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
      el('shipment-details').classList.add('hidden');
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
  btn.disabled = true;
  btn.textContent = 'Updating...';

  try {
    const session = await SwiftShipDB.getActiveSession();
    const status = el('status-select').value;
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
    setMessage('Failed to update shipment status.', 'error');
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
}

window.addEventListener('DOMContentLoaded', init);
