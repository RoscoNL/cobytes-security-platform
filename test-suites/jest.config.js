module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 60000,
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'Cobytes Security Platform Test Report',
      outputPath: './test-reports/index.html',
      includeFailureMsg: true,
      includeConsoleLog: true,
      dateFormat: 'yyyy-mm-dd HH:MM:ss'
    }]
  ],
  collectCoverage: true,
  coverageDirectory: './test-reports/coverage',
  coverageReporters: ['html', 'text', 'lcov'],
  testMatch: [
    '**/test-suites/**/*.test.ts',
    '**/test-suites/**/*.test.js'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/test-suites/utils/setup.ts']
};