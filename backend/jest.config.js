module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setEnv.js'],
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 15000,
};
