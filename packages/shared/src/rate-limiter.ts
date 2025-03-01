import { logger } from './logger.js';

export interface RateLimiterOptions {
  /**
   * Maximum number of tokens in the bucket
   * @default 100
   */
  maxTokens?: number;
  
  /**
   * Token refill rate per second
   * @default 10
   */
  refillRate?: number;
  
  /**
   * Initial number of tokens in the bucket (defaults to maxTokens)
   */
  initialTokens?: number;
  
  /**
   * Whether to wait for tokens to become available (true) or throw an error (false)
   * @default true
   */
  waitForTokens?: boolean;
  
  /**
   * Maximum time to wait for tokens in milliseconds
   * @default 30000 (30 seconds)
   */
  maxWaitTime?: number;
}

/**
 * Rate limiter using the token bucket algorithm
 * Used to limit the rate of requests to external APIs
 */
export class RateLimiter {
  private tokens: number;
  private readonly maxTokens: number;
  private lastRefill: number;
  private readonly refillRate: number; // tokens per second
  private readonly waitForTokens: boolean;
  private readonly maxWaitTime: number;
  private readonly name: string;
  
  /**
   * Creates a new rate limiter
   * @param name Name of the rate limiter for logging purposes
   * @param options Configuration options
   */
  constructor(name: string, options: RateLimiterOptions = {}) {
    this.maxTokens = options.maxTokens ?? 100;
    this.tokens = options.initialTokens ?? this.maxTokens;
    this.lastRefill = Date.now();
    this.refillRate = options.refillRate ?? 10;
    this.waitForTokens = options.waitForTokens ?? true;
    this.maxWaitTime = options.maxWaitTime ?? 30000;
    this.name = name;
    
    logger.debug(`Rate limiter created`, {
      name,
      maxTokens: this.maxTokens,
      refillRate: this.refillRate,
      initialTokens: this.tokens
    });
  }
  
  /**
   * Refills tokens based on time passed since last refill
   * @private
   */
  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor((timePassed / 1000) * this.refillRate);
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
      
      logger.debug(`Tokens refilled`, {
        name: this.name,
        added: tokensToAdd,
        current: this.tokens,
        max: this.maxTokens
      });
    }
  }
  
  /**
   * Acquires a token, waiting if necessary
   * @param cost Number of tokens to consume (default: 1)
   * @throws Error if no tokens are available and waitForTokens is false,
   *         or if the wait time exceeds maxWaitTime
   */
  async acquireToken(cost: number = 1): Promise<void> {
    const startTime = Date.now();
    
    // Refill tokens first
    this.refillTokens();
    
    // Check if enough tokens are available
    if (this.tokens >= cost) {
      this.tokens -= cost;
      logger.debug(`Token acquired`, {
        name: this.name,
        cost,
        remaining: this.tokens
      });
      return;
    }
    
    // If we shouldn't wait, throw an error
    if (!this.waitForTokens) {
      const error = new Error(`Rate limit exceeded for ${this.name}`);
      logger.warn(`Rate limit exceeded`, {
        name: this.name,
        available: this.tokens,
        requested: cost
      });
      throw error;
    }
    
    // Otherwise, wait for tokens to become available
    while (this.tokens < cost) {
      // Check if we've exceeded the maximum wait time
      if (Date.now() - startTime > this.maxWaitTime) {
        const error = new Error(`Timed out waiting for rate limit tokens for ${this.name}`);
        logger.warn(`Rate limit wait timeout`, {
          name: this.name,
          waitedMs: Date.now() - startTime,
          maxWaitTime: this.maxWaitTime
        });
        throw error;
      }
      
      // Calculate time until next token is available
      const tokensNeeded = cost - this.tokens;
      const timeToWait = Math.ceil((tokensNeeded / this.refillRate) * 1000);
      
      logger.debug(`Waiting for tokens`, {
        name: this.name,
        tokensNeeded,
        timeToWait,
        waitedSoFar: Date.now() - startTime
      });
      
      // Wait for the calculated time
      await new Promise<void>(resolve => setTimeout(resolve, Math.min(timeToWait, 1000)));
      
      // Refill tokens after waiting
      this.refillTokens();
    }
    
    // Consume tokens
    this.tokens -= cost;
    
    logger.debug(`Token acquired after waiting`, {
      name: this.name,
      cost,
      remaining: this.tokens,
      waitedMs: Date.now() - startTime
    });
  }
  
  /**
   * Gets the current number of available tokens
   */
  getAvailableTokens(): number {
    this.refillTokens();
    return this.tokens;
  }
}

// Export a factory function to create rate limiters
export function createRateLimiter(name: string, options?: RateLimiterOptions): RateLimiter {
  return new RateLimiter(name, options);
} 