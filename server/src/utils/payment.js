const calculateOrderAmount = (items) => {
    return items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
};

const validatePaymentAmount = (paymentAmount, orderAmount) => {
    // Convert to cents for precise comparison
    const paymentCents = Math.round(paymentAmount * 100);
    const orderCents = Math.round(orderAmount * 100);
    
    return paymentCents === orderCents;
};

const formatStripeAmount = (amount) => {
    // Stripe expects amounts in cents
    return Math.round(amount * 100);
};

const calculateTaxAndTotal = (subtotal, taxRate = 0.08) => {
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    
    return {
        subtotal,
        tax,
        total,
        taxRate
    };
};

const validateRefundAmount = (refundAmount, originalAmount) => {
    if (refundAmount <= 0) {
        throw new Error('Refund amount must be greater than 0');
    }
    if (refundAmount > originalAmount) {
        throw new Error('Refund amount cannot exceed original payment amount');
    }
    return true;
};

const generatePaymentDescription = (order) => {
    return `Order #${order._id} - ${order.items.length} items - ${order.orderType}`;
};

module.exports = {
    calculateOrderAmount,
    validatePaymentAmount,
    formatStripeAmount,
    calculateTaxAndTotal,
    validateRefundAmount,
    generatePaymentDescription
};
