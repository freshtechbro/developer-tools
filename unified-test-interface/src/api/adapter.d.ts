import { ApiResponse } from '../types/api';
/**
 * Generic function to send API requests to the backend
 */
export declare function sendApiRequest(endpoint: string, data: any): Promise<ApiResponse>;
/**
 * Send a web search request
 */
export declare function webSearch(query: string, options?: any): Promise<ApiResponse>;
/**
 * Send a command interceptor request
 */
export declare function commandInterceptor(message: string): Promise<ApiResponse>;
/**
 * Send a repository analysis request
 */
export declare function repoAnalysis(repoPath: string, options?: any): Promise<ApiResponse>;
/**
 * Send a browser automation request
 */
export declare function browserAutomation(url: string, options?: any): Promise<ApiResponse>;
/**
 * Send a documentation generation request
 */
export declare function docGeneration(repoPath: string, options?: any): Promise<ApiResponse>;
