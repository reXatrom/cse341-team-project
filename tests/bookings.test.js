import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/models/bookings.js', () => ({
  getAllBookings: vi.fn()
}));

import { getAllBookings as findAllBookings } from '../src/models/bookings.js';
import { getAllBookings } from '../src/controllers/bookings.js';

describe('Bookings Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {};

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
  });

  it('returns all bookings with status 200', async () => {
    const bookings = [{ id: 'TEST-123', passengers: [] }];

    findAllBookings.mockResolvedValue(bookings);

    await getAllBookings(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(bookings);
  });

  it('returns an empty array when no bookings exist', async () => {
    findAllBookings.mockResolvedValue([]);

    await getAllBookings(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('returns status 500 when retrieving bookings fails', async () => {
    findAllBookings.mockRejectedValue(new Error('Database error'));

    const consoleSpy = vi.spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      await getAllBookings(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to retrieve bookings.'
      });
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
