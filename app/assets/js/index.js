import '../css/override.min.css';
import '../css/styles.min.css';
// Js
import * as stripe from './core/stripe';
import * as thirdParty from './core/third-party';
import '@fortawesome/fontawesome-free/js/all';

async function loader() {


    await stripe.load(); // Load Stripe

    await thirdParty.crisp();
    await slider.initComparisons();



    await thirdParty.tagManager();
    await thirdParty.loadManager();
}


loader();


if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(registration => {

            //console.log('SW registered: ', registration);
        }).catch(registrationError => {

            console.log('SW registration failed: ', registrationError);
        });
    });
}