import React from 'react';
export interface CommandFormProps {
    onSubmit: (data: CommandFormData) => void;
    isLoading: boolean;
}
export interface CommandFormData {
    command: string;
    description: string;
    autoApprove: boolean;
    runInBackground: boolean;
}
export declare function CommandForm({ onSubmit, isLoading }: CommandFormProps): React.JSX.Element;
