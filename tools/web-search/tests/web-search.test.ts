import { jest, beforeEach, describe, it, expect } from '@jest/globals';
import { webSearchTool } from '../web-search.js';
import { config } from '@developer-tools/shared/config';
import axios from 'axios';

// Mock axios
jest.mock('axios', () => ({
    post: jest.fn(),
    isAxiosError: jest.fn()
}));

// Mock config
jest.mock('../../../config/index', () => ({
    config: {
        env: 'test',
        perplexityApiKey: undefined,
        logLevel: 'info'
    }
}));

// Mock logger
jest.mock('../../../utils/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    }
}));

describe('Web Search Tool', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('when PERPLEXITY_API_KEY is not provided', () => {
        it('should return mock results in test environment', async () => {
            const request = { query: 'test query' };
            const result = await webSearchTool.execute(request);
            expect(result).toEqual({ searchResults: 'Mock search results for testing' });
            expect(axios.post).not.toHaveBeenCalled();
        });
    });

    describe('when PERPLEXITY_API_KEY is provided', () => {
        beforeEach(() => {
            (config as any).perplexityApiKey = 'test-api-key';
        });

        it('should make API call and return results', async () => {
            const mockResponse = {
                data: {
                    choices: [{ message: { content: 'API search results' } }]
                }
            };
            (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);

            const request = { query: 'test query' };
            const result = await webSearchTool.execute(request);

            expect(result).toEqual({ searchResults: 'API search results' });
            expect(axios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    messages: [{ role: 'user', content: 'test query' }]
                }),
                expect.objectContaining({
                    headers: { 'Authorization': 'Bearer test-api-key' }
                })
            );
        });

        it('should handle API errors gracefully', async () => {
            const mockError = { response: { data: { error: 'API Error' } } };
            (axios.post as jest.Mock).mockRejectedValueOnce(mockError);
            (axios.isAxiosError as jest.Mock).mockReturnValue(true);

            const request = { query: 'test query' };
            await expect(webSearchTool.execute(request)).rejects.toThrow('Web search failed: API Error');
        });

        it('should validate request schema', async () => {
            const invalidRequest = { query: '' };
            await expect(webSearchTool.execute(invalidRequest)).rejects.toThrow('Search query is required');
        });

        it('should handle saving results to file when requested', async () => {
            const mockResponse = {
                data: {
                    choices: [{ message: { content: 'API search results' } }]
                }
            };
            (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);

            const request = { query: 'test query', saveToFile: true };
            const result = await webSearchTool.execute(request);

            expect(result).toMatchObject({
                searchResults: 'API search results',
                savedToFile: expect.stringContaining('web-search-')
            });
        });
    });
}); 