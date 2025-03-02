import { ResultFormatter, FormatterOptions } from '../services/formatter-service.js';
import { SearchResult, Source } from '../providers/provider-interface.js';
import { logger } from '@developer-tools/shared/logger';

/**
 * CSV formatter implementation
 * Formats search results as CSV data
 */
export class CsvFormatter implements ResultFormatter {
  format = 'csv';
  name = 'CSV';
  
  /**
   * Format a search result as CSV
   * @param result Search result to format
   * @param options Formatter options
   * @returns CSV formatted string
   */
  formatResult(result: SearchResult, options?: FormatterOptions): string {
    const { content, metadata } = result;
    const includeSources = options?.includeSources !== false;
    const includeMetadata = options?.includeMetadata === true;
    
    // Start with content as first row
    let csvData = '"Content"\n';
    csvData += `"${this.escapeForCsv(content)}"\n\n`;
    
    // Add sources if available and requested
    if (includeSources && metadata?.sources && metadata.sources.length > 0) {
      csvData += '"Source Title","Source URL","Source Snippet"\n';
      
      metadata.sources.forEach(source => {
        const title = source.title || '';
        const url = source.url || '';
        const snippet = source.snippet || '';
        
        csvData += `"${this.escapeForCsv(title)}","${this.escapeForCsv(url)}","${this.escapeForCsv(snippet)}"\n`;
      });
      
      csvData += '\n';
    }
    
    // Add metadata if requested
    if (includeMetadata) {
      csvData += '"Metadata Key","Metadata Value"\n';
      
      if (metadata?.model) {
        csvData += `"Model","${this.escapeForCsv(metadata.model)}"\n`;
      }
      
      if (metadata?.provider) {
        csvData += `"Provider","${this.escapeForCsv(metadata.provider)}"\n`;
      }
      
      if (metadata?.tokenUsage) {
        const { promptTokens, completionTokens, totalTokens } = metadata.tokenUsage;
        
        if (promptTokens !== undefined) {
          csvData += `"Prompt Tokens","${promptTokens}"\n`;
        }
        
        if (completionTokens !== undefined) {
          csvData += `"Completion Tokens","${completionTokens}"\n`;
        }
        
        if (totalTokens !== undefined) {
          csvData += `"Total Tokens","${totalTokens}"\n`;
        }
      }
      
      if (metadata?.timestamp) {
        csvData += `"Timestamp","${metadata.timestamp}"\n`;
      }
      
      if (metadata?.cached !== undefined) {
        csvData += `"Cached","${metadata.cached ? 'Yes' : 'No'}"\n`;
      }
    }
    
    return csvData;
  }
  
  /**
   * Escape a string for CSV format
   * @param str String to escape
   * @returns Escaped string
   */
  private escapeForCsv(str: string): string {
    // Replace double quotes with two double quotes
    return str.replace(/"/g, '""');
  }
}

// Export the formatter
export default CsvFormatter; 