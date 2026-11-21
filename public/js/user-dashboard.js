
document.addEventListener('DOMContentLoaded', async () => {
    const bookingList = document.getElementById('booking-list');
    const bookingStatus = document.getElementById('booking-status');

    if (!bookingList || !bookingStatus) {
        return;
    }

    try {
        const response = await fetch('/api/users/me/bookings', {
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Unable to retrieve bookings.');
        }

        const data = await response.json();
        const bookings = data.bookings;

        if (!Array.isArray(bookings)) {
            throw new Error('Invalid booking response.');
        }

        bookingList.replaceChildren();

        if (bookings.length === 0) {
            bookingStatus.textContent =
                'You have no bookings yet. Explore our train trips to get started.';
            return;
        }

        bookings.forEach((booking) => {
            const item = document.createElement('li');
            const heading = document.createElement('h3');
            const details = document.createElement('p');

            heading.textContent = `Booking ${booking.id}`;

            const date = booking.createdAt
                ? new Date(booking.createdAt).toLocaleDateString()
                : 'Date unavailable';

            details.textContent =
                `Trip: ${booking.tripId || 'Not specified'} | ` +
                `Class: ${booking.ticketClass || 'Not specified'} | ` +
                `Booked: ${date}`;

            item.append(heading, details);
            bookingList.appendChild(item);
        });

        bookingList.hidden = false;
        bookingStatus.textContent =
            `${bookings.length} booking(s) found.`;
    } catch (error) {
        console.error('Booking dashboard error:', error);
        bookingStatus.textContent =
            'Unable to load your bookings. Please try again later.';
    }
});
