import { jest, beforeEach, describe, it, expect } from '@jest/globals';
import { PerplexityService } from '../perplexity.service.js';
import { logger } from '@developer-tools/shared/logger';
import { RateLimiter } from '@developer-tools/shared/rate-limiter';
// Mock the fetch API
global.fetch = jest.fn();
// Mock RateLimiter
jest.mock('@developer-tools/shared/rate-limiter', () => ({
    RateLimiter: jest.fn().mockImplementation(() => ({
        acquireToken: jest.fn().mockResolvedValue(undefined)
    }))
}));
// Mock logger
jest.mock('@developer-tools/shared/logger', () => ({
    logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }
}));
describe('PerplexityService', () => {
    let perplexityService;
    const mockApiKey = 'test-api-key';
    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch.mockClear();
        // Initialize service with test API key
        perplexityService = new PerplexityService({
            apiKey: mockApiKey,
            rateLimitConfig: {
                maxTokens: 10,
                refillRate: 1
            }
        });
    });
    describe('initialize', () => {
        it('should create a RateLimiter instance', async () => {
            await perplexityService.initialize();
            expect(RateLimiter).toHaveBeenCalledWith('perplexity', {
                maxTokens: 10,
                refillRate: 1
            });
        });
        it('should log an error if initialization fails', async () => {
            RateLimiter.mockImplementationOnce(() => {
                throw new Error('Rate limiter error');
            });
            await expect(perplexityService.initialize()).rejects.toThrow('Failed to initialize PerplexityService');
            expect(logger.error).toHaveBeenCalled();
        });
    });
    describe('search', () => {
        beforeEach(async () => {
            await perplexityService.initialize();
        });
        it('should acquire a token before making API request', async () => {
            // Mock fetch response
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue({
                    answer: 'Test answer',
                    search_results: [
                        { title: 'Result 1', url: 'https://example.com/1' }
                    ]
                })
            });
            await perplexityService.search('test query');
            // Check that acquireToken was called before the API request
            const rateLimiterInstance = RateLimiter.mock.results[0].value;
            expect(rateLimiterInstance.acquireToken).toHaveBeenCalledWith(1);
            expect(global.fetch).toHaveBeenCalledAfter(rateLimiterInstance.acquireToken);
        });
        it('should make API request with correct parameters', async () => {
            // Mock fetch response
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue({
                    answer: 'Test answer',
                    search_results: [
                        { title: 'Result 1', url: 'https://example.com/1' }
                    ]
                })
            });
            await perplexityService.search('test query');
            expect(global.fetch).toHaveBeenCalledWith('https://api.perplexity.ai/search', expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${mockApiKey}`
                },
                body: JSON.stringify({
                    query: 'test query'
                })
            }));
        });
        it('should return formatted search results', async () => {
            // Mock fetch response
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue({
                    answer: 'Test answer',
                    search_results: [
                        {
                            title: 'Result 1',
                            url: 'https://example.com/1',
                            snippet: 'This is a snippet'
                        }
                    ]
                })
            });
            const result = await perplexityService.search('test query');
            expect(result).toEqual({
                answer: 'Test answer',
                results: [
                    {
                        title: 'Result 1',
                        url: 'https://example.com/1',
                        snippet: 'This is a snippet'
                    }
                ]
            });
        });
        it('should handle API errors gracefully', async () => {
            // Mock fetch error response
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 429,
                statusText: 'Too Many Requests'
            });
            await expect(perplexityService.search('test query')).rejects.toThrow('Perplexity API request failed: 429 Too Many Requests');
            expect(logger.error).toHaveBeenCalled();
        });
        it('should handle network errors gracefully', async () => {
            // Mock fetch network error
            global.fetch.mockRejectedValueOnce(new Error('Network error'));
            await expect(perplexityService.search('test query')).rejects.toThrow('Failed to make request to Perplexity API: Network error');
            expect(logger.error).toHaveBeenCalled();
        });
        it('should handle rate limiting errors', async () => {
            // Mock rate limiter throwing an error
            const rateLimiterInstance = RateLimiter.mock.results[0].value;
            rateLimiterInstance.acquireToken.mockRejectedValueOnce(new Error('Rate limit exceeded'));
            await expect(perplexityService.search('test query')).rejects.toThrow('Rate limit exceeded for Perplexity API: Rate limit exceeded');
            expect(logger.warn).toHaveBeenCalled();
            // The API request should not be made if rate limit is exceeded
            expect(global.fetch).not.toHaveBeenCalled();
        });
        it('should use different token costs based on query complexity', async () => {
            // Mock fetch response
            global.fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({
                    answer: 'Test answer',
                    search_results: []
                })
            });
            const rateLimiterInstance = RateLimiter.mock.results[0].value;
            // Short query (1 token)
            await perplexityService.search('short query');
            expect(rateLimiterInstance.acquireToken).toHaveBeenLastCalledWith(1);
            // Medium query (2 tokens)
            await perplexityService.search('this is a medium length query with multiple words');
            expect(rateLimiterInstance.acquireToken).toHaveBeenLastCalledWith(2);
            // Long query (3 tokens)
            const longQuery = 'this is a very long query ' + 'with lots of words '.repeat(20);
            await perplexityService.search(longQuery);
            expect(rateLimiterInstance.acquireToken).toHaveBeenLastCalledWith(3);
        });
    });
});
