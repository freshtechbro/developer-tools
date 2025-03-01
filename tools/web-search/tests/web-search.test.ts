import { jest, beforeEach, describe, it, expect, afterEach } from '@jest/globals';
import { webSearchTool } from '../web-search.js';
import { config } from '@developer-tools/shared/config';
import axios from 'axios';
import { perplexityService } from '@developer-tools/server/services/perplexity.service';
import { fileStorageService } from '@developer-tools/server/services/file-storage.service';

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

// Mock the perplexity service
jest.mock('@developer-tools/server/services/perplexity.service', () => ({
  perplexityService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    search: jest.fn()
  }
}));

// Mock the file storage service
jest.mock('@developer-tools/server/services/file-storage.service', () => ({
  fileStorageService: {
    saveToFile: jest.fn()
  }
}));

describe('Web Search Tool', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.resetAllMocks();
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

    it('should execute a basic search query', async () => {
        // Mock the perplexity service response
        (perplexityService.search as jest.Mock).mockResolvedValue({
            content: 'Test search results',
            metadata: {
                model: 'test-model'
            }
        });

        // Execute the tool
        const result = await webSearchTool.execute({
            query: 'test query'
        });

        // Verify the result
        expect(result).toEqual({
            searchResults: 'Test search results',
            metadata: {
                model: 'test-model'
            }
        });

        // Verify the service was called correctly
        expect(perplexityService.initialize).toHaveBeenCalled();
        expect(perplexityService.search).toHaveBeenCalledWith('test query', { maxTokens: 150 });
        expect(fileStorageService.saveToFile).not.toHaveBeenCalled();
    });

    it('should save search results to a file when requested', async () => {
        // Mock the perplexity service response
        (perplexityService.search as jest.Mock).mockResolvedValue({
            content: 'Test search results',
            metadata: {
                model: 'test-model'
            }
        });

        // Mock the file storage service
        (fileStorageService.saveToFile as jest.Mock).mockResolvedValue('local-research/web-search-test-query-12345.md');

        // Execute the tool
        const result = await webSearchTool.execute({
            query: 'test query',
            saveToFile: true
        });

        // Verify the result
        expect(result).toEqual({
            searchResults: 'Test search results',
            savedToFile: 'local-research/web-search-test-query-12345.md',
            metadata: {
                model: 'test-model'
            }
        });

        // Verify the services were called correctly
        expect(perplexityService.search).toHaveBeenCalledWith('test query', { maxTokens: 150 });
        expect(fileStorageService.saveToFile).toHaveBeenCalled();
    });

    it('should format results as JSON when requested', async () => {
        // Mock the perplexity service response with sources
        (perplexityService.search as jest.Mock).mockResolvedValue({
            content: 'Test search results',
            metadata: {
                model: 'test-model',
                sources: [
                    {
                        title: 'Test Source',
                        url: 'https://example.com',
                        snippet: 'Test snippet'
                    }
                ]
            }
        });

        // Execute the tool
        const result = await webSearchTool.execute({
            query: 'test query',
            outputFormat: 'json'
        });

        // Verify the result contains JSON formatted content
        expect(result).toHaveProperty('searchResults');
        
        // Parse the JSON string to verify its structure
        const parsedJson = JSON.parse((result as any).searchResults);
        expect(parsedJson).toHaveProperty('answer', 'Test search results');
        expect(parsedJson).toHaveProperty('sources');
        expect(parsedJson.sources).toHaveLength(1);
        expect(parsedJson.sources[0]).toHaveProperty('title', 'Test Source');
    });

    it('should handle validation errors', async () => {
        // Try to execute with an invalid request
        await expect(webSearchTool.execute({
            query: ''  // Empty query should fail validation
        })).rejects.toThrow('Validation error');
    });

    it('should handle service errors', async () => {
        // Mock the perplexity service to throw an error
        (perplexityService.search as jest.Mock).mockRejectedValue(new Error('Service error'));

        // Execute the tool and expect it to throw
        await expect(webSearchTool.execute({
            query: 'test query'
        })).rejects.toThrow('Service error');
    });

    it('should continue execution if file saving fails', async () => {
        // Mock the perplexity service response
        (perplexityService.search as jest.Mock).mockResolvedValue({
            content: 'Test search results',
            metadata: {
                model: 'test-model'
            }
        });

        // Mock the file storage service to throw an error
        (fileStorageService.saveToFile as jest.Mock).mockRejectedValue(new Error('File system error'));

        // Execute the tool
        const result = await webSearchTool.execute({
            query: 'test query',
            saveToFile: true
        });

        // Verify the result (should still return search results even if saving failed)
        expect(result).toEqual({
            searchResults: 'Test search results',
            metadata: {
                model: 'test-model'
            }
        });

        // Verify the services were called
        expect(perplexityService.search).toHaveBeenCalled();
        expect(fileStorageService.saveToFile).toHaveBeenCalled();
    });
}); 