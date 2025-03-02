import React from 'react';
interface WebSearchFormProps {
    onSubmit: (data: WebSearchFormData) => void;
    isLoading: boolean;
}
export interface WebSearchFormData {
    query: string;
    provider: string;
    format: string;
    detailed: boolean;
    noCache: boolean;
    includeMetadata: boolean;
}
export declare function WebSearchForm({ onSubmit, isLoading }: WebSearchFormProps): React.JSX.Element;
export {};
