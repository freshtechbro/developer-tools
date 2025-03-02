import React from 'react';
export interface DocResultsProps {
    results: DocGenerationResult | null;
    isLoading: boolean;
    error: string | null;
}
export interface DocSection {
    title: string;
    content: string;
}
export interface DocGenerationResult {
    repoPath: string;
    outputFormat: string;
    sections: DocSection[];
    timestamp: string;
    generationTime: number;
}
export declare function DocResults({ results, isLoading, error }: DocResultsProps): React.JSX.Element;
