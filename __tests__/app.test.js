const request = require('supertest');
const app = require('../index.js');

// Mock the database service
jest.mock('../app/services/db', () => {
  return {
    query: jest.fn().mockResolvedValue([{ test: 1 }]),
    createPool: jest.fn().mockResolvedValue(true),
    testConnection: jest.fn().mockResolvedValue(true),
    pool: {
      query: jest.fn().mockResolvedValue([{ test: 1 }])
    }
  };
});

// Mock the config
jest.mock('../config/config', () => ({
  db: {
    host: 'localhost',
    port: '3306',
    database: 'test_db',
    user: 'test_user',
    password: 'test_password'
  }
}));

describe('Basic Application Tests', () => {
  beforeAll(async () => {
    // Wait for any async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    // Clean up any resources
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  test('Application should start without error', async () => {
    const response = await request(app).get('/');
    expect(response.status).not.toBe(500);
  });
}); 