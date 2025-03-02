import { SearchResult, Source } from '../providers/provider-interface.js';
import { logger } from '@developer-tools/shared/logger';
import sanitizeHtml from 'sanitize-html';

/**
 * Base formatter options
 */
export interface FormatterOptions {
  /**
   * Output format (text, markdown, json, html)
   */
  format: string;
  
  /**
   * Whether to include sources in the output
   */
  includeSources?: boolean;
  
  /**
   * Whether to include metadata in the output
   */
  includeMetadata?: boolean;
}

/**
 * HTML formatter options
 */
export interface HtmlFormatterOptions extends FormatterOptions {
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
 * Search result formatter interface
 */
export interface ResultFormatter {
  /**
   * Format name (unique identifier)
   */
  format: string;
  
  /**
   * Descriptive name for the formatter
   */
  name: string;
  
  /**
   * Format a search result
   * @param result Search result to format
   * @param options Formatter options
   * @returns Formatted string
   */
  formatResult(result: SearchResult, options?: FormatterOptions): string;
}

/**
 * JSON formatter implementation
 */
export class JsonFormatter implements ResultFormatter {
  format = 'json';
  name = 'JSON';
  
  formatResult(result: SearchResult, options?: FormatterOptions): string {
    const { content, metadata } = result;
    const includeSources = options?.includeSources !== false;
    const includeMetadata = options?.includeMetadata === true;
    
    const output: any = {
      content
    };
    
    if (includeSources && metadata?.sources && metadata.sources.length > 0) {
      output.sources = metadata.sources;
    }
    
    if (includeMetadata) {
      output.metadata = { ...metadata };
      
      // Remove sources from metadata if already included
      if (includeSources && output.sources) {
        delete output.metadata.sources;
      }
    }
    
    return JSON.stringify(output, null, 2);
  }
}

/**
 * Markdown formatter implementation
 */
export class MarkdownFormatter implements ResultFormatter {
  format = 'markdown';
  name = 'Markdown';
  
  formatResult(result: SearchResult, options?: FormatterOptions): string {
    const { content, metadata } = result;
    const includeSources = options?.includeSources !== false;
    const includeMetadata = options?.includeMetadata === true;
    
    let output = content;
    
    // Add sources section if available and requested
    if (includeSources && metadata?.sources && metadata.sources.length > 0) {
      output += '\n\n## Sources\n\n';
      
      metadata.sources.forEach((source, index) => {
        if (source.title && source.url) {
          output += `${index + 1}. [${source.title}](${source.url})\n`;
        } else if (source.url) {
          output += `${index + 1}. [${source.url}](${source.url})\n`;
        }
        
        if (source.snippet) {
          output += `   ${source.snippet}\n\n`;
        }
      });
    }
    
    // Add metadata section if requested
    if (includeMetadata) {
      output += '\n\n## Metadata\n\n';
      
      if (metadata?.model) {
        output += `- **Model**: ${metadata.model}\n`;
      }
      
      if (metadata?.provider) {
        output += `- **Provider**: ${metadata.provider}\n`;
      }
      
      if (metadata?.tokenUsage) {
        output += `- **Token Usage**: `;
        const { promptTokens, completionTokens, totalTokens } = metadata.tokenUsage;
        
        if (promptTokens !== undefined) output += `Prompt: ${promptTokens} `;
        if (completionTokens !== undefined) output += `Completion: ${completionTokens} `;
        if (totalTokens !== undefined) output += `Total: ${totalTokens}`;
        
        output += '\n';
      }
      
      if (metadata?.timestamp) {
        output += `- **Timestamp**: ${metadata.timestamp}\n`;
      }
      
      if (metadata?.cached) {
        output += `- **Cached**: ${metadata.cached ? 'Yes' : 'No'}\n`;
      }
    }
    
    return output;
  }
}

/**
 * HTML formatter implementation
 */
export class HtmlFormatter implements ResultFormatter {
  format = 'html';
  name = 'HTML';
  
