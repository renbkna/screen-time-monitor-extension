module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['./tests/setup.js'],
  setupFilesAfterEnv: ['jest-extended'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/setupTests.js',
  ],
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  verbose: true
};