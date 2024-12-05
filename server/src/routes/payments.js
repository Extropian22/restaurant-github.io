const express = require('express');
const { auth } = require('../middleware/auth');
const { createPaymentIntent, retrievePaymentIntent } = require('../services/stripe');
const Order = require('../models/Order');

const router = express.Router();

// Create payment intent for an order
router.post('/create-payment-intent', auth, async (req, res) => {
    try {
        const { orderId } = req.body;

        // Fetch the order to get the total amount
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Create payment intent
        const paymentIntent = await createPaymentIntent(order.totalAmount);

        // Update order with payment intent ID
        order.paymentId = paymentIntent.id;
        await order.save();

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        console.error('Payment intent error:', error);
        res.status(500).json({ message: 'Error creating payment intent' });
    }
});

// Webhook to handle Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            // Update order status
            await Order.findOneAndUpdate(
                { paymentId: paymentIntent.id },
                { 
                    paymentStatus: 'completed',
                    status: 'confirmed'
                }
            );
            break;

        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            // Update order status
            await Order.findOneAndUpdate(
                { paymentId: failedPayment.id },
                { 
                    paymentStatus: 'failed',
                    status: 'cancelled'
                }
            );
            break;
    }

    res.json({ received: true });
});

// Verify payment status
router.get('/verify/:paymentIntentId', auth, async (req, res) => {
    try {
        const paymentIntent = await retrievePaymentIntent(req.params.paymentIntentId);
        res.json({ status: paymentIntent.status });
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ message: 'Error verifying payment' });
    }
});

module.exports = router;
