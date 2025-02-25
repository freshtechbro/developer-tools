import { jest } from '@jest/globals';
import { GeminiService, RepositoryAnalysisRequest } from '../service.js';
import { genAI, geminiConfig } from '../config.js';
import { logger } from '../../utils/logger.js';

// Mock the logger
jest.mock('../../utils/logger.js', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Create mock function
const mockGenerateContent = jest.fn();

// Mock the Gemini API
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}));

jest.mock('../config.js', () => ({
  genAI: {
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  },
  geminiConfig: {
    model: 'gemini-pro',
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
  },
}));

describe('GeminiService', () => {
  let service: GeminiService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GeminiService();
  });

  describe('analyzeRepository', () => {
    const mockRequest: RepositoryAnalysisRequest = {
      repoPath: '/test/repo',
      query: 'Analyze code quality',
    };

    it('should successfully analyze repository with all sections', async () => {
      const mockAnalysis = `
        Analysis:
        The repository has a good structure and follows best practices.

        Suggestions:
        1. Add more tests
        2. Improve documentation
        
        Issues:
        * Some code duplication found
        * Missing error handling in critical sections
      `;

      mockGenerateContent.mockImplementation(() =>
        Promise.resolve({
          response: {
            text: () => mockAnalysis,
          },
        })
      );

      const result = await service.analyzeRepository(mockRequest);

      expect(result.analysis).toBe(mockAnalysis);
      expect(result.suggestions).toEqual([
        'Add more tests',
        'Improve documentation',
      ]);
      expect(result.issues).toEqual([
        'Some code duplication found',
        'Missing error handling in critical sections',
      ]);
      expect(result.error).toBeUndefined();
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.any(String));
    });

    it('should handle rate limiting and retry', async () => {
      const rateLimitError = new Error('RATE_LIMIT');
      const successResponse = {
        response: {
          text: () => 'Success after retry',
        },
      };

      mockGenerateContent
        .mockImplementationOnce(() => Promise.reject(rateLimitError))
        .mockImplementationOnce(() => Promise.resolve(successResponse));

      const result = await service.analyzeRepository(mockRequest);

      expect(result.analysis).toBe('Success after retry');
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Attempt 1 failed'),
        expect.any(Object)
      );
    });

    it('should handle errors gracefully', async () => {
      const mockError = new Error('API error');
      mockGenerateContent.mockImplementation(() => Promise.reject(mockError));

      const result = await service.analyzeRepository(mockRequest);

      expect(result.analysis).toBe('');
      expect(result.error).toBe('API error');
      expect(result.suggestions).toBeUndefined();
      expect(logger.error).toHaveBeenCalledWith(
        'Error analyzing repository:',
        expect.objectContaining({
          error: mockError,
          request: mockRequest,
        })
      );
    });

    it('should handle malformed response gracefully', async () => {
      const malformedResponse = `
        Invalid format
        No clear sections
        Random text
      `;

      mockGenerateContent.mockImplementation(() =>
        Promise.resolve({
          response: {
            text: () => malformedResponse,
          },
        })
      );

      const result = await service.analyzeRepository(mockRequest);

      expect(result.analysis).toBe(malformedResponse);
      expect(result.suggestions).toEqual([]);
      expect(result.issues).toEqual([]);
    });

    it('should include context in analysis when provided', async () => {
      const requestWithContext: RepositoryAnalysisRequest = {
        ...mockRequest,
        context: 'TypeScript project with React',
      };

      mockGenerateContent.mockImplementation((prompt: any) => {
        expect(prompt).toContain('TypeScript project with React');
        return Promise.resolve({
          response: {
            text: () => 'Analysis with context',
          },
        });
      });

      await service.analyzeRepository(requestWithContext);

      expect(mockGenerateContent).toHaveBeenCalledWith(expect.any(String));
      const prompt = mockGenerateContent.mock.calls[0][0] as string;
      expect(prompt).toContain('Additional context: TypeScript project with React');
    });

    it('should respect rate limiting', async () => {
      jest.useFakeTimers();

      const requests = Array(5).fill(mockRequest);
      mockGenerateContent.mockImplementation(() =>
        Promise.resolve({
          response: {
            text: () => 'Test response',
          },
        })
      );

      // Start all requests concurrently
      const promises = requests.map(req => service.analyzeRepository(req));

      // Fast-forward time by 100ms after each request
      for (let i = 0; i < requests.length; i++) {
        jest.advanceTimersByTime(100);
        await Promise.resolve(); // Let the promises resolve
      }

      await Promise.all(promises);

      expect(mockGenerateContent).toHaveBeenCalledTimes(5);
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Rate limit reached'),
        expect.any(Object)
      );

      jest.useRealTimers();
    });
  });
}); 