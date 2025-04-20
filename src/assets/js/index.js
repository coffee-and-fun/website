// css

// CSS
import 'tailwindcss'; // Update to Tailwind CSS v2 or v3 path if needed
import 'daisyui/daisyui.css'; // Import DaisyUI v5 CSS



import * as app from './core/app';

app.load();

if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker
			.register('/service-worker.js')
			.then((registration) => {})
			.catch((registrationError) => {});
	});
}
