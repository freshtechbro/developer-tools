import { SearchResult } from '../providers/provider-interface.js';
/**
 * Formatter options
 */
export interface FormatterOptions {
    /**
     * Output format (text, markdown, json, html)
     */
    format: 'text' | 'markdown' | 'json' | 'html';
    /**
     * Whether to include sources in the output
     */
    includeSources?: boolean;
    /**
     * Whether to include metadata in the output
     */
    includeMetadata?: boolean;
    /**
     * CSS classes for HTML output
     */
    cssClasses?: {
        container?: string;
        content?: string;
        sources?: string;
        sourcesList?: string;
        sourceItem?: string;
        metadata?: string;
    };
    /**
     * Custom CSS for HTML output
     */
    customCss?: string;
}
/**
 * Search result formatter service
 */
export declare class FormatterService {
    /**
     * Format search results based on the specified format
     * @param result Search result to format
     * @param options Formatting options
     * @returns Formatted string
     */
    format(result: SearchResult, options: FormatterOptions): string;
    /**
     * Format as JSON
     */
    private formatJson;
    /**
     * Format as Markdown
     */
    private formatMarkdown;
    /**
     * Format as HTML
     */
    private formatHtml;
    /**
     * Format as plain text
     */
    private formatText;
}
export declare const formatterService: FormatterService;
