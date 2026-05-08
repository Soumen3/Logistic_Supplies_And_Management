(function initRegisterPage(global) {
	function el(id) {
		return document.getElementById(id);
	}

	async function hashPassword(password) {
		const encoder = new TextEncoder();
		const data = encoder.encode(password);
		const hash = await crypto.subtle.digest('SHA-256', data);
		return Array.from(new Uint8Array(hash))
			.map((byte) => byte.toString(16).padStart(2, '0'))
			.join('');
	}

	function validateEmail(email) {
    console.log("Vlidating Email");
    
		const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return pattern.test(email);
	}

	function validatePhone(phone) {
    console.log("Validating Phone");
    
		const cleaned = phone.replace(/[^0-9]/g, '');
		return cleaned.length >= 7;
	}

	function validatePassword(password) {
    console.log("Validating Password");
		if (!password || password.length < 6) return false;
		return /(?=.*[A-Za-z])(?=.*\d).+/.test(password);
	}

	function setError(fieldId, message) {
		const input = el(fieldId);
		const msg = el('msg');
		if (input) input.classList.add('border-red-500');
		if (msg) {
			msg.style.color = 'red';
			msg.textContent = message;
		}
	}

	function clearErrors() {
		['full_name', 'phone', 'email', 'password'].forEach((id) => {
			const input = el(id);
			if (input) input.classList.remove('border-red-500');
		});

		const msg = el('msg');
		if (msg) msg.textContent = '';
	}

	async function waitForDB(timeout = 2000) {
		const start = Date.now();
		while (!global.SwiftShipDB && (Date.now() - start) < timeout) {
			await new Promise(r => setTimeout(r, 100));
		}
		return global.SwiftShipDB;
	}

	async function redirectIfLoggedIn() {
		const db = await waitForDB();
		if (!db) return false;
		try {
			const session = await db.getActiveSession();
			if (session) {
				const role = session.role;
				if (role === 1 || role === 'admin') {
					global.location.href = './admin/dashboard.html';
				} else if (role === 'staff' || role === 'staff') {
					global.location.href = './staff/dashboard.html';
				} else {
					global.location.href = './customer/dashboard.html';
				}
				return true;
			}
		} catch (e) {
			// ignore and allow registration
		}
		return false;
	}

	async function init() {
		await redirectIfLoggedIn();
		const form = el('register-form');
		const msg = el('msg');

		if (!form || !msg) return;

		form.addEventListener('submit', async (event) => {
			event.preventDefault();
			clearErrors();

			const fullName = el('full_name').value.trim();
			const phone = el('phone').value.trim();
			const email = el('email').value.trim().toLowerCase();
			const password = el('password').value;

			if (!fullName || fullName.length < 2) {
				setError('full_name', 'Please enter your full name (2+ characters).');
				return;
			}

			if (!validatePhone(phone)) {
				setError('phone', 'Please enter a valid phone number (minimum 7 digits).');
				return;
			}

			if (!validateEmail(email)) {
				setError('email', 'Please enter a valid email address.');
				return;
			}

			if (!validatePassword(password)) {
				setError('password', 'Password must be 6+ chars and include letters and numbers.');
				return;
			}

			if (!global.SwiftShipDB) {
				msg.textContent = 'Database not ready.';
				return;
			}

			try {
				const existing = await global.SwiftShipDB.getUserByEmail(email);
				if (existing) {
					setError('email', 'An account with that email already exists.');
					return;
				}

				const passwordHash = await hashPassword(password);
				await global.SwiftShipDB.addUser({
					email,
					password_hash: passwordHash,
					full_name: fullName,
					phone,
					role: 'customer',
				});

				msg.style.color = 'green';
				msg.textContent = 'Account created — redirecting to login...';
				setTimeout(() => {
					global.location.href = './login.html';
				}, 900);
			} catch (error) {
				console.error(error);
				if (error && error.message === 'phone_required') {
					setError('phone', 'Phone number is required.');
					return;
				}

				msg.style.color = 'red';
				msg.textContent = 'Registration failed. Try again.';
			}
		});
	}

	global.SwiftShipRegister = {
		init,
	};

	window.addEventListener('DOMContentLoaded', init);
})(window);