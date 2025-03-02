import { ResultFormatter, FormatterOptions } from '../services/formatter-service.js';
import { SearchResult, Source } from '../providers/provider-interface.js';
import { logger } from '@developer-tools/shared/logger';

/**
 * XML formatter implementation
 * Formats search results as XML data
 */
export class XmlFormatter implements ResultFormatter {
  format = 'xml';
  name = 'XML';
  
  /**
   * Format a search result as XML
   * @param result Search result to format
   * @param options Formatter options
   * @returns XML formatted string
   */
  formatResult(result: SearchResult, options?: FormatterOptions): string {
    const { content, metadata } = result;
    const includeSources = options?.includeSources !== false;
    const includeMetadata = options?.includeMetadata === true;
    
    // Start XML document
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<searchResult>\n';
    
    // Add content
    xml += '  <content><![CDATA[' + content + ']]></content>\n';
    
    // Add sources if available and requested
    if (includeSources && metadata?.sources && metadata.sources.length > 0) {
      xml += '  <sources>\n';
      
      metadata.sources.forEach((source, index) => {
        xml += '    <source>\n';
        
        if (source.title) {
          xml += `      <title><![CDATA[${source.title}]]></title>\n`;
        }
        
        if (source.url) {
          xml += `      <url><![CDATA[${source.url}]]></url>\n`;
        }
        
        if (source.snippet) {
          xml += `      <snippet><![CDATA[${source.snippet}]]></snippet>\n`;
        }
        
        xml += '    </source>\n';
      });
      
      xml += '  </sources>\n';
    }
    
    // Add metadata if requested
    if (includeMetadata) {
      xml += '  <metadata>\n';
      
      if (metadata?.model) {
        xml += `    <model>${this.escapeXml(metadata.model)}</model>\n`;
      }
      
      if (metadata?.provider) {
        xml += `    <provider>${this.escapeXml(metadata.provider)}</provider>\n`;
      }
      
      if (metadata?.tokenUsage) {
        xml += '    <tokenUsage>\n';
        const { promptTokens, completionTokens, totalTokens } = metadata.tokenUsage;
        
        if (promptTokens !== undefined) {
          xml += `      <promptTokens>${promptTokens}</promptTokens>\n`;
        }
        
        if (completionTokens !== undefined) {
          xml += `      <completionTokens>${completionTokens}</completionTokens>\n`;
        }
        
        if (totalTokens !== undefined) {
          xml += `      <totalTokens>${totalTokens}</totalTokens>\n`;
        }
        
        xml += '    </tokenUsage>\n';
      }
      
      if (metadata?.timestamp) {
        xml += `    <timestamp>${metadata.timestamp}</timestamp>\n`;
      }
      
      if (metadata?.cached !== undefined) {
        xml += `    <cached>${metadata.cached ? 'true' : 'false'}</cached>\n`;
      }
      
      xml += '  </metadata>\n';
    }
    
    // Close XML document
    xml += '</searchResult>';
    
    return xml;
  }
  
  /**
   * Escape a string for XML
   * @param str String to escape
   * @returns Escaped string
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

// Export the formatter
export default XmlFormatter; 