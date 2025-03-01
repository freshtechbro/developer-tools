import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { Tool } from '@developer-tools/shared/types/tool';
import { logger } from '@developer-tools/shared/logger';
import { geminiService } from '@developer-tools/server/services/gemini.service';
import { fileStorageService } from '@developer-tools/server/services/file-storage.service';

// Schema for repository analysis request
const repoAnalysisRequestSchema = z.object({
  query: z.string().describe('The analysis query or question about the repository'),
  analysisType: z.enum(['code', 'documentation', 'both']).default('both')
    .describe('Type of analysis to perform'),
  targetPath: z.string().optional()
    .describe('Specific path or file to analyze. If not provided, analyzes the entire repository'),
  maxDepth: z.number().optional().default(3)
    .describe('Maximum directory depth for analysis'),
  saveToFile: z.boolean().optional().default(false)
    .describe('Whether to save the analysis to a file'),
});

// Schema for repository analysis response
const repoAnalysisResponseSchema = z.object({
  analysis: z.string().describe('The analysis results from Gemini'),
  codeInsights: z.object({
    architecture: z.array(z.string()).optional(),
    dependencies: z.array(z.string()).optional(),
    patterns: z.array(z.string()).optional(),
  }).optional(),
  documentationInsights: z.object({
    coverage: z.number().optional(),
    quality: z.string().optional(),
    recommendations: z.array(z.string()).optional(),
  }).optional(),
  savedToFile: z.string().optional()
    .describe('Path to the saved analysis file if saveToFile was true'),
});

// Cache interface for storing analysis results
interface AnalysisCache {
  timestamp: number;
  result: z.infer<typeof repoAnalysisResponseSchema>;
}

const analysisCache = new Map<string, AnalysisCache>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export const repoAnalysisTool: Tool = {
  name: 'repo-analysis',
  version: '0.2.0',
  description: 'Analyzes repository code and documentation using Google Gemini',
  
  execute: async (request: unknown) => {
    const parsedRequest = repoAnalysisRequestSchema.parse(request);
    const cacheKey = JSON.stringify({
      query: parsedRequest.query,
      analysisType: parsedRequest.analysisType,
      targetPath: parsedRequest.targetPath,
    });

    // Check cache first
    const cachedResult = analysisCache.get(cacheKey);
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL) {
      logger.info('Returning cached analysis result', { cacheKey });
      return cachedResult.result;
    }

    try {
      // Get repository content based on targetPath and maxDepth
      const repoContent = await getRepositoryContent(
        parsedRequest.targetPath || '.',
        parsedRequest.maxDepth
      );

      // Prepare structured prompt
      const prompt = createStructuredPrompt(
        parsedRequest.query,
        repoContent,
        parsedRequest.analysisType
      );

      // Call Gemini API for analysis through our service
      logger.info('Sending repository analysis request to Gemini', { 
        contentLength: repoContent.join('\n').length
      });
      
      const geminiResponse = await geminiService.generateContent(prompt, {
        temperature: 0.2, // Lower temperature for more deterministic/analytical responses
      });

      // Parse the response to extract structured data
      const parsedAnalysis = parseGeminiResponse(geminiResponse.content);
      
      // Save to file if requested
      let savedFilePath: string | undefined;
      if (parsedRequest.saveToFile) {
        try {
          const filename = `repo-analysis-${Date.now()}.md`;
          const savePath = path.join('local-research', filename);
          
          // Format the analysis as markdown
          const markdownContent = formatAnalysisAsMarkdown(
            parsedRequest.query,
            parsedAnalysis,
            parsedRequest.targetPath || '.',
            parsedRequest.analysisType
          );
          
          savedFilePath = await fileStorageService.saveToFile(savePath, markdownContent, {
            createDirectory: true
          });
          
          logger.info('Analysis saved to file', { path: savedFilePath });
        } catch (error) {
          logger.error('Failed to save analysis to file', {
            error: error instanceof Error ? error.message : String(error)
          });
          // Continue execution even if file saving fails
        }
      }
      
      // Construct response
      const response = {
        ...parsedAnalysis,
        savedToFile: savedFilePath
      };

      // Cache the result
      analysisCache.set(cacheKey, {
        timestamp: Date.now(),
        result: response,
      });

      return response;
    } catch (error) {
      logger.error('Error in repo analysis:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      if (error instanceof z.ZodError) {
        throw new Error(`Validation error: ${error.errors[0]?.message || 'Invalid data format'}`);
      }
      
      throw error; // Let service errors propagate
    }
  },

  requestSchema: repoAnalysisRequestSchema,
  responseSchema: repoAnalysisResponseSchema,
};

