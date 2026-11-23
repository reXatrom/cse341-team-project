
import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Trips API', () => {
    test('GET /api/trips returns the first page with default pagination', async () => {
        const response = await request(app).get('/api/trips');

        expect(response.status).toBe(200);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data).toHaveLength(6);

        expect(response.body.pagination).toEqual({
            page: 1,
            limit: 10,
            totalItems: 6,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false
        });

        expect(response.body.filters).toEqual({
            region: null,
            season: null,
            q: null
        });
    });

    test('GET /api/trips supports a custom page and limit', async () => {
        const response = await request(app)
            .get('/api/trips?page=2&limit=2');

        expect(response.status).toBe(200);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data).toHaveLength(2);

        expect(response.body.pagination).toEqual({
            page: 2,
            limit: 2,
            totalItems: 6,
            totalPages: 3,
            hasNextPage: true,
            hasPreviousPage: true
        });
    });

    test('GET /api/trips returns an empty page when the requested page exceeds the available pages', async () => {
        const response = await request(app)
            .get('/api/trips?page=4&limit=2');

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);

        expect(response.body.pagination).toEqual({
            page: 4,
            limit: 2,
            totalItems: 6,
            totalPages: 3,
            hasNextPage: false,
            hasPreviousPage: true
        });
    });

    test.each(['0', '-1', '1.5', 'abc'])(
        'GET /api/trips rejects invalid page value: %s',
        async (page) => {
            const response = await request(app)
                .get(`/api/trips?page=${page}`);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        }
    );

    test.each(['0', '-1', '1.5', 'abc'])(
        'GET /api/trips rejects invalid limit value: %s',
        async (limit) => {
            const response = await request(app)
                .get(`/api/trips?limit=${limit}`);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        }
    );

    test('GET /api/trips rejects a limit greater than 50', async () => {
        const response = await request(app)
            .get('/api/trips?limit=51');

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty(
            'error',
            'Limit cannot exceed 50.'
        );
    });

    // Region filtering tests
    test.each([
        ['central', 2],
        ['northern', 1],
        ['kansai', 2],
        ['hokkaido', 1]
    ])(
        'GET /api/trips filters by region: %s',
        async (region, expectedCount) => {
            const response = await request(app)
                .get(`/api/trips?region=${region}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(expectedCount);

            expect(response.body.data.every(
                (trip) => trip.region === region
            )).toBe(true);

            expect(response.body.pagination.totalItems).toBe(expectedCount);
            expect(response.body.filters.region).toBe(region);
        }
    );

    // Season filtering tests
    test.each([
        ['spring', 1],
        ['summer', 1],
        ['autumn', 3],
        ['winter', 1]
    ])(
        'GET /api/trips filters by season: %s',
        async (season, expectedCount) => {
            const response = await request(app)
                .get(`/api/trips?season=${season}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(expectedCount);

            expect(response.body.data.every(
                (trip) => trip.bestSeason === season
            )).toBe(true);

            expect(response.body.pagination.totalItems).toBe(expectedCount);
            expect(response.body.filters.season).toBe(season);
        }
    );

    // Keyword search tests
    test('GET /api/trips searches trip names', async () => {
        const response = await request(app)
            .get('/api/trips')
            .query({ q: 'Alpine Panorama' });

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].id).toBe('alpine-panorama');
        expect(response.body.filters.q).toBe('Alpine Panorama');
    });

    test('GET /api/trips searches trip descriptions', async () => {
        const response = await request(app)
            .get('/api/trips')
            .query({ q: 'cherry blossom' });

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].id).toBe('sakura-valley');
    });

    // Combined filtering and pagination tests
    test('GET /api/trips combines region, season, and keyword filters', async () => {
        const response = await request(app)
            .get('/api/trips?region=central&season=autumn&q=gorge');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].id).toBe('gorge-explorer');

        expect(response.body.pagination).toEqual({
            page: 1,
            limit: 10,
            totalItems: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false
        });

        expect(response.body.filters).toEqual({
            region: 'central',
            season: 'autumn',
            q: 'gorge'
        });
    });

    test('GET /api/trips applies filters before pagination', async () => {
        const response = await request(app)
            .get('/api/trips?region=central&page=2&limit=1');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].id).toBe('gorge-explorer');

        expect(response.body.pagination).toEqual({
            page: 2,
            limit: 1,
            totalItems: 2,
            totalPages: 2,
            hasNextPage: false,
            hasPreviousPage: true
        });
    });

    test('GET /api/trips returns empty results when filters have no matches', async () => {
        const response = await request(app)
            .get('/api/trips?region=northern&season=winter');

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);

        expect(response.body.pagination.totalItems).toBe(0);
        expect(response.body.pagination.totalPages).toBe(0);

        expect(response.body.filters).toEqual({
            region: 'northern',
            season: 'winter',
            q: null
        });
    });

    // Filter validation tests
    test.each(['invalid', 'tokyo', ''])(
        'GET /api/trips rejects invalid region value: %s',
        async (region) => {
            const response = await request(app)
                .get('/api/trips')
                .query({ region });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        }
    );

    test.each(['invalid', 'monsoon', ''])(
        'GET /api/trips rejects invalid season value: %s',
        async (season) => {
            const response = await request(app)
                .get('/api/trips')
                .query({ season });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        }
    );

    // Keyword validation tests
    test('GET /api/trips rejects a non-string keyword query', async () => {
        const response = await request(app)
            .get('/api/trips')
            .query({ q: ['alpine', 'coastal'] });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });

    test('GET /api/trips rejects a keyword query longer than 100 characters', async () => {
        const response = await request(app)
            .get('/api/trips')
            .query({ q: 'a'.repeat(101) });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });

    // Existing single-trip and CRUD tests
    test('GET /api/trips/:id returns one trip', async () => {
        const response = await request(app)
            .get('/api/trips/alpine-panorama');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', 'alpine-panorama');
        expect(response.body).toHaveProperty('name');
    });

    test('GET /api/trips/:id returns 404 for a missing trip', async () => {
        const response = await request(app)
            .get('/api/trips/nonexistent-trip');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Trip not found');
    });

    test('POST /api/trips creates a new trip', async () => {
        const newTrip = {
            id: 'test-trip',
            name: 'Test Scenic Trip',
            description: 'A test scenic railway journey.',
            region: 'test',
            startStation: 'Test Start',
            endStation: 'Test End',
            duration: '2 hours',
            distance: 100,
            highlights: ['Scenic views', 'Mountain railway'],
            bestSeason: 'summer',
            operatingMonths: [6, 7, 8],
            imageUrl: 'https://example.com/test-trip.jpg'
        };

        const response = await request(app)
            .post('/api/trips')
            .send(newTrip);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id', 'test-trip');
        expect(response.body).toHaveProperty('name', 'Test Scenic Trip');
    });

    test('POST /api/trips rejects invalid trip data', async () => {
        const response = await request(app)
            .post('/api/trips')
            .send({ id: 'invalid-trip' });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });

    test('POST /api/trips rejects a duplicate trip ID', async () => {
        const duplicateTrip = {
            id: 'alpine-panorama',
            name: 'Duplicate Alpine Trip',
            description: 'A duplicate test trip.',
            region: 'central',
            startStation: 'Nagoya',
            endStation: 'Toyama',
            duration: '4.5 hours',
            distance: 180,
            highlights: ['Mountain scenery'],
            bestSeason: 'autumn',
            operatingMonths: [9, 10, 11],
            imageUrl: 'https://example.com/duplicate.jpg'
        };

        const response = await request(app)
            .post('/api/trips')
            .send(duplicateTrip);

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty(
            'error',
            'A trip with this ID already exists'
        );
    });

    test('PUT /api/trips/:id updates an existing trip', async () => {
        const response = await request(app)
            .put('/api/trips/alpine-panorama')
            .send({ name: 'Updated Alpine Panorama' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty(
            'name',
            'Updated Alpine Panorama'
        );
    });

    test('PUT /api/trips/:id returns 404 for a nonexistent trip', async () => {
        const response = await request(app)
            .put('/api/trips/nonexistent-trip')
            .send({ name: 'Updated Missing Trip' });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Trip not found');
    });

    test('PUT /api/trips/:id rejects invalid update data', async () => {
        const response = await request(app)
            .put('/api/trips/alpine-panorama')
            .send({ distance: -10 });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });

    test('DELETE /api/trips/:id deletes an existing trip', async () => {
        const response = await request(app)
            .delete('/api/trips/alpine-panorama');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty(
            'message',
            'Trip deleted successfully'
        );
    });

    test('DELETE /api/trips/:id returns 404 for a nonexistent trip', async () => {
        const response = await request(app)
            .delete('/api/trips/nonexistent-trip');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Trip not found');
    });
});
