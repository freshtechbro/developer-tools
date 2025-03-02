/**
 * Base API response interface
 */
export interface ApiResponse {
    success: boolean;
    error?: string;
    [key: string]: any;
}
/**
 * Web search response interface
 */
export interface WebSearchResponse extends ApiResponse {
    results: string;
    metadata?: {
        provider?: string;
        cached?: boolean;
        timestamp?: string;
        requestId?: string;
        tokenUsage?: {
            promptTokens?: number;
            completionTokens?: number;
            totalTokens?: number;
        };
    };
}
/**
 * Command interceptor response interface
 */
export interface CommandResponse extends ApiResponse {
    message?: string;
    command?: string;
    output?: string;
    exitCode?: number;
    executionTime?: number;
}
/**
 * Repository analysis response interface
 */
export interface RepoAnalysisResponse extends ApiResponse {
    repoPath: string;
    analysisType: string;
    summary: string;
    details: string;
    recommendations?: string;
    codeSnippets?: Array<{
        path: string;
        code: string;
        comments?: string;
    }>;
    timestamp: string;
}
/**
 * Network request interface for browser automation
 */
export interface NetworkRequest {
    url: string;
    method: string;
    status?: number;
    contentType?: string;
    size?: number;
}
/**
 * Console message interface for browser automation
 */
export interface ConsoleMessage {
    type: 'log' | 'info' | 'warning' | 'error';
    text: string;
    timestamp: string;
}
/**
 * Browser automation response interface
 */
export interface BrowserAutomationResponse extends ApiResponse {
    url: string;
    action: string;
    instruction?: string;
    screenshot?: string;
    html?: string;
    networkRequests?: NetworkRequest[];
    consoleMessages?: ConsoleMessage[];
    extractedData?: string;
    executionTime: number;
}
/**
 * Documentation section interface
 */
export interface DocSection {
    title: string;
    content: string;
}
/**
 * Documentation generation response interface
 */
export interface DocGenerationResponse extends ApiResponse {
    repoPath: string;
    outputFormat: string;
    sections: DocSection[];
    timestamp: string;
    generationTime: number;
}
