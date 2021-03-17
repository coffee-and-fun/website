async function crisp() {

	setTimeout(() => {
		// Crisp
		window.$crisp = [];
		window.CRISP_WEBSITE_ID = "8db9bf53-290b-4a06-a5b9-498da087cd20";

		let d = document;
		let s = d.createElement("script");
		s.src = "https://client.crisp.chat/l.js";
		s.async = 1;
		d.getElementsByTagName("head")[0].appendChild(s);

	}, 2000), {
		once: true
	}
}




async function tagManager() {
	setTimeout(() => {

		let d = document;
		let s = d.createElement("script");
		s.src = "https://www.googletagmanager.com/gtag/js?id=UA-39444052-20";
		s.async = 1;
		d.getElementsByTagName("head")[0].appendChild(s);
	}, 2000), {
		once: true
	}
}


async function loadManager() {
	setTimeout(() => {
		window.dataLayer = window.dataLayer || [];

		function gtag() {
			dataLayer.push(arguments);
		}
		gtag('js', new Date());
		gtag('config', 'UA-39444052-20');

	}, 2000), {
		once: true
	}
}

export {
	crisp,
	tagManager,
	loadManager
}; // a list of exported variables