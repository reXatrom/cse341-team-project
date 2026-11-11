
import { getDb } from '../db/connect.js';
import { generateConfirmationCode } from '../includes/helpers.js';
import { createBooking } from '../models/bookings.js';

// Display the booking page for a selected schedule.
const bookingPage = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const db = getDb();

        const schedule = await db.collection('schedules').findOne({
            id: Number(scheduleId)
        });

        if (!schedule) {
            return res.status(404).send('Schedule not found.');
        }

        const trip = await db.collection('trips').findOne({
            id: schedule.tripId
        });

        if (!trip) {
            return res.status(404).send('Trip not found.');
        }

        const ticketClasses = await db
            .collection('ticketClasses')
            .find({})
            .toArray();

        const ticketOptions = ticketClasses.map((ticketClass) => ({
            class: ticketClass.class,
            name: ticketClass.name,
            price: trip.distance * ticketClass.pricePerKm,
            amenities: ticketClass.amenities,
            description: ticketClass.description
        }));

        return res.render('trips/book', {
            title: 'Book Trip',
            schedule,
            ticketOptions
        });
    } catch (error) {
        console.error('Error loading booking page:', error);
        return res.status(500).send('Unable to load booking page.');
    }
};

// Process a submitted booking using Mongoose.
const processBookingRequest = async (req, res) => {
    try {
        const bookingData = {
            ...req.body,
            id: generateConfirmationCode(),
            createdAt: new Date()
        };

        // Save to the bookings collection through Mongoose.
        const booking = await createBooking(bookingData);

        return res.redirect(`/trips/confirmation/${booking.id}`);
    } catch (error) {
        console.error('Error creating booking:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).send('Invalid booking information.');
        }

        return res.status(500).send('Unable to complete booking.');
    }
};

export { bookingPage, processBookingRequest };
