module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.test.js'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: '<rootDir>/e2e/detox.globalSetup.js',
  globalTeardown: '<rootDir>/e2e/detox.globalTeardown.js',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true
};
