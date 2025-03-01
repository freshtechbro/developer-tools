import { ApiResponse } from '../types/api';

/**
 * Base URL for API requests
 * Defaults to localhost:3003 if not set in environment variables
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003';

/**
 * Generic function to send API requests to the backend
 */
export async function sendApiRequest(endpoint: string, data: any): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send a web search request
 */
export async function webSearch(query: string, options: any = {}): Promise<ApiResponse> {
  return sendApiRequest('/api/command', {
    command: 'web-search',
    query,
    ...options
  });
}

/**
 * Send a command interceptor request
 */
export async function commandInterceptor(message: string): Promise<ApiResponse> {
  return sendApiRequest('/api/command', {
    command: 'command-interceptor',
    query: message
  });
}

/**
 * Send a repository analysis request
 */
export async function repoAnalysis(repoPath: string, options: any = {}): Promise<ApiResponse> {
  return sendApiRequest('/api/command', {
    command: 'repo-analysis',
    query: repoPath,
    ...options
  });
}

/**
 * Send a browser automation request
 */
export async function browserAutomation(url: string, options: any = {}): Promise<ApiResponse> {
  return sendApiRequest('/api/command', {
    command: 'browser-automation',
    url,
    ...options
  });
}

/**
 * Send a documentation generation request
 */
export async function docGeneration(repoPath: string, options: any = {}): Promise<ApiResponse> {
  return sendApiRequest('/api/command', {
    command: 'doc-generation',
    query: repoPath,
    ...options
  });
} 