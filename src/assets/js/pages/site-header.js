// Native disclosures stay usable without JavaScript. Enhance dismissal and keyboard focus.
(() => {
  const header = document.querySelector('[data-site-header]');
  if (!header) return;
  const menus = [...header.querySelectorAll('.cf-dropdown')];
  const mobile = header.querySelector('.cf-mobile-navigation');
  mobile?.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !event.defaultPrevented) {
      event.preventDefault();
      mobile.open = false;
      mobile.querySelector('summary').focus();
    }
  });
  document.addEventListener('click', event => {
    if (mobile?.open && !mobile.contains(event.target)) mobile.open = false;
  });
  const close = (menu, restoreFocus = false) => {
    menu.open = false;
    if (restoreFocus) menu.querySelector('summary').focus();
  };
  menus.forEach(menu => {
    menu.addEventListener('toggle', () => {
      if (menu.open) menus.forEach(other => { if (other !== menu) close(other); });
    });
    menu.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.open) {
        event.preventDefault();
        close(menu, true);
      }
      if (event.key === 'ArrowDown' && event.target === menu.querySelector('summary')) {
        event.preventDefault();
        menu.open = true;
        menu.querySelector('a').focus();
      }
    });
    menu.addEventListener('focusout', event => {
      if (event.relatedTarget && !menu.contains(event.relatedTarget)) close(menu);
    });
  });
  document.addEventListener('click', event => menus.forEach(menu => {
    if (menu.open && !menu.contains(event.target)) close(menu);
  }));
})();