  formatResult(result: SearchResult, options?: FormatterOptions): string {
    const { content, metadata } = result;
    const htmlOptions = options as HtmlFormatterOptions;
    const includeSources = options?.includeSources !== false;
    const includeMetadata = options?.includeMetadata === true;
    
    // Sanitize content
    const sanitizedContent = sanitizeHtml(content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        '*': ['class', 'id', 'style']
      }
    });
    
    // CSS classes
    const cssClasses = htmlOptions?.cssClasses || {};
    
    // Default CSS
    const defaultCss = `
      .search-result-container { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; max-width: 800px; margin: 0 auto; }
      .search-result-content { line-height: 1.6; }
      .search-result-sources { margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; }
      .search-result-sources h3 { margin: 0 0 10px 0; }
      .search-result-source-list { list-style-type: none; padding: 0; }
      .search-result-source-item { margin-bottom: 10px; }
      .search-result-source-item a { color: #0366d6; text-decoration: none; }
      .search-result-source-item a:hover { text-decoration: underline; }
      .search-result-metadata { margin-top: 20px; font-size: 0.9em; color: #666; border-top: 1px solid #eee; padding-top: 10px; }
    `;
    
    // Build HTML
    let html = `
      <div class="${cssClasses.container || 'search-result-container'}">
        <div class="${cssClasses.content || 'search-result-content'}">
          ${sanitizedContent}
        </div>
    `;
    
    // Add sources if available and requested
    if (includeSources && metadata?.sources && metadata.sources.length > 0) {
      html += `
        <div class="${cssClasses.sources || 'search-result-sources'}">
          <h3>Sources</h3>
          <ul class="${cssClasses.sourcesList || 'search-result-source-list'}">
      `;
      
      metadata.sources.forEach(source => {
        html += `<li class="${cssClasses.sourceItem || 'search-result-source-item'}">`;
        
        if (source.title && source.url) {
          html += `<a href="${source.url}" target="_blank" rel="noopener noreferrer">${sanitizeHtml(source.title)}</a>`;
        } else if (source.url) {
          html += `<a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.url}</a>`;
        } else if (source.title) {
          html += sanitizeHtml(source.title);
        }
        
        if (source.snippet) {
          html += `<p>${sanitizeHtml(source.snippet)}</p>`;
        }
        
        html += '</li>';
      });
      
      html += `
          </ul>
        </div>
      `;
    }
    
    // Add metadata if requested
    if (includeMetadata) {
      html += `
        <div class="${cssClasses.metadata || 'search-result-metadata'}">
          <h3>Metadata</h3>
          <dl>
      `;
      
      if (metadata?.model) {
        html += `<dt>Model</dt><dd>${sanitizeHtml(metadata.model)}</dd>`;
      }
      
      if (metadata?.provider) {
        html += `<dt>Provider</dt><dd>${sanitizeHtml(metadata.provider)}</dd>`;
      }
      
      if (metadata?.tokenUsage) {
        html += `<dt>Token Usage</dt><dd>`;
        const { promptTokens, completionTokens, totalTokens } = metadata.tokenUsage;
        
        if (promptTokens !== undefined) html += `Prompt: ${promptTokens} `;
        if (completionTokens !== undefined) html += `Completion: ${completionTokens} `;
        if (totalTokens !== undefined) html += `Total: ${totalTokens}`;
        
        html += '</dd>';
      }
      
      if (metadata?.timestamp) {
        html += `<dt>Timestamp</dt><dd>${new Date(metadata.timestamp).toLocaleString()}</dd>`;
      }
      
      if (metadata?.cached !== undefined) {
        html += `<dt>Cached</dt><dd>${metadata.cached ? 'Yes' : 'No'}</dd>`;
      }
      
      html += `
          </dl>
        </div>
      `;
    }
    
    html += '</div>';
    
