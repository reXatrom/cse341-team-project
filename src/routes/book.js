
import { getDb } from '../db/connect.js';
import { generateConfirmationCode } from '../includes/helpers.js';

const bookingPage = async (req, res, next) => {
    try {
        const { scheduleId } = req.params;
        const db = getDb();

        const schedule = await db.collection('schedules').findOne({
            id: Number(scheduleId)
        });

        if (!schedule) {
            return res.status(404).render('errors/404', {
                title: 'Schedule Not Found'
            });
        }

        const trip = await db.collection('trips').findOne({
            id: schedule.tripId
        });

        if (!trip) {
            return res.status(404).render('errors/404', {
                title: 'Trip Not Found'
            });
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
        return next(error);
    }
};

const processBookingRequest = async (req, res, next) => {
    try {
        const confirmation = {
            ...req.body,
            id: generateConfirmationCode(),
            createdAt: new Date().toISOString()
        };

        // Associate the booking with the authenticated account.
        // Never accept the booking owner from submitted form data.
        delete confirmation.bookingOwnerId;

        if (req.session?.user?.id) {
            confirmation.bookingOwnerId = req.session.user.id;
        }

        await getDb()
            .collection('confirmations')
            .insertOne(confirmation);

        return res.redirect(
            `/trips/confirmation/${confirmation.id}`
        );
    } catch (error) {
        return next(error);
    }
};

export { bookingPage, processBookingRequest };
