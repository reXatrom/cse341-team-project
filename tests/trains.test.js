
import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';

describe('GET /api/trains', () => {
  test('returns JSON with pagination metadata', async () => {
    const response = await request(app).get('/api/trains');

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
    const response = await request(app).get('/api/trains');

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

    const response = await request(app).get('/api/trains');

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
    const response = await request(app).get('/api/trains');

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

  test('searches train names case-insensitively', async () => {
    const response = await request(app)
      .get('/api/trains?search=e353');

    expect(response.status).toBe(200);
    expect(response.body.trains).toHaveLength(1);
    expect(response.body.trains[0].id).toBe('series-e353');
    expect(response.body.pagination.totalItems).toBe(1);
  });

  test('supports partial train name searches', async () => {
    const response = await request(app)
      .get('/api/trains?search=series');

    expect(response.status).toBe(200);
    expect(response.body.trains.length).toBeGreaterThanOrEqual(2);

    response.body.trains.forEach((train) => {
      expect(train.name.toLowerCase()).toContain('series');
    });
  });

  test('filters by operator', async () => {
    const response = await request(app)
      .get('/api/trains?operator=JR%20West');

    expect(response.status).toBe(200);
    expect(response.body.trains).toHaveLength(1);
    expect(response.body.trains[0].operator).toBe('JR West');
  });

  test('filters by train type', async () => {
    const response = await request(app)
      .get('/api/trains?type=Steam%20Excursion');

    expect(response.status).toBe(200);
    expect(response.body.trains).toHaveLength(1);
    expect(response.body.trains[0].id).toBe('steam-c11');
  });

  test('filters by power source', async () => {
    const response = await request(app)
      .get('/api/trains?powerSource=electric');

    expect(response.status).toBe(200);
    expect(response.body.trains).toHaveLength(2);

    response.body.trains.forEach((train) => {
      expect(train.powerSource).toBe('Electric');
    });
  });

  test('combines search and filters', async () => {
    const response = await request(app)
      .get('/api/trains?search=series&powerSource=Electric');

    expect(response.status).toBe(200);
    expect(response.body.trains).toHaveLength(2);
    expect(response.body.pagination.totalItems).toBe(2);
  });

  test('paginates filtered results', async () => {
    const first = await request(app)
      .get('/api/trains?powerSource=Electric&page=1&limit=1');

    const second = await request(app)
      .get('/api/trains?powerSource=Electric&page=2&limit=1');

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);

    expect(first.body.trains).toHaveLength(1);
    expect(second.body.trains).toHaveLength(1);

    expect(first.body.pagination.totalItems).toBe(2);
    expect(first.body.pagination.totalPages).toBe(2);
    expect(first.body.pagination.hasNextPage).toBe(true);

    expect(second.body.pagination.hasPreviousPage).toBe(true);
    expect(first.body.trains[0].id).not.toBe(
      second.body.trains[0].id
    );
  });

  test('returns no matches for an unknown name', async () => {
    const response = await request(app)
      .get('/api/trains?search=unknown-train-xyz');

    expect(response.status).toBe(200);
    expect(response.body.trains).toEqual([]);
    expect(response.body.pagination.totalItems).toBe(0);
    expect(response.body.pagination.totalPages).toBe(0);
  });

  test('rejects array-valued search parameters', async () => {
    const response = await request(app)
      .get('/api/trains?search=Series&search=Express');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('rejects search terms longer than 100 characters', async () => {
    const response = await request(app)
      .get(`/api/trains?search=${'a'.repeat(101)}`);

    expect(response.status).toBe(400);
  });

  test('treats regex characters as literal text', async () => {
    const response = await request(app)
      .get('/api/trains?search=%2E%2A');

    expect(response.status).toBe(200);
    expect(response.body.trains).toEqual([]);
  });

  test('returns the applied filter values', async () => {
    const response = await request(app)
      .get('/api/trains?search=Series&powerSource=Electric');

    expect(response.status).toBe(200);
    expect(response.body.filters).toEqual({
      search: 'Series',
      operator: '',
      type: '',
      powerSource: 'Electric'
    });
  });
});
