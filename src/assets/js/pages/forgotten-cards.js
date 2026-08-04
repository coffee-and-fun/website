let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    const a2hsButton = document.getElementById('a2hs-button');
    if (a2hsButton) {
        a2hsButton.style.display = 'inline-flex';
        a2hsButton.classList.add('visible');
        
        a2hsButton.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                
                if (outcome === 'accepted') {
                    console.log('PWA installed');
                    a2hsButton.style.display = 'none';
                }
                deferredPrompt = null;
            }
        });
    }
});

window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    const a2hsButton = document.getElementById('a2hs-button');
    if (a2hsButton) {
        a2hsButton.style.display = 'none';
    }
});