    // Add CSS
    const customCss = htmlOptions?.customCss || '';
    const styles = `<style>${defaultCss}${customCss}</style>`;
    
    return `${styles}${html}`;
  }
}

/**
 * Text formatter implementation
 */
export class TextFormatter implements ResultFormatter {
  format = 'text';
  name = 'Plain Text';
  
  formatResult(result: SearchResult, options?: FormatterOptions): string {
    const { content, metadata } = result;
    const includeSources = options?.includeSources !== false;
    const includeMetadata = options?.includeMetadata === true;
    
    let output = content;
    
    // Add sources section if available and requested
    if (includeSources && metadata?.sources && metadata.sources.length > 0) {
      output += '\n\nSOURCES:\n';
      
      metadata.sources.forEach((source, index) => {
        output += `\n${index + 1}. `;
        
        if (source.title) {
          output += source.title;
        }
        
        if (source.url) {
          output += ` (${source.url})`;
        }
        
        if (source.snippet) {
          output += `\n   ${source.snippet}`;
        }
        
        output += '\n';
      });
    }
    
    // Add metadata section if requested
    if (includeMetadata) {
      output += '\n\nMETADATA:\n';
      
      if (metadata?.model) {
        output += `\nModel: ${metadata.model}`;
      }
      
      if (metadata?.provider) {
        output += `\nProvider: ${metadata.provider}`;
      }
      
      if (metadata?.tokenUsage) {
        output += `\nToken Usage: `;
        const { promptTokens, completionTokens, totalTokens } = metadata.tokenUsage;
        
        if (promptTokens !== undefined) output += `Prompt: ${promptTokens} `;
        if (completionTokens !== undefined) output += `Completion: ${completionTokens} `;
        if (totalTokens !== undefined) output += `Total: ${totalTokens}`;
      }
      
      if (metadata?.timestamp) {
        output += `\nTimestamp: ${metadata.timestamp}`;
      }
      
      if (metadata?.cached !== undefined) {
        output += `\nCached: ${metadata.cached ? 'Yes' : 'No'}`;
      }
    }
    
    return output;
  }
}

/**
 * Search result formatter service
 */
export class FormatterService {
  // Registry of available formatters
  private formatters = new Map<string, ResultFormatter>();
  
  constructor() {
    // Register built-in formatters
    this.registerFormatter(new JsonFormatter());
    this.registerFormatter(new MarkdownFormatter());
    this.registerFormatter(new HtmlFormatter());
    this.registerFormatter(new TextFormatter());
  }
  
  /**
   * Register a custom formatter
   * @param formatter Formatter to register
   */
  registerFormatter(formatter: ResultFormatter): void {
    this.formatters.set(formatter.format, formatter);
    logger.debug(`Registered formatter: ${formatter.name}`, { format: formatter.format });
  }
  
  /**
   * Get all registered formatters
   * @returns Array of registered formatters
   */
  getFormatters(): ResultFormatter[] {
    return Array.from(this.formatters.values());
  }
  
  /**
   * Format search results based on the specified format
   * @param result Search result to format
   * @param options Formatting options
   * @returns Formatted string
   */
  format(result: SearchResult, options: FormatterOptions): string {
    const formatType = options.format || 'text';
    
    try {
      // Get the formatter for the requested format
      const formatter = this.formatters.get(formatType);
      
      if (formatter) {
        return formatter.formatResult(result, options);
      } else {
        logger.warn(`Unknown format type: ${formatType}, falling back to text`);
        const textFormatter = this.formatters.get('text');
        return textFormatter ? textFormatter.formatResult(result, options) : result.content;
      }
    } catch (error) {
      logger.error('Error formatting search results', { 
        error: error instanceof Error ? error.message : String(error),
        format: formatType
      });
      // Return the raw content as a fallback
      return result.content;
    }
  }
}

// Export a singleton instance
export const formatterService = new FormatterService(); 