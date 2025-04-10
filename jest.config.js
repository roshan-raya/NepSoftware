module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  verbose: true,
  testTimeout: 10000,
  setupFiles: ['<rootDir>/config/test.config.js'],
  globals: {
    'process.env': {
      NODE_ENV: 'test',
      DB_HOST: 'localhost',
      DB_PORT: '3306',
      DB_USER: 'root',
      DB_PASSWORD: 'root',
      DB_NAME: 'ridesharingapp_test'
    }
  }
}; 