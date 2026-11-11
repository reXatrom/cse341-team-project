
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

const findAllBookings = mock.fn();
const saveBooking = mock.fn();
const findBookingById = mock.fn();
const getDatabase = mock.fn();
const generateCode = mock.fn();

mock.module('../src/models/bookings.js', {
    namedExports: {
        getAllBookings: findAllBookings,
        createBooking: saveBooking,
        getBookingById: findBookingById
    }
});

mock.module('../src/db/connect.js', {
    namedExports: {
        getDb: getDatabase
    }
});

mock.module('../src/includes/helpers.js', {
    namedExports: {
        generateConfirmationCode: generateCode
    }
});

const { getAllBookings } = await import(
    '../src/controllers/bookings.js'
);

const { processBookingRequest } = await import(
    '../src/routes/book.js'
);

const { default: confirmationPage } = await import(
    '../src/routes/confirm.js'
);

function createResponse() {
    return {
        statusCode: 200,
        body: null,
        redirectedTo: null,
        renderedView: null,
        renderedData: null,

        status(code) {
            this.statusCode = code;
            return this;
        },

        json(data) {
            this.body = data;
            return this;
        },

        send(data) {
            this.body = data;
            return this;
        },

        redirect(url) {
            this.statusCode = 302;
            this.redirectedTo = url;
            return this;
        },

        render(view, data) {
            this.renderedView = view;
            this.renderedData = data;
            return this;
        }
    };
}

function createPassenger(number = 1) {
    return {
        firstName: `Test${number}`,
        lastName: 'Passenger',
        email: `passenger${number}@example.com`,
        phone: '+81 120-123-4567'
    };
}

function createValidBookingRequest() {
    return {
        body: {
            scheduleId: '1',
            tripId: 'alpine-panorama',
            ticketClass: 'premium',
            selectedDay: 'monday',
            passengers: [
                createPassenger(1),
                createPassenger(2)
            ]
        }
    };
}

function setupBookingDatabase() {
    const schedule = {
        id: 1,
        tripId: 'alpine-panorama',
        daysOfWeek: [
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday'
        ]
    };

    const trip = {
        id: 'alpine-panorama',
        distance: 180
    };

    const ticketClass = {
        class: 'premium',
        name: 'Premium Class',
        pricePerKm: 150
    };

    const collections = {
        schedules: {
            findOne: async ({ id }) => {
                return id === 1 ? schedule : null;
            }
        },

        trips: {
            findOne: async ({ id }) => {
                return id === 'alpine-panorama'
                    ? trip
                    : null;
            }
        },

        ticketClasses: {
            findOne: async ({ class: className }) => {
                return className === 'premium'
                    ? ticketClass
                    : null;
            }
        }
    };

    getDatabase.mock.mockImplementation(() => ({
        collection(name) {
            if (!collections[name]) {
                throw new Error(
                    `Unexpected collection: ${name}`
                );
            }

            return collections[name];
        }
    }));
}

describe('Bookings Controller', () => {
    it('returns all bookings with status 200', async () => {
        const bookings = [
            {
                id: 'TEST-123',
                ticketClass: 'premium',
                passengers: [
                    createPassenger(1)
                ]
            }
        ];

        findAllBookings.mock.mockImplementation(
            async () => bookings
        );

        const res = createResponse();

        await getAllBookings({}, res);

        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.body, bookings);
    });

    it('returns an empty array when no bookings exist', async () => {
        findAllBookings.mock.mockImplementation(
            async () => []
        );

        const res = createResponse();

        await getAllBookings({}, res);

        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.body, []);
    });

    it('returns status 500 when retrieving bookings fails', async () => {
        findAllBookings.mock.mockImplementation(
            async () => {
                throw new Error('Database error');
            }
        );

        const originalConsoleError = console.error;
        console.error = () => { };

        try {
            const res = createResponse();

            await getAllBookings({}, res);

            assert.equal(res.statusCode, 500);
            assert.deepEqual(res.body, {
                message: 'Failed to retrieve bookings.'
            });
        } finally {
            console.error = originalConsoleError;
        }
    });
});

