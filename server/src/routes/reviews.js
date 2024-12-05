const express = require('express');
const { auth } = require('../middleware/auth');
const Review = require('../models/Review');
const Order = require('../models/Order');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all approved reviews (public)
router.get('/', async (req, res) => {
    try {
        const reviews = await Review.find({ status: 'approved' })
            .sort({ createdAt: -1 })
            .populate('user', 'name')
            .populate('order', 'items');
        
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews' });
    }
});

// Get featured reviews (public)
router.get('/featured', async (req, res) => {
    try {
        const reviews = await Review.find({
            status: 'approved',
            rating: { $gte: 4 }
        })
        .sort({ rating: -1 })
        .limit(6)
        .populate('user', 'name')
        .populate('order', 'items');
        
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching featured reviews' });
    }
});

// Get reviews statistics (public)
router.get('/stats', async (req, res) => {
    try {
        const stats = await Review.aggregate([
            { $match: { status: 'approved' } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    ratingDistribution: {
                        $push: '$rating'
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    averageRating: { $round: ['$averageRating', 1] },
                    totalReviews: 1,
                    ratingDistribution: {
                        1: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 1] } } } },
                        2: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 2] } } } },
                        3: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 3] } } } },
                        4: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 4] } } } },
                        5: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 5] } } } }
                    }
                }
            }
        ]);

        res.json(stats[0] || {
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching review statistics' });
    }
});

// Get user's reviews
router.get('/my-reviews', auth, async (req, res) => {
    try {
        const reviews = await Review.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate('order', 'items');
        
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching your reviews' });
    }
});

// Create new review
router.post('/',
    auth,
    [
        body('orderId').notEmpty().withMessage('Order ID is required'),
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
        body('comment').trim().isLength({ min: 10 }).withMessage('Comment must be at least 10 characters long')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // Verify order exists and belongs to user
            const order = await Order.findOne({
                _id: req.body.orderId,
                user: req.user._id,
                status: 'completed'
            });

            if (!order) {
                return res.status(400).json({
                    message: 'Order not found or not eligible for review'
                });
            }

            // Check if user already reviewed this order
            const existingReview = await Review.findOne({
                order: req.body.orderId,
                user: req.user._id
            });

            if (existingReview) {
                return res.status(400).json({
                    message: 'You have already reviewed this order'
                });
            }

            const review = new Review({
                user: req.user._id,
                order: req.body.orderId,
                rating: req.body.rating,
                comment: req.body.comment,
                images: req.body.images || [],
                status: 'pending' // Reviews need approval before being public
            });

            await review.save();
            res.status(201).json(review);
        } catch (error) {
            res.status(500).json({ message: 'Error creating review' });
        }
    }
);

// Update review
router.put('/:id',
    auth,
    [
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
        body('comment').trim().isLength({ min: 10 }).withMessage('Comment must be at least 10 characters long')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const review = await Review.findOne({
                _id: req.params.id,
                user: req.user._id
            });

            if (!review) {
                return res.status(404).json({ message: 'Review not found' });
            }

            review.rating = req.body.rating;
            review.comment = req.body.comment;
            review.images = req.body.images || review.images;
            review.status = 'pending'; // Reset to pending after update
            review.updatedAt = Date.now();

            await review.save();
            res.json(review);
        } catch (error) {
            res.status(500).json({ message: 'Error updating review' });
        }
    }
);

// Delete review
router.delete('/:id', auth, async (req, res) => {
    try {
        const review = await Review.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        await review.remove();
        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting review' });
    }
});

// Moderate review (admin only)
router.patch('/:id/moderate',
    auth,
    [
        body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status'),
        body('moderationComment').optional().trim()
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

            const review = await Review.findById(req.params.id);
            if (!review) {
                return res.status(404).json({ message: 'Review not found' });
            }

            review.status = req.body.status;
            review.moderationComment = req.body.moderationComment;
            review.moderatedAt = Date.now();
            review.moderatedBy = req.user._id;

            await review.save();
            res.json(review);
        } catch (error) {
            res.status(500).json({ message: 'Error moderating review' });
        }
    }
);

module.exports = router;
