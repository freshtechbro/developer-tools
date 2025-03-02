import React from 'react';
export interface CommandResultsProps {
    result: CommandResult | null;
    isLoading: boolean;
    error: string | null;
}
export interface CommandResult {
    command: string;
    output: string;
    exitCode: number;
    executionTime: number;
}
export declare function CommandResults({ result, isLoading, error }: CommandResultsProps): React.JSX.Element;
