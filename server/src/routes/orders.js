const express = require('express');
const { auth } = require('../middleware/auth');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const { body, validationResult } = require('express-validator');
const { sendEmail, emailTemplates } = require('../utils/email');

const router = express.Router();

// Get all orders for authenticated user
router.get('/my-orders', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate('items.menuItem');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders' });
    }
});

// Get specific order
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user._id
        }).populate('items.menuItem');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching order' });
    }
});

// Create new order
router.post('/',
    auth,
    [
        body('items').isArray().withMessage('Items must be an array'),
        body('items.*.menuItem').notEmpty().withMessage('Menu item ID is required'),
        body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
        body('deliveryAddress').optional(),
        body('orderType').isIn(['delivery', 'pickup']).withMessage('Invalid order type')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // Validate menu items and calculate total
            let total = 0;
            const validatedItems = [];

            for (const item of req.body.items) {
                const menuItem = await MenuItem.findById(item.menuItem);
                if (!menuItem || !menuItem.available) {
                    return res.status(400).json({
                        message: `Menu item ${item.menuItem} is not available`
                    });
                }

                total += menuItem.price * item.quantity;
                validatedItems.push({
                    menuItem: menuItem._id,
                    quantity: item.quantity,
                    price: menuItem.price
                });
            }

            // Add delivery fee if applicable
            if (req.body.orderType === 'delivery') {
                total += 5; // $5 delivery fee
            }

            const order = new Order({
                user: req.user._id,
                items: validatedItems,
                total,
                orderType: req.body.orderType,
                deliveryAddress: req.body.deliveryAddress,
                specialInstructions: req.body.specialInstructions,
                status: 'pending'
            });

            await order.save();

            // Send order confirmation email
            await sendEmail({
                to: req.user.email,
                ...emailTemplates.orderConfirmation({
                    ...order.toObject(),
                    user: req.user
                })
            });

            res.status(201).json(order);
        } catch (error) {
            res.status(500).json({ message: 'Error creating order' });
        }
    }
);

// Update order status (admin only)
router.patch('/:id/status',
    auth,
    [
        body('status')
            .isIn(['pending', 'preparing', 'ready', 'in-delivery', 'completed', 'cancelled'])
            .withMessage('Invalid status')
    ],
    async (req, res) => {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Not authorized' });
            }

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const order = await Order.findById(req.params.id)
                .populate('user', 'email')
                .populate('items.menuItem');

            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }

            order.status = req.body.status;
            await order.save();

            // Send status update email
            await sendEmail({
                to: order.user.email,
                ...emailTemplates.orderStatusUpdate({
                    ...order.toObject(),
                    user: order.user
                })
            });

            res.json(order);
        } catch (error) {
            res.status(500).json({ message: 'Error updating order status' });
        }
    }
);

// Cancel order
router.delete('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user._id,
            status: 'pending' // Can only cancel pending orders
        });

        if (!order) {
            return res.status(404).json({
                message: 'Order not found or cannot be cancelled'
            });
        }

        order.status = 'cancelled';
        await order.save();

        // Send cancellation email
        await sendEmail({
            to: req.user.email,
            ...emailTemplates.orderCancellation({
                ...order.toObject(),
                user: req.user
            })
        });

        res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error cancelling order' });
    }
});

// Get order statistics (admin only)
router.get('/stats/summary', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const stats = await Order.aggregate([
            {
                $facet: {
                    daily: [
                        { $match: { createdAt: { $gte: today } } },
                        { $group: {
                            _id: null,
                            count: { $sum: 1 },
                            revenue: { $sum: '$total' }
                        }}
                    ],
                    status: [
                        { $group: {
                            _id: '$status',
                            count: { $sum: 1 }
                        }}
                    ],
                    orderTypes: [
                        { $group: {
                            _id: '$orderType',
                            count: { $sum: 1 }
                        }}
                    ]
                }
            }
        ]);

        res.json(stats[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching order statistics' });
    }
});

module.exports = router;
