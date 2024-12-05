const express = require('express');
const { auth } = require('../middleware/auth');
const Reservation = require('../models/Reservation');
const { sendEmail, emailTemplates } = require('../utils/email');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all reservations for authenticated user
router.get('/my-reservations', auth, async (req, res) => {
    try {
        const reservations = await Reservation.find({ user: req.user._id })
            .sort({ date: -1 });
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reservations' });
    }
});

// Get specific reservation
router.get('/:id', auth, async (req, res) => {
    try {
        const reservation = await Reservation.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        res.json(reservation);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reservation' });
    }
});

// Check availability for a specific date and time
router.get('/check-availability/:date/:time', async (req, res) => {
    try {
        const { date, time } = req.params;
        const existingReservations = await Reservation.find({
            date: new Date(date),
            time,
            status: { $ne: 'cancelled' }
        });

        // Assuming maximum 20 tables available per time slot
        const isAvailable = existingReservations.length < 20;
        res.json({ available: isAvailable, remainingTables: 20 - existingReservations.length });
    } catch (error) {
        res.status(500).json({ message: 'Error checking availability' });
    }
});

// Create new reservation
router.post('/',
    auth,
    [
        body('date').isISO8601().withMessage('Valid date is required'),
        body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time is required'),
        body('partySize').isInt({ min: 1, max: 20 }).withMessage('Party size must be between 1 and 20')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // Check if the requested time slot is available
            const existingReservations = await Reservation.find({
                date: new Date(req.body.date),
                time: req.body.time,
                status: { $ne: 'cancelled' }
            });

            if (existingReservations.length >= 20) {
                return res.status(400).json({ message: 'Selected time slot is fully booked' });
            }

            const reservation = new Reservation({
                user: req.user._id,
                date: req.body.date,
                time: req.body.time,
                partySize: req.body.partySize,
                specialRequests: req.body.specialRequests
            });

            await reservation.save();

            // Send confirmation email
            await sendEmail({
                to: req.user.email,
                ...emailTemplates.reservationConfirmation({
                    ...reservation.toObject(),
                    user: req.user
                })
            });

            res.status(201).json(reservation);
        } catch (error) {
            res.status(500).json({ message: 'Error creating reservation' });
        }
    }
);

// Update reservation
router.put('/:id',
    auth,
    [
        body('date').isISO8601().withMessage('Valid date is required'),
        body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time is required'),
        body('partySize').isInt({ min: 1, max: 20 }).withMessage('Party size must be between 1 and 20')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // Check if the reservation exists and belongs to the user
            const reservation = await Reservation.findOne({
                _id: req.params.id,
                user: req.user._id
            });

            if (!reservation) {
                return res.status(404).json({ message: 'Reservation not found' });
            }

            // Check if the new time slot is available
            const existingReservations = await Reservation.find({
                date: new Date(req.body.date),
                time: req.body.time,
                _id: { $ne: req.params.id },
                status: { $ne: 'cancelled' }
            });

            if (existingReservations.length >= 20) {
                return res.status(400).json({ message: 'Selected time slot is fully booked' });
            }

            reservation.date = req.body.date;
            reservation.time = req.body.time;
            reservation.partySize = req.body.partySize;
            reservation.specialRequests = req.body.specialRequests;

            await reservation.save();

            // Send update confirmation email
            await sendEmail({
                to: req.user.email,
                ...emailTemplates.reservationUpdate({
                    ...reservation.toObject(),
                    user: req.user
                })
            });

            res.json(reservation);
        } catch (error) {
            res.status(500).json({ message: 'Error updating reservation' });
        }
    }
);

// Cancel reservation
router.delete('/:id', auth, async (req, res) => {
    try {
        const reservation = await Reservation.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        // Instead of deleting, mark as cancelled
        reservation.status = 'cancelled';
        await reservation.save();

        // Send cancellation email
        await sendEmail({
            to: req.user.email,
            ...emailTemplates.reservationCancellation({
                ...reservation.toObject(),
                user: req.user
            })
        });

        res.json({ message: 'Reservation cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error cancelling reservation' });
    }
});

module.exports = router;
