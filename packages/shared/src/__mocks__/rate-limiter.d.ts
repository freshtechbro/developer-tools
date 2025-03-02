export interface RateLimiterOptions {
    maxTokens?: number;
    refillRate?: number;
    initialTokens?: number;
    waitForTokens?: boolean;
    maxWaitTime?: number;
}
export declare class RateLimiter {
    private maxTokens;
    private tokens;
    private refillRate;
    private lastRefillTime;
    private waitForTokens;
    private maxWaitTime;
    private name;
    private requestCount;
    constructor(nameOrOptions: string | Record<string, any>, options?: Record<string, any>);
    acquireToken(cost?: number): Promise<void>;
    tryAcquire(cost?: number): boolean;
    getAvailableTokens(): number;
    private refillTokens;
}
export { RateLimiter };
export declare function createRateLimiter(options: Record<string, any>): RateLimiter;
