
import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Trips API', () => {
    test('GET /api/trips returns all six starter trips', async () => {
        const response = await request(app).get('/api/trips');

        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body).toHaveLength(6);
    });

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
