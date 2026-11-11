
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

const findAllBookings = mock.fn();

mock.module('../src/models/bookings.js', {
    namedExports: {
        getAllBookings: findAllBookings
    }
});

const { getAllBookings } = await import(
    '../src/controllers/bookings.js'
);

describe('Bookings Controller', () => {
    it('returns all bookings with status 200', async () => {
        const bookings = [
            {
                id: 'TEST-123',
                ticketClass: 'Economy',
                passengers: [
                    {
                        firstName: 'Test',
                        lastName: 'Passenger'
                    }
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

function createResponse() {
    return {
        statusCode: 200,
        body: null,

        status(code) {
            this.statusCode = code;
            return this;
        },

        json(data) {
            this.body = data;
            return this;
        }
    };
}
