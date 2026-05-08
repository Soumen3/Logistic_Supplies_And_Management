(function initAuth(global) {
	function initLandingAuth() {
		const loadingEl = document.getElementById('loading-state');
		const mainEl = document.getElementById('main-content');
		const redirectEl = document.getElementById('redirect-msg');

		const showMain = () => {
			if (loadingEl) loadingEl.classList.add('hidden');
			if (mainEl) {
				mainEl.classList.remove('hidden');
				mainEl.classList.add('flex');
			}
		};

		const showRedirect = () => {
			if (loadingEl) loadingEl.classList.add('hidden');
			if (redirectEl) {
				redirectEl.style.display = 'flex';
				redirectEl.style.flexDirection = 'column';
			}
		};

		const checkSession = async () => {
			try {
				const getActiveSession = global.SwiftShipDB?.getActiveSession;
				if (!getActiveSession) {
					showMain();
					return;
				}

				const active = await getActiveSession();

				if (!active) {
					showMain();
					return;
				}

				showRedirect();
				setTimeout(() => {
					window.location.href =
						active.role === 'admin'
							? 'pages/admin/dashboard.html'
							: 'pages/customer/dashboard.html';
				}, 1600);
			} catch (error) {
				console.warn('Session check failed:', error);
				showMain();
			}
		};

		setTimeout(checkSession, 600);
	}

	global.SwiftShipAuth = {
		initLandingAuth,
	};
})(window);
