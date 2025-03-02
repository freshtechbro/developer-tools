import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
/**
 * Combines class names with Tailwind CSS classes
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
/**
 * Formats a timestamp string into a readable date and time
 */
export function formatTime(timestamp) {
    try {
        const date = new Date(timestamp);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        }).format(date);
    }
    catch (error) {
        return timestamp; // Return the original string if parsing fails
    }
}
/**
 * Truncates a string to a specified length and adds an ellipsis
 */
export function truncateString(str, maxLength) {
    if (str.length <= maxLength)
        return str;
    return str.slice(0, maxLength) + '...';
}
/**
 * Debounces a function call
 */
export function debounce(func, wait) {
    let timeout = null;
    return function (...args) {
        if (timeout)
            clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
/**
 * Copies text to clipboard
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    }
    catch (error) {
        console.error('Failed to copy text:', error);
        return false;
    }
}
// Create a type-safe environment variable access function
export function getEnvVar(key, defaultValue = '') {
    return import.meta.env[`VITE_${key}`] || defaultValue;
}
// Generate a unique request ID
export function generateRequestId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
// Format the output of a web search based on the format
export function formatOutput(data, format) {
    switch (format) {
        case 'json':
            return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        case 'html':
            return data;
        case 'markdown':
        case 'text':
        default:
            return typeof data === 'string' ? data : JSON.stringify(data);
    }
}
