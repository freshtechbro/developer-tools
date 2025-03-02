import React from 'react';
export interface RepoResultsProps {
    results: RepoAnalysisResult | null;
    isLoading: boolean;
    error: string | null;
}
export interface RepoAnalysisResult {
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
export declare function RepoResults({ results, isLoading, error }: RepoResultsProps): React.JSX.Element;
