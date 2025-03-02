import React from 'react';
export interface RepoFormProps {
    onSubmit: (data: RepoFormData) => void;
    isLoading: boolean;
}
export interface RepoFormData {
    repoPath: string;
    query: string;
    analysisType: 'general' | 'code-review' | 'architecture' | 'dependencies' | 'custom';
}
export declare function RepoForm({ onSubmit, isLoading }: RepoFormProps): React.JSX.Element;
