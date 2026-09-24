/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/**/*.test.ts'],
      testPathIgnorePatterns: ['\\.integration\\.test\\.ts$'],
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/**/*.integration.test.ts'],
    },
  ],
  // Coverage counts logic modules in the unit suite. app/server/models are wiring proven by the integration suite.
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/app.ts',
    '!src/server.ts',
    '!src/models/**',
  ],
  coverageThreshold: { global: { branches: 50, functions: 50, lines: 50, statements: 50 } },
};
