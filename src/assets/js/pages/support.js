const loadButton = document.getElementById('load-support-form');
const formSlot = document.getElementById('support-form-slot');
const formStatus = document.getElementById('support-form-status');

if (loadButton && formSlot) {
	loadButton.hidden = false;
	loadButton.addEventListener(
		'click',
		() => {
			const frame = document.createElement('iframe');
			frame.src =
				'https://docs.google.com/forms/d/e/1FAIpQLSeOBpyxmu3enhScTOuJtYAx2jNK2wr9scFKtbQrj0AjqJfdEQ/viewform?embedded=true';
			frame.width = '100%';
			frame.height = '960';
			frame.className = 'sp-form-frame';
			frame.title = 'Coffee & Fun Support Contact Form';
			frame.addEventListener(
				'load',
				() => {
					formStatus.textContent = 'Google Forms is open.';
				},
				{ once: true }
			);
			formStatus.textContent =
				'Loading Google Forms. You can also use the email or form link below.';
			formSlot.replaceChildren(frame);
			frame.focus();
		},
		{ once: true }
	);
}
