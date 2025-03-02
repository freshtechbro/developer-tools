import { type ClassValue } from "clsx";
/**
 * Combines class names with Tailwind CSS classes
 */
export declare function cn(...inputs: ClassValue[]): string;
/**
 * Formats a timestamp string into a readable date and time
 */
export declare function formatTime(timestamp: string): string;
/**
 * Truncates a string to a specified length and adds an ellipsis
 */
export declare function truncateString(str: string, maxLength: number): string;
/**
 * Debounces a function call
 */
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
/**
 * Copies text to clipboard
 */
export declare function copyToClipboard(text: string): Promise<boolean>;
export declare function getEnvVar(key: string, defaultValue?: string): string;
export declare function generateRequestId(): string;
export declare function formatOutput(data: any, format: string): string;
