import React from 'react';
interface WebSearchResultsProps {
    results: WebSearchResults | null;
    isLoading: boolean;
    error: string | null;
}
export interface WebSearchResults {
    searchResults: string;
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
export declare function WebSearchResults({ results, isLoading, error }: WebSearchResultsProps): React.JSX.Element;
export {};
