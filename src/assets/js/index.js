import * as app from './core/app';

app.load();

if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker
			.register('/service-worker.js')
			.then((registration) => {
				console.log('Service worker registered:', registration.scope);
			})
			.catch((registrationError) => {
				console.error('Service worker registration failed:', registrationError);
			});
	});
}
