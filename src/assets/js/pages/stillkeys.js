(() => {
  const preview = document.querySelector('#app-preview');
  const picker = preview?.querySelector('.appearance-picker');

  if (picker) {
    picker.hidden = false;
    picker.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-appearance]');
      if (!button) return;
      const appearance = button.dataset.appearance;
      preview.dataset.appearance = appearance;
      for (const control of picker.querySelectorAll('button')) {
        control.setAttribute('aria-pressed', String(control === button));
      }
      preview.querySelector('.capture-light').hidden = appearance !== 'light';
      preview.querySelector('.capture-dark').hidden = appearance !== 'dark';
    });
  }

  // In-page privacy and limitations links also reveal their destination answer.
  const revealLinkedAnswer = () => {
    const id = window.location.hash.slice(1);
    const answer = id ? document.getElementById(id) : null;
    if (answer instanceof HTMLDetailsElement) answer.open = true;
  };
  window.addEventListener('hashchange', revealLinkedAnswer);
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const target = document.getElementById(link.getAttribute('href').slice(1));
    if (target instanceof HTMLDetailsElement) target.open = true;
  });
  revealLinkedAnswer();
})();
