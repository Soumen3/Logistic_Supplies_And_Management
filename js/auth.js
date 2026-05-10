import { SwiftShipDB } from './db.module.js';

function initLandingAuth() {
	const loadingEl = document.getElementById('loading-state');
	const mainEl = document.getElementById('main-content');
	const redirectEl = document.getElementById('redirect-msg');
	const authButtonsEl = document.getElementById('auth-buttons');

	// Lock body scroll while checking session
	document.body.style.overflow = 'hidden';
	document.documentElement.style.overflow = 'hidden';

	const showMain = () => {
		if (loadingEl) loadingEl.classList.add('hidden');
		if (redirectEl) redirectEl.style.display = 'none';
		if (mainEl) {
			mainEl.classList.remove('hidden');
			mainEl.classList.add('flex');
		}
		// Restore body scroll
		document.body.style.overflow = '';
		document.documentElement.style.overflow = '';
	};

	const setLoggedInNav = () => {
		if (!authButtonsEl) return;
		authButtonsEl.innerHTML = `
			<button id="home-logout-btn"
				class="px-4 py-1.5 text-sm font-500 rounded-lg transition-all duration-200 hover:opacity-90"
				style="background:#F59000; color:#fff;">
				Logout
			</button>
		`;

		const logoutBtn = document.getElementById('home-logout-btn');
		if (!logoutBtn) return;

		logoutBtn.addEventListener('click', async () => {
			try {
				await SwiftShipDB.deactivateActiveSessions();
			} catch (error) {
				console.warn('Logout failed:', error);
			}
			window.location.reload();
		});
	};

	const checkSession = async () => {
		try {
			const active = await SwiftShipDB.getActiveSession();
			showMain();
			if (active) {
				setLoggedInNav();
			}
		} catch (error) {
			console.warn('Session check failed:', error);
			showMain();
		}
	};

	setTimeout(checkSession, 300);
}

export { initLandingAuth };

window.SwiftShipAuth = {
	initLandingAuth,
};
