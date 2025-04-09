const request = require('supertest');
const app = require('../index.js');

// Mock the database configuration for tests
jest.mock('../app/services/db', () => ({
  query: jest.fn().mockResolvedValue([{ test: 1 }]),
  createPool: jest.fn().mockResolvedValue(true),
  testConnection: jest.fn().mockResolvedValue(true)
}));

describe('Basic Application Tests', () => {
  test('Application should start without error', async () => {
    const response = await request(app).get('/');
    expect(response.status).not.toBe(500);
  });
}); 