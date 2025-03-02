import React from 'react';
export interface DocFormProps {
    onSubmit: (data: DocFormData) => void;
    isLoading: boolean;
}
export interface DocFormData {
    repoPath: string;
    outputFormat: 'markdown' | 'html' | 'json';
    includeReadme: boolean;
    includeArchitecture: boolean;
    includeApi: boolean;
    includeDependencies: boolean;
    includeSetup: boolean;
    customInstructions: string;
}
export declare function DocForm({ onSubmit, isLoading }: DocFormProps): React.JSX.Element;
