import dotenv from 'dotenv';
import path from 'path';
import { logger } from '../logger.js';

// Load environment variables from .env file
dotenv.config();

/**
 * Application configuration
 */
export const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',
  isTest: process.env.NODE_ENV === 'test',
  
  // API Keys
  perplexityApiKey: process.env.PERPLEXITY_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  
  // Server configuration
  server: {
    httpPort: parseInt(process.env.HTTP_PORT || '3001', 10),
    ssePort: parseInt(process.env.SSE_PORT || '3002', 10),
    webPort: parseInt(process.env.WEB_PORT || '3003', 10),
  },
  
  // File storage
  storage: {
    basePath: process.env.STORAGE_PATH || path.join(process.cwd(), 'storage'),
    researchDir: process.env.RESEARCH_DIR || 'local-research',
  },
  
  // Rate limiting
  rateLimits: {
    perplexity: {
      maxTokens: parseInt(process.env.PERPLEXITY_RATE_LIMIT_MAX_TOKENS || '20', 10),
      refillRate: parseFloat(process.env.PERPLEXITY_RATE_LIMIT_REFILL_RATE || '0.33'),
    },
    gemini: {
      maxTokens: parseInt(process.env.GEMINI_RATE_LIMIT_MAX_TOKENS || '60', 10),
      refillRate: parseFloat(process.env.GEMINI_RATE_LIMIT_REFILL_RATE || '1'),
    },
  },
};

// Log configuration on startup (but not in test environment)
if (!config.isTest) {
  logger.debug('Application configuration loaded', {
    environment: config.env,
    serverPorts: config.server,
    storagePaths: config.storage,
  });
} 