// Small, self-contained demonstrations. No account, storage, or network requests.
const spoilerToggle = document.querySelector('[data-spoiler-toggle]');
if (spoilerToggle) {
	spoilerToggle.addEventListener('click', () => {
		const revealed = spoilerToggle.getAttribute('aria-pressed') !== 'true';
		spoilerToggle.setAttribute('aria-pressed', String(revealed));
		const sample = document.querySelector('[data-spoiler-text]');
		sample.classList.toggle('is-revealed', revealed);
		sample.setAttribute('aria-hidden', String(!revealed));
		spoilerToggle.innerHTML = revealed
			? 'Blur it again'
			: 'Reveal the sample';
		document.querySelector('[data-spoiler-status]').textContent = revealed
			? 'Sample revealed: It was the cat. It’s always the cat.'
			: 'A pretend spoiler. Safely blurred.';
	});
}
