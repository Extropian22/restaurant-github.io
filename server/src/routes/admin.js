const express = require('express');
const { adminAuth } = require('../middleware/auth');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Reservation = require('../models/Reservation');
const User = require('../models/User');
const Review = require('../models/Review');

const router = express.Router();

// Ensure all routes require admin authentication
router.use(adminAuth);

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
    try {
        const [
            totalOrders,
            totalReservations,
            activeMenuItems,
            totalUsers,
            recentOrders,
            recentReservations,
            dailyRevenue
        ] = await Promise.all([
            Order.countDocuments(),
            Reservation.countDocuments(),
            MenuItem.countDocuments({ available: true }),
            User.countDocuments(),
            Order.find().sort({ createdAt: -1 }).limit(5).populate('user'),
            Reservation.find().sort({ date: -1 }).limit(5).populate('user'),
            Order.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: new Date(new Date().setDate(new Date().getDate() - 30))
                        }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        amount: { $sum: "$totalAmount" }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ])
        ]);

        res.json({
            totalOrders,
            totalReservations,
            activeMenuItems,
            totalUsers,
            recentOrders,
            recentReservations,
            dailyRevenue: dailyRevenue.map(item => ({
                date: item._id,
                amount: item.amount
            }))
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Menu Management Routes
router.get('/menu', async (req, res) => {
    try {
        const menuItems = await MenuItem.find().sort({ category: 1, name: 1 });
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/menu', async (req, res) => {
    try {
        const menuItem = new MenuItem({
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            category: req.body.category,
            image: req.body.image,
            dietary: {
                vegetarian: req.body.vegetarian,
                vegan: req.body.vegan,
                glutenFree: req.body.glutenFree
            },
            available: req.body.available
        });

        await menuItem.save();
        res.status(201).json(menuItem);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/menu/:id', async (req, res) => {
    try {
        const menuItem = await MenuItem.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                description: req.body.description,
                price: req.body.price,
                category: req.body.category,
                image: req.body.image,
                dietary: {
                    vegetarian: req.body.vegetarian,
                    vegan: req.body.vegan,
                    glutenFree: req.body.glutenFree
                },
                available: req.body.available
            },
            { new: true }
        );

        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        res.json(menuItem);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/menu/:id', async (req, res) => {
    try {
        const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
        
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Reservation Management Routes
router.get('/reservations', async (req, res) => {
    try {
        const reservations = await Reservation.find()
            .sort({ date: -1 })
            .populate('user', 'name email');
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/reservations/:id', async (req, res) => {
    try {
        const reservation = await Reservation.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );

        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        res.json(reservation);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Order Management Routes
router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate('user', 'name email')
            .populate('items.menuItem');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/orders/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// User Management Routes
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role: req.body.role },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Review Management Routes
router.get('/reviews', async (req, res) => {
    try {
        const reviews = await Review.find()
            .sort({ createdAt: -1 })
            .populate('user', 'name email');
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/reviews/:id', async (req, res) => {
    try {
        const review = await Review.findByIdAndUpdate(
            req.params.id,
            { verified: req.body.verified },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        res.json(review);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
