import { config } from '../config/index.js';
import { jest } from '@jest/globals';

// Mock process.env
process.env.NODE_ENV = 'test';
process.env.PERPLEXITY_API_KEY = undefined;

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Ensure config is in test mode
jest.mock('../config/index.js', () => ({
  config: {
    env: 'test',
    perplexityApiKey: undefined,
    logLevel: 'info'
  }
})); 