import {
    loadStripe
} from '@stripe/stripe-js';
import {
    Notyf
} from 'notyf';
import 'notyf/notyf.min.css'; // for React and Vue
const notyf = new Notyf();



async function load() {





    const stripe = await loadStripe('pk_live_DG2IMIp7QYpSiuiTFvQI7ZFW00OEARkk0s');
    let removemyporn = document.getElementById('checkout-button-plan_GWiDO5WS3j8fNG'); //Remove my porn
    let markdownEditor = document.getElementById('checkout-button-price_HLvALnfLmoVK3j');


    if (removemyporn !== null) {
        removemyporn.addEventListener('click', () => {
            // When the customer clicks on the button, redirect
            // them to Checkout.

            notyf.success('Loading.....');
            stripe.redirectToCheckout({
                    items: [{
                        plan: 'plan_FmS3HONbzTCxGl',
                        quantity: 1
                    }],
                    // Do not rely on the redirect to the successUrl for fulfilling
                    // purchases, customers may not always reach the success_url after
                    // a successful payment.
                    // Instead use one of the strategies described in
                    // https://stripe.com/docs/payments/checkout/fulfillment
                    successUrl: 'https://www.helperbird.com/success',
                    cancelUrl: 'https://www.helperbird.com/support',
                    billingAddressCollection: 'required',
                })
                .then(({error}) => {
                    if (error) {
                        // If `redirectToCheckout` fails due to a browser or network
                        // error, display the localized error message to your customer.

                        notyf.error(error.message);

                    }
                });
        });

    }




    if (markdownEditor !== null) {
        markdownEditor.addEventListener('click', () => {
            // When the customer clicks on the button, redirect
            // them to Checkout.
            notyf.success('Loading.....');
            stripe.redirectToCheckout({
                    items: [{
                        plan: '1',
                        quantity: 1
                    }],
                    // Do not rely on the redirect to the successUrl for fulfilling
                    // purchases, customers may not always reach the success_url after
                    // a successful payment.
                    // Instead use one of the strategies described in
                    // https://stripe.com/docs/payments/checkout/fulfillment
                    successUrl: 'https://www.helperbird.com/success',
                    cancelUrl: 'https://www.helperbird.com/support',
                    billingAddressCollection: 'required',

                })
                .then(({error}) => {
                    if (error) {
                        // If `redirectToCheckout` fails due to a browser or network
                        // error, display the localized error message to your customer.
                        notyf.error(error.message);
                    }
                });
        });


    }
}

export {
    load
}; // a list of exported variables