const express = require('express');
const { auth } = require('../middleware/auth');
const MenuItem = require('../models/MenuItem');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all menu items (public)
router.get('/', async (req, res) => {
    try {
        const filters = {};
        
        // Apply filters if provided
        if (req.query.category) {
            filters.category = req.query.category;
        }
        if (req.query.available === 'true') {
            filters.available = true;
        }
        if (req.query.dietary) {
            const dietary = req.query.dietary.split(',');
            dietary.forEach(diet => {
                filters[`dietary.${diet}`] = true;
            });
        }

        const menuItems = await MenuItem.find(filters)
            .sort({ category: 1, name: 1 });
        
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching menu items' });
    }
});

// Get menu item by ID (public)
router.get('/:id', async (req, res) => {
    try {
        const menuItem = await MenuItem.findById(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.json(menuItem);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching menu item' });
    }
});

// Get menu items by category (public)
router.get('/category/:category', async (req, res) => {
    try {
        const menuItems = await MenuItem.find({
            category: req.params.category,
            available: true
        }).sort({ name: 1 });
        
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching menu items' });
    }
});

// Search menu items (public)
router.get('/search/:query', async (req, res) => {
    try {
        const searchRegex = new RegExp(req.params.query, 'i');
        const menuItems = await MenuItem.find({
            $or: [
                { name: searchRegex },
                { description: searchRegex },
                { category: searchRegex }
            ],
            available: true
        });
        
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ message: 'Error searching menu items' });
    }
});

// Get featured menu items (public)
router.get('/featured/items', async (req, res) => {
    try {
        const featuredItems = await MenuItem.find({
            available: true,
            popular: true
        }).limit(6);
        
        res.json(featuredItems);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching featured items' });
    }
});

// Create menu item (admin only)
router.post('/',
    auth,
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('description').trim().notEmpty().withMessage('Description is required'),
        body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
        body('category').trim().notEmpty().withMessage('Category is required')
    ],
    async (req, res) => {
        try {
            // Validate admin role
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Not authorized' });
            }

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const menuItem = new MenuItem({
                name: req.body.name,
                description: req.body.description,
                price: req.body.price,
                category: req.body.category,
                image: req.body.image,
                dietary: {
                    vegetarian: req.body.vegetarian || false,
                    vegan: req.body.vegan || false,
                    glutenFree: req.body.glutenFree || false
                },
                spicyLevel: req.body.spicyLevel || 0,
                available: req.body.available !== false,
                popular: req.body.popular || false
            });

            await menuItem.save();
            res.status(201).json(menuItem);
        } catch (error) {
            res.status(500).json({ message: 'Error creating menu item' });
        }
    }
);

// Update menu item (admin only)
router.put('/:id',
    auth,
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('description').trim().notEmpty().withMessage('Description is required'),
        body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
        body('category').trim().notEmpty().withMessage('Category is required')
    ],
    async (req, res) => {
        try {
            // Validate admin role
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Not authorized' });
            }

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const menuItem = await MenuItem.findByIdAndUpdate(
                req.params.id,
                {
                    name: req.body.name,
                    description: req.body.description,
                    price: req.body.price,
                    category: req.body.category,
                    image: req.body.image,
                    dietary: {
                        vegetarian: req.body.vegetarian || false,
                        vegan: req.body.vegan || false,
                        glutenFree: req.body.glutenFree || false
                    },
                    spicyLevel: req.body.spicyLevel || 0,
                    available: req.body.available !== false,
                    popular: req.body.popular || false
                },
                { new: true }
            );

            if (!menuItem) {
                return res.status(404).json({ message: 'Menu item not found' });
            }

            res.json(menuItem);
        } catch (error) {
            res.status(500).json({ message: 'Error updating menu item' });
        }
    }
);

// Delete menu item (admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        // Validate admin role
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting menu item' });
    }
});

module.exports = router;
