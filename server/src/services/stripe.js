const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createPaymentIntent = async (amount, currency = 'usd') => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency,
            automatic_payment_methods: {
                enabled: true,
            },
        });
        return paymentIntent;
    } catch (error) {
        console.error('Stripe payment intent error:', error);
        throw error;
    }
};

const retrievePaymentIntent = async (paymentIntentId) => {
    try {
        return await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
        console.error('Stripe retrieve payment error:', error);
        throw error;
    }
};

const createCustomer = async (email, paymentMethodId) => {
    try {
        const customer = await stripe.customers.create({
            email,
            payment_method: paymentMethodId,
        });
        return customer;
    } catch (error) {
        console.error('Stripe create customer error:', error);
        throw error;
    }
};

module.exports = {
    createPaymentIntent,
    retrievePaymentIntent,
    createCustomer,
};
