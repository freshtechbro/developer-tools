import { jest, beforeEach, describe, it, expect } from '@jest/globals';
import { GeminiService } from '../gemini.service.js';
import { logger } from '@developer-tools/shared/logger';
import { RateLimiter } from '@developer-tools/shared/rate-limiter';

// Mock the Google Generative AI SDK
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockImplementation(() => ({
        generateContent: jest.fn().mockImplementation(async () => ({
          response: {
            text: () => 'Test response'
          }
        }))
      }))
    }))
  };
});

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

// Import the mocked dependencies - without await
const { GoogleGenerativeAI } = require('@google/generative-ai');

describe('GeminiService', () => {
  let geminiService: GeminiService;
  const mockApiKey = 'test-api-key';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Initialize service with test API key
    geminiService = new GeminiService({
      apiKey: mockApiKey,
      rateLimitConfig: {
        maxTokens: 60,
        refillRate: 0.2
      }
    });
  });
  
  describe('initialize', () => {
    it('should create a GoogleGenerativeAI instance', async () => {
      await geminiService.initialize();
      
      expect(GoogleGenerativeAI).toHaveBeenCalledWith(mockApiKey);
    });
    
    it('should create a RateLimiter instance', async () => {
      await geminiService.initialize();
      
      expect(RateLimiter).toHaveBeenCalledWith('gemini', {
        maxTokens: 60,
        refillRate: 0.2
      });
    });
    
    it('should log an error if initialization fails', async () => {
      (GoogleGenerativeAI as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Google AI initialization error');
      });
      
      await expect(geminiService.initialize()).rejects.toThrow('Failed to initialize GeminiService');
      expect(logger.error).toHaveBeenCalled();
    });
  });
  
  describe('analyzeRepository', () => {
    let mockGenerateContent: jest.Mock;
    
    beforeEach(async () => {
      await geminiService.initialize();
      mockGenerateContent = (GoogleGenerativeAI as jest.Mock).mock.results[0].value.getGenerativeModel().generateContent;
    });
    
    it('should acquire a token before making API request', async () => {
      await geminiService.analyzeRepository({
        query: 'Analyze this code',
        codeContent: 'function test() { return true; }'
      });
      
      // Check that acquireToken was called before the API request
      const rateLimiterInstance = (RateLimiter as jest.Mock).mock.results[0].value;
      expect(rateLimiterInstance.acquireToken).toHaveBeenCalledWith(5);
      expect(mockGenerateContent).toHaveBeenCalledAfter(rateLimiterInstance.acquireToken as jest.Mock);
    });
    
    it('should call Gemini API with correct parameters', async () => {
      await geminiService.analyzeRepository({
        query: 'Analyze this code',
        codeContent: 'function test() { return true; }'
      });
      
      expect(mockGenerateContent).toHaveBeenCalledWith({
        contents: expect.objectContaining({
          parts: expect.arrayContaining([
            expect.objectContaining({
              text: expect.stringContaining('Analyze this code')
            }),
            expect.objectContaining({
              text: expect.stringContaining('function test() { return true; }')
            })
          ])
        }),
        generationConfig: expect.objectContaining({
          temperature: 0.2
        })
      });
    });
    
    it('should return analysis result from the API', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => 'Code analysis: This is a simple function'
        }
      });
      
      const result = await geminiService.analyzeRepository({
        query: 'Analyze this code',
        codeContent: 'function test() { return true; }'
      });
      
      expect(result).toEqual({
        analysis: 'Code analysis: This is a simple function'
      });
    });
    
    it('should handle rate limiting errors', async () => {
      // Mock rate limiter throwing an error
      const rateLimiterInstance = (RateLimiter as jest.Mock).mock.results[0].value;
      (rateLimiterInstance.acquireToken as jest.Mock).mockRejectedValueOnce(
        new Error('Rate limit exceeded')
      );
      
      await expect(geminiService.analyzeRepository({
        query: 'Analyze this code',
        codeContent: 'function test() { return true; }'
      })).rejects.toThrow('Rate limit exceeded for Gemini API: Rate limit exceeded');
      
      expect(logger.warn).toHaveBeenCalled();
      // The API request should not be made if rate limit is exceeded
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });
    
    it('should handle API errors gracefully', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('API error'));
      
      await expect(geminiService.analyzeRepository({
        query: 'Analyze this code',
        codeContent: 'function test() { return true; }'
      })).rejects.toThrow('Gemini API request failed: API error');
      
      expect(logger.error).toHaveBeenCalled();
    });
    
    it('should use different token costs based on code content size', async () => {
      // Short content (5 tokens - base cost)
      await geminiService.analyzeRepository({
        query: 'Analyze',
        codeContent: 'function test() { return true; }'
      });
      
      const rateLimiterInstance = (RateLimiter as jest.Mock).mock.results[0].value;
      expect(rateLimiterInstance.acquireToken).toHaveBeenLastCalledWith(5);
      
      // Medium content (10 tokens)
      const mediumCode = 'function test() {\n' + '  // Some comment\n'.repeat(10) + '  return true;\n}';
      await geminiService.analyzeRepository({
        query: 'Analyze',
        codeContent: mediumCode
      });
      expect(rateLimiterInstance.acquireToken).toHaveBeenLastCalledWith(10);
      
      // Large content (20 tokens)
      const largeCode = 'function test() {\n' + '  // Some comment\n'.repeat(50) + '  return true;\n}';
      await geminiService.analyzeRepository({
        query: 'Analyze',
        codeContent: largeCode
      });
      expect(rateLimiterInstance.acquireToken).toHaveBeenLastCalledWith(20);
    });
  });
  
  describe('generateContent', () => {
    let mockGenerateContent: jest.Mock;
    
    beforeEach(async () => {
      await geminiService.initialize();
      mockGenerateContent = (GoogleGenerativeAI as jest.Mock).mock.results[0].value.getGenerativeModel().generateContent;
    });
    
    it('should acquire a token before making API request', async () => {
      await geminiService.generateContent({
        prompt: 'Generate documentation'
      });
      
      // Check that acquireToken was called before the API request
      const rateLimiterInstance = (RateLimiter as jest.Mock).mock.results[0].value;
      expect(rateLimiterInstance.acquireToken).toHaveBeenCalledWith(3);
      expect(mockGenerateContent).toHaveBeenCalledAfter(rateLimiterInstance.acquireToken as jest.Mock);
    });
    
    it('should call Gemini API with correct parameters', async () => {
      await geminiService.generateContent({
        prompt: 'Generate documentation',
        temperature: 0.8
      });
      
      expect(mockGenerateContent).toHaveBeenCalledWith({
        contents: expect.objectContaining({
          parts: expect.arrayContaining([
            expect.objectContaining({
              text: 'Generate documentation'
            })
          ])
        }),
        generationConfig: expect.objectContaining({
          temperature: 0.8
        })
      });
    });
    
    it('should return generated content from the API', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => '# Documentation\n\nThis is a sample documentation.'
        }
      });
      
      const result = await geminiService.generateContent({
        prompt: 'Generate documentation'
      });
      
      expect(result).toEqual({
        content: '# Documentation\n\nThis is a sample documentation.'
      });
    });
    
    it('should handle rate limiting errors', async () => {
      // Mock rate limiter throwing an error
      const rateLimiterInstance = (RateLimiter as jest.Mock).mock.results[0].value;
      (rateLimiterInstance.acquireToken as jest.Mock).mockRejectedValueOnce(
        new Error('Rate limit exceeded')
      );
      
      await expect(geminiService.generateContent({
        prompt: 'Generate documentation'
      })).rejects.toThrow('Rate limit exceeded for Gemini API: Rate limit exceeded');
      
      expect(logger.warn).toHaveBeenCalled();
      // The API request should not be made if rate limit is exceeded
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });
    
    it('should handle API errors gracefully', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('API error'));
      
      await expect(geminiService.generateContent({
        prompt: 'Generate documentation'
      })).rejects.toThrow('Gemini API request failed: API error');
      
      expect(logger.error).toHaveBeenCalled();
    });
  });
}); 