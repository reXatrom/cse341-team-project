
import { getDb } from '../db/connect.js';
import { generateConfirmationCode } from '../includes/helpers.js';
import { createBooking } from '../models/bookings.js';

// Display the booking page for a selected schedule.
const bookingPage = async (req, res) => {
    try {
        const scheduleId = Number(req.params.scheduleId);

        if (!Number.isSafeInteger(scheduleId)) {
            return res.status(400).send('Invalid schedule ID.');
        }

        const db = getDb();

        const schedule = await db.collection('schedules').findOne({
            id: scheduleId
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

        return res.status(500).send(
            'Unable to load booking page.'
        );
    }
};

// Process a submitted booking using Mongoose.
const processBookingRequest = async (req, res) => {
    try {
        const {
            scheduleId,
            tripId,
            ticketClass,
            selectedDay,
            passengers
        } = req.body;

        const numericScheduleId = Number(scheduleId);

        if (
            !Number.isSafeInteger(numericScheduleId) ||
            typeof tripId !== 'string' ||
            typeof ticketClass !== 'string' ||
            typeof selectedDay !== 'string'
        ) {
            return res.status(400).send(
                'Invalid booking information.'
            );
        }

        // Validate passenger information.
        if (
            !Array.isArray(passengers) ||
            passengers.length < 1 ||
            passengers.length > 8
        ) {
            return res.status(400).send(
                'A booking must have between 1 and 8 passengers.'
            );
        }

        const requiredFields = [
            'firstName',
            'lastName',
            'email',
            'phone'
        ];

        const validPassengers = passengers.every((passenger) => {
            return (
                passenger !== null &&
                typeof passenger === 'object' &&
                !Array.isArray(passenger) &&
                requiredFields.every((field) => {
                    return (
                        typeof passenger[field] === 'string' &&
                        passenger[field].trim().length > 0
                    );
                })
            );
        });

        if (!validPassengers) {
            return res.status(400).send(
                'All passenger details are required.'
            );
        }

        const db = getDb();

        // Confirm the selected schedule exists.
        const schedule = await db.collection('schedules').findOne({
            id: numericScheduleId
        });

        if (!schedule) {
            return res.status(404).send(
                'Schedule not found.'
            );
        }

        // Confirm the trip matches the selected schedule.
        if (String(schedule.tripId) !== tripId) {
            return res.status(400).send(
                'The selected trip does not match the schedule.'
            );
        }

        // Confirm the trip exists.
        const trip = await db.collection('trips').findOne({
            id: tripId
        });

        if (!trip) {
            return res.status(404).send(
                'Trip not found.'
            );
        }

        // Confirm the selected day is available.
        if (
            !Array.isArray(schedule.daysOfWeek) ||
            !schedule.daysOfWeek.includes(selectedDay)
        ) {
            return res.status(400).send(
                'The selected travel day is unavailable.'
            );
        }

        // Confirm the selected ticket class exists.
        const selectedTicketClass = await db
            .collection('ticketClasses')
            .findOne({
                class: ticketClass
            });

        if (!selectedTicketClass) {
            return res.status(400).send(
                'Invalid ticket class.'
            );
        }

        const bookingData = {
            id: generateConfirmationCode(),
            scheduleId: numericScheduleId,
            tripId,
            ticketClass,
            selectedDay,
            passengers: passengers.map((passenger) => ({
                firstName: passenger.firstName.trim(),
                lastName: passenger.lastName.trim(),
                email: passenger.email.trim(),
                phone: passenger.phone.trim()
            })),
            createdAt: new Date()
        };

        // Save the validated booking through Mongoose.
        const booking = await createBooking(bookingData);

        return res.redirect(
            `/trips/confirmation/${encodeURIComponent(booking.id)}`
        );
    } catch (error) {
        console.error('Error creating booking:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).send(
                'Invalid booking information.'
            );
        }

        return res.status(500).send(
            'Unable to complete booking.'
        );
    }
};

export {
    bookingPage,
    processBookingRequest
};
