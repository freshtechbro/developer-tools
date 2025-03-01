/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  // Use a custom transformer for TypeScript files
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', { rootMode: 'upward' }],
  },
  
  // Use Node.js ESM mode
  extensionsToTreatAsEsm: ['.ts'],
  
  // Tell Jest to handle ESM modules
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@developer-tools/shared/(.*)$': '<rootDir>/packages/shared/src/$1',
    '^@developer-tools/server/(.*)$': '<rootDir>/packages/server/src/$1',
    '^@developer-tools/client/(.*)$': '<rootDir>/packages/client/src/$1',
    '^@developer-tools/web-search/(.*)$': '<rootDir>/tools/web-search/$1'
  },
  
  // Setup files that run before each test
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Test environment
  testEnvironment: 'node',
  
  // Generate coverage reports
  collectCoverage: true,
  collectCoverageFrom: [
    'packages/*/src/**/*.{ts,tsx}',
    'tools/*/src/**/*.{ts,tsx}',
    'tools/*.ts',
    '!packages/*/src/**/*.d.ts',
    '!packages/*/src/**/__tests__/**',
    '!packages/*/src/**/__mocks__/**',
    '!tools/*/tests/**'
  ],
  
  // Projects for monorepo setup
  projects: [
    {
      displayName: 'shared',
      testMatch: ['<rootDir>/packages/shared/src/**/__tests__/**/*.test.ts'],
      testPathIgnorePatterns: ['/node_modules/']
    },
    {
      displayName: 'client',
      testMatch: ['<rootDir>/packages/client/src/**/__tests__/**/*.test.ts'],
      testPathIgnorePatterns: ['/node_modules/']
    },
    {
      displayName: 'server',
      testMatch: ['<rootDir>/packages/server/src/**/__tests__/**/*.test.ts'],
      testPathIgnorePatterns: [
        '/node_modules/',
        '<rootDir>/packages/server/src/services/__tests__/gemini.service.test.ts',
        '<rootDir>/packages/server/src/services/__tests__/perplexity.service.test.ts'
      ]
    },
    {
      displayName: 'tools',
      testMatch: [
        '<rootDir>/tools/**/tests/**/*.test.ts',
        '<rootDir>/tools/**/__tests__/**/*.test.ts'
      ],
      testPathIgnorePatterns: ['/node_modules/']
    }
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    },
    './packages/shared/src/': {
      branches: 0,
      functions: 10,
      lines: 10,
      statements: 10
    },
    './packages/shared/src/logger.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './packages/client/src/utils.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './packages/server/src/services/file-storage.service.ts': {
      branches: 70,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './tools/web-search/web-search.ts': {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}; 