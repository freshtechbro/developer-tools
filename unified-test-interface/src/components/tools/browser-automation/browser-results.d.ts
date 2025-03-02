import React from 'react';
export interface BrowserResultsProps {
    results: BrowserResult | null;
    isLoading: boolean;
    error: string | null;
}
export interface NetworkRequest {
    url: string;
    method: string;
    status?: number;
    contentType?: string;
    size?: number;
}
export interface ConsoleMessage {
    type: 'log' | 'info' | 'warning' | 'error';
    text: string;
    timestamp: string;
}
export interface BrowserResult {
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
export declare function BrowserResults({ results, isLoading, error }: BrowserResultsProps): React.JSX.Element;
