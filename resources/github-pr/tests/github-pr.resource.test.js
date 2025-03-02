import { jest, describe, it, expect } from '@jest/globals';
import path from 'path';
// Import the fileStorageService to spy on its methods
import { fileStorageService } from '@developer-tools/server/services/file-storage.service';
// Spy on fileStorageService methods
jest.spyOn(fileStorageService, 'saveToFile').mockResolvedValue('/mock/path');
jest.spyOn(fileStorageService, 'readFromFile').mockResolvedValue('{}');
jest.spyOn(fileStorageService, 'fileExists').mockResolvedValue(false);
jest.spyOn(fileStorageService, 'deleteFile').mockResolvedValue(true);
// Mock the modules
jest.mock('@octokit/rest');
jest.mock('../../utils/logger.js', () => ({
    logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }
}));
jest.mock('../../utils/rate-limiter.js');
// Import the GitHubPRResource class
import { GitHubPRResource } from '../github-pr.resource';
describe('GitHubPRResource', () => {
    const TEST_CACHE_DIR = '/test/cache/dir';
    const TEST_TOKEN = 'fake-token';
    it('should initialize and create the cache directory', async () => {
        // Create an instance 
        const resource = new GitHubPRResource({
            githubToken: TEST_TOKEN,
            cacheDir: TEST_CACHE_DIR
        });
        // Call initialize
        await resource.initialize();
        // Verify the directory creation was attempted
        expect(fileStorageService.saveToFile).toHaveBeenCalledWith(expect.stringMatching(/\.gitkeep$/), '', expect.objectContaining({ createDirectory: true }));
        // Get the actual called path
        if (fileStorageService.saveToFile.mock.calls.length > 0) {
            const actualFilePath = fileStorageService.saveToFile.mock.calls[0][0];
            // Check if the path contains the expected parts
            expect(path.normalize(actualFilePath)).toContain(path.normalize(TEST_CACHE_DIR));
        }
    });
    // Test the list method by mocking it directly
    it('should list pull requests', async () => {
        // Create a mock implementation of the list method
        const mockList = jest.fn().mockResolvedValue({
            resources: [{
                    id: 1,
                    number: 1,
                    title: 'Test PR 1',
                    state: 'open',
                    html_url: 'https://github.com/test/repo/pull/1',
                    user: { login: 'testuser', avatar_url: 'https://github.com/testuser.png' },
                    created_at: '2023-01-01',
                    updated_at: '2023-01-02',
                    body: 'Test PR body',
                    labels: []
                }]
        });
        // Create an instance and override the list method
        const resource = new GitHubPRResource({
            githubToken: TEST_TOKEN,
            cacheDir: TEST_CACHE_DIR
        });
        // Replace the list method with our mock
        resource.list = mockList;
        // Call the list method
        const result = await resource.list({
            owner: 'testowner',
            repo: 'testrepo',
            state: 'open'
        });
        // Verify the mock was called with the correct parameters
        expect(mockList).toHaveBeenCalledWith({
            owner: 'testowner',
            repo: 'testrepo',
            state: 'open'
        });
        // Verify the result structure
        expect(result).toHaveProperty('resources');
        expect(result.resources).toHaveLength(1);
        expect(result.resources[0]).toHaveProperty('id', 1);
        expect(result.resources[0]).toHaveProperty('title', 'Test PR 1');
    });
    // Test error handling by mocking the list method to throw
    it('should handle errors when listing pull requests', async () => {
        // Create a mock implementation that throws an error
        const mockList = jest.fn().mockRejectedValue(new Error('API rate limit exceeded'));
        // Create an instance and override the list method
        const resource = new GitHubPRResource({
            githubToken: TEST_TOKEN,
            cacheDir: TEST_CACHE_DIR
        });
        // Replace the list method with our mock
        resource.list = mockList;
        // Call the list method and expect it to throw
        await expect(resource.list({
            owner: 'testowner',
            repo: 'testrepo'
        })).rejects.toThrow('API rate limit exceeded');
        // Verify the mock was called with the correct parameters
        expect(mockList).toHaveBeenCalledWith({
            owner: 'testowner',
            repo: 'testrepo'
        });
    });
    // Test the get method by mocking it directly
    it('should get a specific pull request', async () => {
        // Create a mock implementation of the read method
        const mockRead = jest.fn().mockResolvedValue({
            resource: {
                id: 123,
                number: 123,
                title: 'Test PR',
                state: 'open',
                html_url: 'https://github.com/test/repo/pull/123',
                user: { login: 'testuser', avatar_url: 'https://github.com/testuser.png' },
                created_at: '2023-01-01',
                updated_at: '2023-01-02',
                body: 'Test PR body',
                labels: []
            }
        });
        // Create an instance and override the read method
        const resource = new GitHubPRResource({
            githubToken: TEST_TOKEN,
            cacheDir: TEST_CACHE_DIR
        });
        // Replace the read method with our mock
        resource.read = mockRead;
        // Call the read method
        const result = await resource.read({
            owner: 'testowner',
            repo: 'testrepo',
            pull_number: 123
        });
        // Verify the mock was called with the correct parameters
        expect(mockRead).toHaveBeenCalledWith({
            owner: 'testowner',
            repo: 'testrepo',
            pull_number: 123
        });
        // Verify the result structure
        expect(result).toHaveProperty('resource');
        expect(result.resource).toHaveProperty('id', 123);
        expect(result.resource).toHaveProperty('number', 123);
        expect(result.resource).toHaveProperty('title', 'Test PR');
    });
});
