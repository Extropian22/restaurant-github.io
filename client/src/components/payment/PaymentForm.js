import React, { useState, useEffect } from 'react';
import {
    PaymentElement,
    useStripe,
    useElements,
    Elements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import {
    Box,
    Button,
    Typography,
    CircularProgress,
    Alert,
} from '@mui/material';
import axios from 'axios';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const PaymentForm = ({ orderId, amount, onSuccess, onError }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [clientSecret, setClientSecret] = useState('');

    useEffect(() => {
        // Create PaymentIntent as soon as the component loads
        const createPaymentIntent = async () => {
            try {
                const response = await axios.post('/api/payments/create-payment-intent', {
                    orderId
                }, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setClientSecret(response.data.clientSecret);
            } catch (err) {
                setError('Failed to initialize payment. Please try again.');
                onError && onError(err);
            }
        };

        createPaymentIntent();
    }, [orderId]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            const { error: submitError, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/order-confirmation`,
                },
                redirect: 'if_required',
            });

            if (submitError) {
                setError(submitError.message);
                onError && onError(submitError);
            } else if (paymentIntent.status === 'succeeded') {
                onSuccess && onSuccess(paymentIntent);
            }
        } catch (err) {
            setError('An unexpected error occurred.');
            onError && onError(err);
        }

        setProcessing(false);
    };

    if (!clientSecret) {
        return <CircularProgress />;
    }

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 500, mx: 'auto' }}>
            <Typography variant="h6" gutterBottom>
                Payment Details
            </Typography>
            
            <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Amount to Pay: ${amount.toFixed(2)}
                </Typography>
                <PaymentElement />
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={processing || !stripe || !elements}
                sx={{ mt: 2 }}
            >
                {processing ? (
                    <CircularProgress size={24} color="inherit" />
                ) : (
                    `Pay $${amount.toFixed(2)}`
                )}
            </Button>
        </Box>
    );
};

// Wrapper component to provide Stripe context
export const PaymentFormWrapper = ({ orderId, amount, onSuccess, onError }) => {
    const options = {
        mode: 'payment',
        amount: Math.round(amount * 100),
        currency: 'usd',
    };

    return (
        <Elements stripe={stripePromise} options={options}>
            <PaymentForm
                orderId={orderId}
                amount={amount}
                onSuccess={onSuccess}
                onError={onError}
            />
        </Elements>
    );
};

export default PaymentFormWrapper;