/**
 * Gets repository content by recursively traversing directories
 */
async function getRepositoryContent(
  targetPath: string,
  maxDepth: number,
  currentDepth = 0
): Promise<string[]> {
  const contents: string[] = [];
  
  try {
    const stats = await fs.stat(targetPath);
    
    if (stats.isFile()) {
      // Only include certain file types that are likely to be relevant for code analysis
      const fileExt = path.extname(targetPath).toLowerCase();
      const relevantExtensions = [
        '.ts', '.js', '.tsx', '.jsx', '.json', '.md', '.html', '.css', 
        '.scss', '.sass', '.less', '.yaml', '.yml', '.toml', '.xml',
        '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.go', '.rs', '.php'
      ];
      
      if (relevantExtensions.includes(fileExt) || fileExt === '') {
        const content = await fs.readFile(targetPath, 'utf-8');
        contents.push(`File: ${targetPath}\n${content}`);
      }
    } else if (stats.isDirectory() && currentDepth < maxDepth) {
      const files = await fs.readdir(targetPath);
      
      for (const file of files) {
        // Skip hidden files/directories and common directories to ignore
        if (file.startsWith('.') || 
            ['node_modules', 'dist', 'build', 'out', 'coverage', '.git'].includes(file)) {
          continue;
        }
        
        const fullPath = path.join(targetPath, file);
        const subContents = await getRepositoryContent(
          fullPath,
          maxDepth,
          currentDepth + 1
        );
        contents.push(...subContents);
      }
    }
  } catch (error) {
    logger.error(`Error reading ${targetPath}:`, {
      error: error instanceof Error ? error.message : String(error)
    });
  }
  
  return contents;
}

/**
 * Creates a structured prompt for Gemini
 */
function createStructuredPrompt(
  query: string,
  repoContent: string[],
  analysisType: 'code' | 'documentation' | 'both'
): string {
  return `You are a software analysis expert. Analyze the following repository content and answer this query: ${query}
Analysis type: ${analysisType}

Repository content:
${repoContent.join('\n\n')}

Please provide your answer in the following structured format:

# Main Analysis
[Your detailed analysis addressing the query]

# Code Insights
## Architecture
- [Key architectural pattern or component 1]
- [Key architectural pattern or component 2]
- ...

## Dependencies
- [Important dependency 1]
- [Important dependency 2]
- ...

## Patterns
- [Design pattern or code pattern 1]
- [Design pattern or code pattern 2]
- ...

# Documentation Insights
## Coverage
[Percentage estimate of documentation coverage, e.g., 60%]

## Quality
[Assessment of documentation quality: Excellent/Good/Fair/Poor]

## Recommendations
- [Documentation improvement 1]
- [Documentation improvement 2]
- ...

Be factual and base your analysis only on the provided content.`;
}

/**
 * Parse Gemini's response to extract structured insights
 */
