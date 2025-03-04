import { genAI, geminiConfig } from './config.js';
import { withRetry } from '../utils/retry.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';

export interface RepositoryAnalysisRequest {
  repoPath: string;
  query: string;
  context?: string;
}

export interface RepositoryAnalysisResponse {
  analysis: string;
  suggestions?: string[];
  issues?: string[];
  error?: string;
}

// Response schema for validation
const AnalysisResponseSchema = z.object({
  analysis: z.string(),
  suggestions: z.array(z.string()).optional(),
  issues: z.array(z.string()).optional(),
});

export class GeminiServiceError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'GeminiServiceError';
  }
}

export class GeminiService {
  private model = genAI.getGenerativeModel(geminiConfig);
  private rateLimiter = {
    tokens: 10,
    maxTokens: 10,
    lastRefill: Date.now(),
    refillRate: 1000, // 1 token per second
  };

  private async acquireToken(): Promise<void> {
    const now = Date.now();
    const timePassed = now - this.rateLimiter.lastRefill;
    const tokensToAdd = Math.floor(timePassed / this.rateLimiter.refillRate);

    if (tokensToAdd > 0) {
      this.rateLimiter.tokens = Math.min(
        this.rateLimiter.maxTokens,
        this.rateLimiter.tokens + tokensToAdd
      );
      this.rateLimiter.lastRefill = now;
    }

    if (this.rateLimiter.tokens <= 0) {
      const waitTime = this.rateLimiter.refillRate;
      logger.debug(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.acquireToken();
    }

    this.rateLimiter.tokens--;
  }

  async analyzeRepository(request: RepositoryAnalysisRequest): Promise<RepositoryAnalysisResponse> {
    try {
      await this.acquireToken();

      const operation = async () => {
        const prompt = this.buildAnalysisPrompt(request);
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return {
          analysis: text,
          ...this.parseAnalysisResponse(text),
        };
      };

      return await withRetry(operation, {
        maxAttempts: 3,
        retryableErrors: ['RATE_LIMIT', 'RESOURCE_EXHAUSTED'],
      });
    } catch (error) {
      logger.error('Error analyzing repository:', { error, request });
      
      if (error instanceof GeminiServiceError) {
        throw error;
      }

      return {
        analysis: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private buildAnalysisPrompt(request: RepositoryAnalysisRequest): string {
    const contextInfo = request.context ? `\nAdditional context: ${request.context}` : '';
    
    return `
      Analyze the following repository:
      Path: ${request.repoPath}
      Query: ${request.query}${contextInfo}
      
      Please provide your response in the following format:
      
      Analysis:
      [Detailed analysis of the repository structure and code patterns]
      
      Suggestions:
      1. [First suggestion]
      2. [Second suggestion]
      ...
      
      Issues:
      * [First issue]
      * [Second issue]
      ...
      
      Ensure each section is clearly marked and suggestions/issues are properly formatted with numbers or bullet points.
    `.trim();
  }

  private parseAnalysisResponse(text: string): { suggestions: string[]; issues: string[] } {
    const sections = {
      suggestions: [] as string[],
      issues: [] as string[],
    };

    const lines = text.split('\n');
    let currentSection: keyof typeof sections | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Determine section
      if (trimmedLine.toLowerCase().includes('suggestion')) {
        currentSection = 'suggestions';
        continue;
      } else if (trimmedLine.toLowerCase().includes('issue')) {
        currentSection = 'issues';
        continue;
      }

      // Process line if in a valid section
      if (currentSection && trimmedLine) {
        const match = trimmedLine.match(/^(?:\d+\.|[-•*])\s*(.+)$/);
        if (match) {
          sections[currentSection].push(match[1].trim());
        }
      }

      // Exit section on empty line
      if (currentSection && !trimmedLine) {
        currentSection = null;
      }
    }

    return sections;
  }
} 