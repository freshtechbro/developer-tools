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
export declare class GeminiServiceError extends Error {
    readonly cause?: Error | undefined;
    constructor(message: string, cause?: Error | undefined);
}
export declare class GeminiService {
    private model;
    private rateLimiter;
    private acquireToken;
    analyzeRepository(request: RepositoryAnalysisRequest): Promise<RepositoryAnalysisResponse>;
    private buildAnalysisPrompt;
    private parseAnalysisResponse;
}
