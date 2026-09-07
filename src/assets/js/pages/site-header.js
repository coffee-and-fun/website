// Native popovers own click, Escape, light dismissal, and no-script behavior.
// These enhancements only position panels and expose the open state visually.
(() => {
	const header = document.querySelector('[data-site-header]');
	if (!header || !('showPopover' in HTMLElement.prototype)) return;
	const triggers = header.querySelectorAll('[popovertarget]');
	const desktop = window.matchMedia('(min-width: 1024px)');
	const positionPanel = (panel) => {
		const bottom = header.getBoundingClientRect().bottom;
		panel.style.setProperty('--cf-menu-top', `${Math.max(8, bottom + 4)}px`);
	};
	triggers.forEach((trigger) => {
		const panel = document.getElementById(trigger.getAttribute('popovertarget'));
		if (!panel) return;
		trigger.setAttribute('aria-expanded', 'false');
		panel.addEventListener('beforetoggle', (event) => {
			if (event.newState === 'open') positionPanel(panel);
		});
		panel.addEventListener('toggle', () => {
			trigger.setAttribute('aria-expanded', String(panel.matches(':popover-open')));
		});
		trigger.addEventListener('keydown', (event) => {
			if (event.key !== 'ArrowDown') return;
			event.preventDefault();
			panel.showPopover();
			panel.querySelector('a')?.focus();
		});
		panel.addEventListener('keydown', (event) => {
			if (event.key !== 'Escape') return;
			event.preventDefault();
			panel.hidePopover();
			trigger.focus();
		});
		// Normal Tab navigation must not leave an unrelated menu over the page.
		panel.addEventListener('focusout', (event) => {
			if (
				event.relatedTarget &&
				!panel.contains(event.relatedTarget) &&
				event.relatedTarget !== trigger &&
				panel.matches(':popover-open')
			) {
				panel.hidePopover();
			}
		});
	});
	const refresh = () => {
		triggers.forEach((trigger) => {
			const panel = document.getElementById(trigger.getAttribute('popovertarget'));
			if (!panel?.matches(':popover-open')) return;
			if (!desktop.matches) {
				panel.hidePopover();
				header.querySelector('.cf-mobile-menu')?.focus();
			} else positionPanel(panel);
		});
	};
	window.addEventListener('resize', refresh, { passive: true });
	window.addEventListener('scroll', refresh, { passive: true });
})();
