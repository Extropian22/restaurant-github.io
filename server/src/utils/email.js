const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sendEmail = async ({ to, subject, html }) => {
    try {
        await transporter.sendMail({
            from: '"Cozy Corner Cafe" <noreply@cozycornercafe.com>',
            to,
            subject,
            html
        });
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        return false;
    }
};

const emailTemplates = {
    reservationConfirmation: (reservation) => ({
        subject: 'Reservation Confirmation - Cozy Corner Cafe',
        html: `
            <h2>Reservation Confirmed!</h2>
            <p>Dear ${reservation.user.name},</p>
            <p>Your reservation has been confirmed for:</p>
            <ul>
                <li>Date: ${new Date(reservation.date).toLocaleDateString()}</li>
                <li>Time: ${reservation.time}</li>
                <li>Party Size: ${reservation.partySize}</li>
            </ul>
            <p>We look forward to serving you!</p>
        `
    }),
    
    orderConfirmation: (order) => ({
        subject: 'Order Confirmation - Cozy Corner Cafe',
        html: `
            <h2>Order Confirmed!</h2>
            <p>Dear ${order.user.name},</p>
            <p>Your order #${order._id} has been confirmed.</p>
            <p>Estimated ${order.orderType === 'delivery' ? 'delivery' : 'pickup'} time: 
               ${new Date(order.estimatedDeliveryTime).toLocaleTimeString()}</p>
            <p>Total Amount: $${order.totalAmount.toFixed(2)}</p>
        `
    })
};

module.exports = { sendEmail, emailTemplates };
