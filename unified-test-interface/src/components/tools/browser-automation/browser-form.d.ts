import React from 'react';
export interface BrowserFormProps {
    onSubmit: (data: BrowserFormData) => void;
    isLoading: boolean;
}
export interface BrowserFormData {
    url: string;
    action: 'open' | 'act' | 'observe' | 'extract';
    instruction: string;
    captureHtml: boolean;
    captureScreenshot: boolean;
    captureNetwork: boolean;
    captureConsole: boolean;
    headless: boolean;
    timeout: number;
}
export declare function BrowserForm({ onSubmit, isLoading }: BrowserFormProps): React.JSX.Element;