function parseGeminiResponse(geminiText: string): z.infer<typeof repoAnalysisResponseSchema> {
  // Initialize result with default values
  const result: z.infer<typeof repoAnalysisResponseSchema> = {
    analysis: '',
    codeInsights: {
      architecture: [],
      dependencies: [],
      patterns: []
    },
    documentationInsights: {
      coverage: 0,
      quality: 'Poor',
      recommendations: []
    }
  };

  // Extract main analysis
  const mainAnalysisMatch = geminiText.match(/# Main Analysis\s+([\s\S]+?)(?=# Code Insights|$)/i);
  if (mainAnalysisMatch) {
    result.analysis = mainAnalysisMatch[1].trim();
  }

  // Extract architecture insights
  const architectureMatch = geminiText.match(/## Architecture\s+([\s\S]+?)(?=## Dependencies|## Patterns|# Documentation Insights|$)/i);
  if (architectureMatch) {
    const architectureItems = architectureMatch[1].match(/- (.+)/g);
    if (architectureItems && result.codeInsights) {
      result.codeInsights.architecture = architectureItems.map(item => item.replace(/^- /, '').trim());
    }
  }

  // Extract dependencies insights
  const dependenciesMatch = geminiText.match(/## Dependencies\s+([\s\S]+?)(?=## Patterns|# Documentation Insights|$)/i);
  if (dependenciesMatch) {
    const dependencyItems = dependenciesMatch[1].match(/- (.+)/g);
    if (dependencyItems && result.codeInsights) {
      result.codeInsights.dependencies = dependencyItems.map(item => item.replace(/^- /, '').trim());
    }
  }

  // Extract patterns insights
  const patternsMatch = geminiText.match(/## Patterns\s+([\s\S]+?)(?=# Documentation Insights|$)/i);
  if (patternsMatch) {
    const patternItems = patternsMatch[1].match(/- (.+)/g);
    if (patternItems && result.codeInsights) {
      result.codeInsights.patterns = patternItems.map(item => item.replace(/^- /, '').trim());
    }
  }

  // Extract documentation coverage
  const coverageMatch = geminiText.match(/## Coverage\s+(\d+)%/i);
  if (coverageMatch && result.documentationInsights) {
    result.documentationInsights.coverage = parseInt(coverageMatch[1], 10);
  }

  // Extract documentation quality
  const qualityMatch = geminiText.match(/## Quality\s+(\w+)/i);
  if (qualityMatch && result.documentationInsights) {
    result.documentationInsights.quality = qualityMatch[1].trim();
  }
  
  return result;
}

/**
 * Format the analysis as markdown for saving to file
 */
function formatAnalysisAsMarkdown(
  query: string,
  analysis: z.infer<typeof repoAnalysisResponseSchema>,
  targetPath: string,
  analysisType: 'code' | 'documentation' | 'both'
): string {
  const timestamp = new Date().toISOString();
  let markdown = `# Repository Analysis\n\n`;
  markdown += `**Query:** ${query}\n`;
  markdown += `**Target Path:** ${targetPath}\n`;
  markdown += `**Analysis Type:** ${analysisType}\n`;
  markdown += `**Date:** ${timestamp}\n\n`;
  
  markdown += `## Main Analysis\n\n${analysis.analysis}\n\n`;
  
  if (analysis.codeInsights) {
    markdown += `## Code Insights\n\n`;
    
    if (analysis.codeInsights.architecture?.length) {
      markdown += `### Architecture\n\n`;
      analysis.codeInsights.architecture.forEach(item => {
        markdown += `- ${item}\n`;
      });
      markdown += '\n';
    }
    
    if (analysis.codeInsights.dependencies?.length) {
      markdown += `### Dependencies\n\n`;
      analysis.codeInsights.dependencies.forEach(item => {
        markdown += `- ${item}\n`;
      });
      markdown += '\n';
    }
    
    if (analysis.codeInsights.patterns?.length) {
      markdown += `### Patterns\n\n`;
      analysis.codeInsights.patterns.forEach(item => {
        markdown += `- ${item}\n`;
      });
      markdown += '\n';
    }
  }
  
  if (analysis.documentationInsights) {
    markdown += `## Documentation Insights\n\n`;
    
    if (analysis.documentationInsights.coverage !== undefined) {
      markdown += `### Coverage\n\n${analysis.documentationInsights.coverage}%\n\n`;
    }
    
    if (analysis.documentationInsights.quality) {
      markdown += `### Quality\n\n${analysis.documentationInsights.quality}\n\n`;
    }
    
    if (analysis.documentationInsights.recommendations?.length) {
      markdown += `### Recommendations\n\n`;
      analysis.documentationInsights.recommendations.forEach(item => {
        markdown += `- ${item}\n`;
      });
      markdown += '\n';
    }
  }
  
  return markdown;
} 