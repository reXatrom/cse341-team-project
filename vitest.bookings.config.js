import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/bookings.test.js'],
    environment: 'node',
    clearMocks: true
  }
});
