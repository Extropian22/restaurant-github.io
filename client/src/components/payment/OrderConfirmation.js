import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Button,
    Divider,
} from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';
import axios from 'axios';

const OrderConfirmation = () => {
    const [status, setStatus] = useState('loading');
    const [order, setOrder] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const verifyPayment = async () => {
            const params = new URLSearchParams(location.search);
            const paymentIntentId = params.get('payment_intent');

            if (!paymentIntentId) {
                setStatus('error');
                return;
            }

            try {
                // Verify payment status
                const paymentResponse = await axios.get(
                    `/api/payments/verify/${paymentIntentId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );

                if (paymentResponse.data.status === 'succeeded') {
                    // Fetch order details
                    const orderResponse = await axios.get(
                        `/api/orders/by-payment/${paymentIntentId}`,
                        {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem('token')}`
                            }
                        }
                    );
                    setOrder(orderResponse.data);
                    setStatus('success');
                } else {
                    setStatus('error');
                }
            } catch (error) {
                console.error('Payment verification error:', error);
                setStatus('error');
            }
        };

        verifyPayment();
    }, [location]);

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <Box display="flex" alignItems="center" justifyContent="center">
                        <CircularProgress />
                    </Box>
                );

            case 'success':
                return (
                    <>
                        <Box display="flex" alignItems="center" mb={3}>
                            <CheckCircle color="success" sx={{ fontSize: 40, mr: 2 }} />
                            <Typography variant="h5">
                                Payment Successful!
                            </Typography>
                        </Box>

                        <Typography variant="body1" gutterBottom>
                            Thank you for your order. Your order details are below:
                        </Typography>

                        <Paper sx={{ p: 3, mt: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Order Summary
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            
                            {order && (
                                <>
                                    <Typography variant="body1" gutterBottom>
                                        Order ID: {order._id}
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        Order Type: {order.orderType}
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        Status: {order.status}
                                    </Typography>
                                    
                                    <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                                        Items:
                                    </Typography>
                                    {order.items.map((item, index) => (
                                        <Box key={index} sx={{ mb: 1 }}>
                                            <Typography variant="body1">
                                                {item.menuItem.name} x {item.quantity}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                ${(item.price * item.quantity).toFixed(2)}
                                            </Typography>
                                        </Box>
                                    ))}
                                    
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="h6">
                                        Total: ${order.totalAmount.toFixed(2)}
                                    </Typography>
                                </>
                            )}
                        </Paper>

                        <Box sx={{ mt: 3 }}>
                            <Button
                                variant="contained"
                                onClick={() => navigate('/orders')}
                            >
                                View All Orders
                            </Button>
                        </Box>
                    </>
                );

            case 'error':
                return (
                    <Box textAlign="center">
                        <Error color="error" sx={{ fontSize: 60, mb: 2 }} />
                        <Typography variant="h5" gutterBottom>
                            Payment Failed
                        </Typography>
                        <Typography variant="body1" color="text.secondary" gutterBottom>
                            There was an error processing your payment.
                            Please try again or contact support if the problem persists.
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/cart')}
                            sx={{ mt: 3 }}
                        >
                            Return to Cart
                        </Button>
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
            {renderContent()}
        </Box>
    );
};

export default OrderConfirmation;