describe('Booking Creation', () => {
    it('creates a valid booking and redirects to confirmation', async () => {
        setupBookingDatabase();

        generateCode.mock.mockImplementation(
            () => 'JRTEST123'
        );

        saveBooking.mock.mockImplementation(
            async (bookingData) => bookingData
        );

        const req = createValidBookingRequest();
        const res = createResponse();

        await processBookingRequest(req, res);

        assert.equal(res.statusCode, 302);

        assert.equal(
            res.redirectedTo,
            '/trips/confirmation/JRTEST123'
        );

        assert.equal(
            saveBooking.mock.callCount() > 0,
            true
        );

        const savedData = saveBooking.mock.calls.at(-1)
            .arguments[0];

        assert.equal(savedData.id, 'JRTEST123');
        assert.equal(savedData.scheduleId, 1);
        assert.equal(
            savedData.tripId,
            'alpine-panorama'
        );
        assert.equal(
            savedData.ticketClass,
            'premium'
        );
        assert.equal(savedData.selectedDay, 'monday');
        assert.equal(savedData.passengers.length, 2);
    });

    it('rejects a passenger with missing required fields', async () => {
        const req = createValidBookingRequest();

        delete req.body.passengers[0].email;

        const res = createResponse();

        const previousSaveCalls = saveBooking.mock.callCount();

        await processBookingRequest(req, res);

        assert.equal(res.statusCode, 400);

        assert.equal(
            res.body,
            'All passenger details are required.'
        );

        assert.equal(
            saveBooking.mock.callCount(),
            previousSaveCalls
        );
    });

    it('rejects bookings with more than 8 passengers', async () => {
        const req = createValidBookingRequest();

        req.body.passengers = Array.from(
            { length: 9 },
            (_, index) => createPassenger(index + 1)
        );

        const res = createResponse();

        const previousSaveCalls = saveBooking.mock.callCount();

        await processBookingRequest(req, res);

        assert.equal(res.statusCode, 400);

        assert.equal(
            res.body,
            'A booking must have between 1 and 8 passengers.'
        );

        assert.equal(
            saveBooking.mock.callCount(),
            previousSaveCalls
        );
    });

    it('rejects bookings without passengers', async () => {
        const req = createValidBookingRequest();

        req.body.passengers = [];

        const res = createResponse();

        await processBookingRequest(req, res);

        assert.equal(res.statusCode, 400);
    });

    it('rejects a trip that does not match its schedule', async () => {
        setupBookingDatabase();

        const req = createValidBookingRequest();

        req.body.tripId = 'incorrect-trip';

        const res = createResponse();

        await processBookingRequest(req, res);

        assert.equal(res.statusCode, 400);

        assert.equal(
            res.body,
            'The selected trip does not match the schedule.'
        );
    });
});

describe('Booking Confirmation', () => {
    it('retrieves and displays an existing booking', async () => {
        const booking = {
            id: 'JRTEST123',
            scheduleId: 1,
            tripId: 'alpine-panorama',
            ticketClass: 'premium',
            selectedDay: 'monday',
            passengers: [
                createPassenger(1)
            ]
        };

        findBookingById.mock.mockImplementation(
            async () => booking
        );

        const req = {
            params: {
                confirmationId: 'JRTEST123'
            }
        };

        const res = createResponse();

        await confirmationPage(req, res);

        assert.equal(res.statusCode, 200);

        assert.equal(
            res.renderedView,
            'trips/confirm'
        );

        assert.equal(
            res.renderedData.title,
            'Trip Confirmation'
        );

        assert.deepEqual(
            res.renderedData.confirmation,
            booking
        );
    });

    it('returns 404 for an unknown confirmation code', async () => {
        findBookingById.mock.mockImplementation(
            async () => null
        );

        const req = {
            params: {
                confirmationId: 'UNKNOWN123'
            }
        };

        const res = createResponse();

        await confirmationPage(req, res);

        assert.equal(res.statusCode, 404);

        assert.equal(
            res.body,
            'Booking not found.'
        );
    });

    it('returns 500 when confirmation lookup fails', async () => {
        findBookingById.mock.mockImplementation(
            async () => {
                throw new Error('Database unavailable');
            }
        );

        const originalConsoleError = console.error;
        console.error = () => { };

        try {
            const req = {
                params: {
                    confirmationId: 'JRTEST123'
                }
            };

            const res = createResponse();

            await confirmationPage(req, res);

            assert.equal(res.statusCode, 500);

            assert.equal(
                res.body,
                'Unable to load booking confirmation.'
            );
        } finally {
            console.error = originalConsoleError;
        }
    });
});
