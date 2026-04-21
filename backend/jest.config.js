module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/modules/auth/**/*.js',
    'src/modules/projects/**/*.js',
    'src/modules/service-requests/**/*.js',
    'src/utils/notify.js',
    'src/utils/serviceRequestEmail.js',
    'src/jobs/expireServiceRequests.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  clearMocks: true,
  restoreMocks: true,
  verbose: true,
};
