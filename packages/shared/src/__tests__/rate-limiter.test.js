import { jest, beforeEach, describe, it, expect } from '@jest/globals';
// Mock the rate-limiter module
jest.mock('../rate-limiter');
import { RateLimiter } from '../rate-limiter';
// Mock Date.now
const mockDateNow = jest.spyOn(Date, 'now');
// Mock setTimeout
jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
    callback();
    return null;
});
// Mock logger
jest.mock('../logger', () => ({
    logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }
}));
describe('RateLimiter', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockDateNow.mockImplementation(() => 1000); // Fixed timestamp for testing
    });
    describe('constructor', () => {
        it('should initialize with default values', () => {
            const limiter = new RateLimiter('test');
            expect(limiter.getAvailableTokens()).toBe(100);
        });
        it('should initialize with custom values', () => {
            const limiter = new RateLimiter('test', {
                maxTokens: 50,
                initialTokens: 25,
                refillRate: 5
            });
            expect(limiter.getAvailableTokens()).toBe(25);
        });
    });
    describe('acquireToken', () => {
        it('should consume a token if available', async () => {
            const limiter = new RateLimiter('test', { maxTokens: 10, initialTokens: 10 });
            await limiter.acquireToken();
            expect(limiter.getAvailableTokens()).toBe(9);
        });
        it('should consume multiple tokens if cost is provided', async () => {
            const limiter = new RateLimiter('test', { maxTokens: 10, initialTokens: 10 });
            await limiter.acquireToken(3);
            expect(limiter.getAvailableTokens()).toBe(7);
        });
        it('should throw error if not enough tokens and waitForTokens is false', async () => {
            const limiter = new RateLimiter('test', {
                maxTokens: 10,
                initialTokens: 2,
                waitForTokens: false
            });
            await limiter.acquireToken(1); // First token
            await limiter.acquireToken(1); // Second token
            await expect(limiter.acquireToken(1)).rejects.toThrow('Rate limit exceeded for test');
        });
        it('should refill tokens based on time passed', async () => {
            const limiter = new RateLimiter('test', {
                maxTokens: 10,
                initialTokens: 1,
                refillRate: 1 // 1 token per second
            });
            // Use the one available token
            await limiter.acquireToken();
            expect(limiter.getAvailableTokens()).toBe(0);
            // Advance time by 5 seconds
            mockDateNow.mockImplementation(() => 6000); // 1000 + 5000
            // Should have 5 tokens now
            expect(limiter.getAvailableTokens()).toBe(5);
            // Use 3 tokens
            await limiter.acquireToken(3);
            expect(limiter.getAvailableTokens()).toBe(2);
        });
        it('should wait for tokens to become available if needed', async () => {
            const limiter = new RateLimiter('test', {
                maxTokens: 10,
                initialTokens: 1,
                refillRate: 1 // 1 token per second
            });
            // Use the one available token
            await limiter.acquireToken();
            // Mock time advancement when setTimeout is called
            let timeAdvanced = false;
            jest.spyOn(global, 'setTimeout').mockImplementationOnce((callback) => {
                timeAdvanced = true;
                mockDateNow.mockImplementation(() => 3000); // Advance 2 seconds
                callback();
                return null;
            });
            // Try to acquire 2 tokens, should wait
            const acquirePromise = limiter.acquireToken(2);
            await acquirePromise;
            expect(timeAdvanced).toBe(true);
            expect(limiter.getAvailableTokens()).toBe(0); // Should have used the 2 tokens that were added
        });
        it('should throw error if waiting exceeds maxWaitTime', async () => {
            const limiter = new RateLimiter('test', {
                maxTokens: 10,
                initialTokens: 0,
                refillRate: 0.1, // Very slow refill
                maxWaitTime: 1000 // Short wait time
            });
            // Mock time advancement to exceed maxWaitTime
            jest.spyOn(global, 'setTimeout').mockImplementationOnce((callback) => {
                mockDateNow.mockImplementation(() => 3000); // Advance 2 seconds, which exceeds maxWaitTime
                callback();
                return null;
            });
            await expect(limiter.acquireToken()).rejects.toThrow('Timed out waiting for rate limit tokens');
        });
    });
    describe('getAvailableTokens', () => {
        it('should return current token count after refill', () => {
            const limiter = new RateLimiter('test', {
                maxTokens: 10,
                initialTokens: 5,
                refillRate: 1
            });
            // Advance time by 3 seconds
            mockDateNow.mockImplementation(() => 4000);
            // Should have 8 tokens now (5 initial + 3 from refill)
            expect(limiter.getAvailableTokens()).toBe(8);
        });
        it('should not exceed maxTokens on refill', () => {
            const limiter = new RateLimiter('test', {
                maxTokens: 10,
                initialTokens: 5,
                refillRate: 1
            });
            // Advance time by 20 seconds
            mockDateNow.mockImplementation(() => 21000);
            // Should have maxTokens (10) now
            expect(limiter.getAvailableTokens()).toBe(10);
        });
    });
    it('should allow requests when under the limit', () => {
        const limiter = new RateLimiter({ maxTokens: 5, refillRate: 1 });
        // Should allow 5 requests
        expect(limiter.tryAcquire()).toBe(true);
        expect(limiter.tryAcquire()).toBe(true);
        expect(limiter.tryAcquire()).toBe(true);
        expect(limiter.tryAcquire()).toBe(true);
        expect(limiter.tryAcquire()).toBe(true);
        // Should deny the 6th request
        expect(limiter.tryAcquire()).toBe(false);
    });
    it('should refill tokens over time', () => {
        const limiter = new RateLimiter({ maxTokens: 2, refillRate: 1 });
        // Use up all tokens
        expect(limiter.tryAcquire()).toBe(true);
        expect(limiter.tryAcquire()).toBe(true);
        expect(limiter.tryAcquire()).toBe(false);
        // Advance time by 1 second (should add 1 token)
        mockDateNow.mockImplementation(() => 2000);
        // Should allow one more request
        expect(limiter.tryAcquire()).toBe(true);
        expect(limiter.tryAcquire()).toBe(false);
    });
    it('should not exceed max tokens when refilling', () => {
        const limiter = new RateLimiter({ maxTokens: 2, refillRate: 10 });
        // Use one token
        expect(limiter.tryAcquire()).toBe(true);
        // Advance time by 1 second (should add 10 tokens, but max is 2)
        mockDateNow.mockImplementation(() => 2000);
        // Should allow only 2 more requests despite refilling 10 tokens
        expect(limiter.tryAcquire()).toBe(true);
        expect(limiter.tryAcquire()).toBe(false);
    });
});
