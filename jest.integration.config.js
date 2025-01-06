module.exports = {
  // Use the jsdom test environment
  testEnvironment: 'jsdom',
  
  // Look for test files in the integration directory
  testMatch: ['**/tests/integration/**/*.test.js'],
  
  // Setup files to run before tests
  setupFiles: [
    'jest-webextension-mock',
    './tests/setup.integration.js'
  ],
  
  // Module name mappings
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  
  // Transform JavaScript files
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  
  // Coverage settings for integration tests
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/tests/**',
    '!src/setupTests.js'
  ],
  
  // Coverage thresholds for integration tests
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true
};