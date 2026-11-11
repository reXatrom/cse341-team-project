
import { getBookingById } from '../models/bookings.js';

// Display the confirmation page for a completed booking.
const confirmationPage = async (req, res) => {
    try {
        const { confirmationId } = req.params;

        // Retrieve the booking using its confirmation code.
        const booking = await getBookingById(confirmationId);

        if (!booking) {
            return res.status(404).send('Booking not found.');
        }

        // Render the existing confirmation template.
        return res.render('trips/confirm', {
            title: 'Trip Confirmation',
            confirmation: booking
        });
    } catch (error) {
        console.error(
            'Error retrieving booking confirmation:',
            error
        );

        return res.status(500).send(
            'Unable to load booking confirmation.'
        );
    }
};

export default confirmationPage;
