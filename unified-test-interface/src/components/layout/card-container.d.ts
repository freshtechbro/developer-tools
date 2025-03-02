import React from 'react';
interface CardContainerProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}
export declare function CardContainer({ title, description, children, className }: CardContainerProps): React.JSX.Element;
export {};
