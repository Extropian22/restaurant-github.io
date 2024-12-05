const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        enum: ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Beverages']
    },
    image: {
        type: String,
        required: true
    },
    dietary: {
        vegetarian: { type: Boolean, default: false },
        vegan: { type: Boolean, default: false },
        glutenFree: { type: Boolean, default: false }
    },
    spicyLevel: {
        type: Number,
        min: 0,
        max: 3,
        default: 0
    },
    available: {
        type: Boolean,
        default: true
    },
    popular: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
