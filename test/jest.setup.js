import { jest } from '@jest/globals';
// Extend Jest timeout for all tests
jest.setTimeout(10000);
// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PERPLEXITY_API_KEY = undefined;
// Mock config
jest.mock('../config/index', () => ({
    config: {
        env: 'test',
        perplexityApiKey: undefined,
        googleApiKey: 'test-api-key',
        logLevel: 'info'
    }
}));
// Set up global mocks
jest.mock('@developer-tools/shared/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    }
}));
// Add custom matchers if needed
expect.extend({
    // Example custom matcher
    toBeWithinRange(received, floor, ceiling) {
        const pass = received >= floor && received <= ceiling;
        if (pass) {
            return {
                message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
                pass: true,
            };
        }
        else {
            return {
                message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
                pass: false,
            };
        }
    },
});
// Global setup before all tests
beforeAll(() => {
    console.log('Starting test suite...');
});
// Global teardown after all tests
afterAll(() => {
    console.log('Test suite completed.');
});
