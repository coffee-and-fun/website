document.getElementById('load-support-form').addEventListener('click', () => {
    const slot = document.getElementById('support-form-slot');
    const frame = document.createElement('iframe');
    frame.src = 'https://docs.google.com/forms/d/e/1FAIpQLSeOBpyxmu3enhScTOuJtYAx2jNK2wr9scFKtbQrj0AjqJfdEQ/viewform?embedded=true';
    frame.width = '100%';
    frame.height = '800';
    frame.className = 'rounded-xl border border-stone-200';
    frame.title = 'Coffee & Fun Support Contact Form';
    slot.replaceChildren(frame);
    frame.focus();
});
