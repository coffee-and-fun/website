function crisp() {
	setTimeout(() => {
		// Crisp
		window.$crisp = [];
		window.CRISP_WEBSITE_ID = '5cfe2ec4-4274-44e5-9891-55e838a20af9';
		(function () {
			const d = document;
			const s = d.createElement('script');
			s.src = 'https://client.crisp.chat/l.js';
			s.async = 1;
			d.getElementsByTagName('head')[0].appendChild(s);
		})();
	}, 1000);
}

function tagManager() {
	setTimeout(() => {
		const d = document;
		const s = d.createElement('script');
		s.src = 'https://www.googletagmanager.com/gtag/js?id=G-WJ2GPVF30M';
		s.async = 1;
		d.getElementsByTagName('head')[0].appendChild(s);
	}, 2000);
}

function loadManager() {
	setTimeout(() => {
		window.dataLayer = window.dataLayer || [];
		function gtag() {
			dataLayer.push(arguments);
		}
		gtag('js', new Date());

		gtag('config', 'G-WJ2GPVF30M');
	}, 2000);
}

export { crisp, tagManager, loadManager }; // a list of exported variables
