import { SearchResult, Source } from '../providers/provider-interface.js';
import { logger } from '@developer-tools/shared/logger';
import sanitizeHtml from 'sanitize-html';

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
export class FormatterService {
  /**
   * Format search results based on the specified format
   * @param result Search result to format
   * @param options Formatting options
   * @returns Formatted string
   */
  format(result: SearchResult, options: FormatterOptions): string {
    const { format, includeSources = true, includeMetadata = false } = options;
    const { content, metadata } = result;
    
    try {
      switch (format) {
        case 'json':
          return this.formatJson(content, metadata?.sources, includeMetadata ? metadata : undefined);
        
        case 'markdown':
          return this.formatMarkdown(content, metadata?.sources, includeSources, includeMetadata ? metadata : undefined);
        
        case 'html':
          return this.formatHtml(content, metadata?.sources, includeSources, includeMetadata ? metadata : undefined, options);
        
        case 'text':
        default:
          return this.formatText(content, metadata?.sources, includeSources, includeMetadata ? metadata : undefined);
      }
    } catch (error) {
      logger.error('Error formatting search results', { error, format });
      // Return the raw content as a fallback
      return content;
    }
  }
  
  /**
   * Format as JSON
   */
  private formatJson(content: string, sources?: Source[], metadata?: any): string {
    const result: any = {
      content
    };
    
    if (sources && sources.length > 0) {
      result.sources = sources;
    }
    
    if (metadata) {
      result.metadata = metadata;
    }
    
    return JSON.stringify(result, null, 2);
  }
  
  /**
   * Format as Markdown
   */
  private formatMarkdown(content: string, sources?: Source[], includeSources: boolean = true, metadata?: any): string {
    let markdown = content;
    
    // Add sources if included
    if (includeSources && sources && sources.length > 0) {
      markdown += '\n\n## Sources\n\n';
      
      sources.forEach((source, index) => {
        const title = source.title || `Source ${index + 1}`;
        const url = source.url || '#';
        
        markdown += `${index + 1}. [${title}](${url})`;
        
        if (source.snippet) {
          markdown += `\n   > ${source.snippet}\n`;
        }
        
        markdown += '\n';
      });
    }
    
    // Add metadata if included
    if (metadata) {
      markdown += '\n\n## Metadata\n\n';
      markdown += '```json\n';
      markdown += JSON.stringify(metadata, null, 2);
      markdown += '\n```\n';
    }
    
    return markdown;
  }
  
  /**
   * Format as HTML
   */
  private formatHtml(content: string, sources?: Source[], includeSources: boolean = true, metadata?: any, options?: FormatterOptions): string {
    const cssClasses = options?.cssClasses || {};
    const sanitizedContent = sanitizeHtml(content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']),
      allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, '*': ['class', 'id'] }
    });
    
    let html = `<div class="${cssClasses.container || 'web-search-result'}">`;
    
    // Main content
    html += `<div class="${cssClasses.content || 'web-search-content'}">`;
    html += sanitizedContent.replace(/\n/g, '<br>');
    html += '</div>';
    
    // Sources
    if (includeSources && sources && sources.length > 0) {
      html += `<div class="${cssClasses.sources || 'web-search-sources'}">`;
      html += '<h2>Sources</h2>';
      html += `<ol class="${cssClasses.sourcesList || 'web-search-sources-list'}">`;
      
      sources.forEach(source => {
        const title = source.title || 'Source';
        const url = source.url || '#';
        
        html += `<li class="${cssClasses.sourceItem || 'web-search-source-item'}">`;
        html += `<a href="${url}" target="_blank" rel="noopener">${sanitizeHtml(title)}</a>`;
        
        if (source.snippet) {
          html += `<blockquote>${sanitizeHtml(source.snippet)}</blockquote>`;
        }
        
        html += '</li>';
      });
      
      html += '</ol>';
      html += '</div>';
    }
    
    // Metadata
    if (metadata) {
      html += `<div class="${cssClasses.metadata || 'web-search-metadata'}">`;
      html += '<h2>Metadata</h2>';
      html += '<pre>';
      html += JSON.stringify(metadata, null, 2);
      html += '</pre>';
      html += '</div>';
    }
    
    // Add custom CSS if provided
    if (options?.customCss) {
      html = `<style>${options.customCss}</style>${html}`;
    }
    
    html += '</div>';
    
    return html;
  }
  
  /**
   * Format as plain text
   */
  private formatText(content: string, sources?: Source[], includeSources: boolean = true, metadata?: any): string {
    let text = content;
    
    // Add sources if included
    if (includeSources && sources && sources.length > 0) {
      text += '\n\nSources:\n\n';
      
      sources.forEach((source, index) => {
        const title = source.title || `Source ${index + 1}`;
        const url = source.url || 'N/A';
        
        text += `${index + 1}. ${title}\n`;
        text += `   URL: ${url}\n`;
        
        if (source.snippet) {
          text += `   Snippet: ${source.snippet}\n`;
        }
        
        text += '\n';
      });
    }
    
    // Add metadata if included
    if (metadata) {
      text += '\n\nMetadata:\n\n';
      text += JSON.stringify(metadata, null, 2);
      text += '\n';
    }
    
    return text;
  }
}

// Create and export a default instance
export const formatterService = new FormatterService(); 