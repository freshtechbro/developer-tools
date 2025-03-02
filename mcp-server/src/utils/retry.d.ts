export interface RetryOptions {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffFactor: number;
    retryableErrors?: Array<string | RegExp>;
}
export declare const defaultRetryOptions: RetryOptions;
export declare class RetryError extends Error {
    readonly attempts: number;
    readonly lastError: Error;
    constructor(message: string, attempts: number, lastError: Error);
}
export declare function withRetry<T>(operation: () => Promise<T>, options?: Partial<RetryOptions>): Promise<T>;
