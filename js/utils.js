
(function initUtils(global) {
	function renderFeaturePills(containerSelector = '.feature-pills') {
		const container = document.querySelector(containerSelector);
		if (!container) return;

		const pills = [
			'Shipment Tracking',
			'Cost Estimator',
			'Delivery Time',
			'Analytics',
			'Notifications',
		];

		container.innerHTML = pills
			.map(
				(pill) =>
					`<span class="px-3.5 py-1.5 rounded-full text-sm glass" style="color:var(--text-body);">${pill}</span>`
			)
			.join('');
	}


	global.SwiftShipUtils = {
		renderFeaturePills,
	};
	})(window);
