import React from 'react';
export interface WebSearchFormData {
    query: string;
    provider: string;
    format: string;
    detailed: boolean;
    noCache: boolean;
    includeMetadata: boolean;
}
export default function WebSearchPage(): React.JSX.Element;
