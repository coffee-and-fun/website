// A local illustration of the app's math challenge. It never changes browser tabs.
(() => {
  const demo = document.querySelector('[data-focus-demo]');
  if (!demo) return;
  const form = demo.querySelector('[data-focus-form]');
  const answer = form.querySelector('input');
  const title = demo.querySelector('[data-focus-title]');
  const caption = demo.querySelector('[data-focus-caption]');
  const state = demo.querySelector('[data-focus-state]');
  const feedback = demo.querySelector('[data-focus-feedback]');
  const reset = demo.querySelector('[data-focus-reset]');
  const initialTitle = title.innerHTML;
  const initialCaption = caption.innerHTML;
  form.hidden = false;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (answer.value.trim() !== '56') {
      answer.setAttribute('aria-invalid', 'true');
      feedback.textContent = 'Not quite. Try eight groups of seven.';
      answer.focus();
      return;
    }
    answer.removeAttribute('aria-invalid');
    demo.classList.add('is-unlocked');
    state.textContent = 'A MOMENT TO CHOOSE';
    title.textContent = 'Enjoy your break.';
    caption.textContent = 'A little pause. Then a choice.';
    feedback.textContent = 'Correct! In the app, this turns blocking off.';
    form.hidden = true;
    reset.hidden = false;
    reset.focus();
  });

  reset.addEventListener('click', () => {
    demo.classList.remove('is-unlocked');
    state.textContent = 'ROOM TO FOCUS';
    title.innerHTML = initialTitle;
    caption.innerHTML = initialCaption;
    feedback.textContent = 'Try it here. No extension needed.';
    answer.value = '';
    answer.removeAttribute('aria-invalid');
    form.hidden = false;
    reset.hidden = true;
    answer.focus();
  });
})();
