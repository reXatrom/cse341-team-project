
import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';

describe('GET /api/trains', () => {
  test('returns JSON with pagination metadata', async () => {
    const response = await request(app)
      .get('/api/trains');

    expect(response.status).toBe(200);
    expect(response.body.trains).toBeInstanceOf(Array);

    expect(response.body.pagination).toEqual(
      expect.objectContaining({
        page: 1,
        limit: 10,
        totalItems: expect.any(Number),
        totalPages: expect.any(Number),
        hasNextPage: expect.any(Boolean),
        hasPreviousPage: expect.any(Boolean)
      })
    );
  });

  test('returns the starter trains', async () => {
    const response = await request(app)
      .get('/api/trains');

    expect(response.status).toBe(200);

    expect(response.body.trains).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'series-e353',
          name: 'Series E353 Limited Express',
          powerSource: 'Electric'
        })
      ])
    );
  });

  test('returns an added train', async () => {
    const collection = getDb().collection('trains');

    await collection.insertOne({
      id: 'test-express',
      name: 'Test Express',
      operator: 'Test Railway'
    });

    const response = await request(app)
      .get('/api/trains');

    expect(response.status).toBe(200);

    expect(response.body.trains).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'test-express',
          name: 'Test Express'
        })
      ])
    );
  });

  test('uses page 1 and limit 10 by default', async () => {
    const response = await request(app)
      .get('/api/trains');

    expect(response.status).toBe(200);
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(10);
    expect(response.body.trains.length).toBeLessThanOrEqual(10);
  });

  test('supports custom page size', async () => {
    const response = await request(app)
      .get('/api/trains?page=1&limit=2');

    expect(response.status).toBe(200);
    expect(response.body.trains).toHaveLength(2);
    expect(response.body.pagination.limit).toBe(2);
  });

  test('returns different trains on different pages', async () => {
    const first = await request(app)
      .get('/api/trains?page=1&limit=2');

    const second = await request(app)
      .get('/api/trains?page=2&limit=2');

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);

    const firstIds = first.body.trains.map((train) => train.id);
    const secondIds = second.body.trains.map((train) => train.id);

    expect(firstIds).toHaveLength(2);
    expect(secondIds).toHaveLength(2);

    expect(
      firstIds.some((id) => secondIds.includes(id))
    ).toBe(false);
  });

  test('returns HTTP 400 for invalid page', async () => {
    const response = await request(app)
      .get('/api/trains?page=0');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('returns HTTP 400 for invalid limit', async () => {
    const response = await request(app)
      .get('/api/trains?limit=-5');

    expect(response.status).toBe(400);
  });

  test('rejects non-integer values', async () => {
    const response = await request(app)
      .get('/api/trains?page=abc&limit=10');

    expect(response.status).toBe(400);
  });

  test('rejects limits above 100', async () => {
    const response = await request(app)
      .get('/api/trains?limit=101');

    expect(response.status).toBe(400);
  });

  test('returns an empty array beyond the last page', async () => {
    const response = await request(app)
      .get('/api/trains?page=9999&limit=10');

    expect(response.status).toBe(200);
    expect(response.body.trains).toEqual([]);
    expect(response.body.pagination.hasNextPage).toBe(false);
  });
});
