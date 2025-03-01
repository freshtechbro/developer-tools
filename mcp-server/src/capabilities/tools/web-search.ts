import { z } from 'zod';
import { logger } from '../../utils/logger.js';
import { webSearchTool as coreWebSearchTool } from '../../../../tools/web-search/web-search.js';

// Define request and response schemas based on the core tool
const WebSearchRequestSchema = z.object({
    query: z.string().min(1, "Search query cannot be empty"),
    saveTo: z.string().optional(),
    format: z.enum(['text', 'markdown', 'json']).optional().default('markdown'),
    maxTokens: z.number().optional().default(150),
    includeSources: z.boolean().optional().default(true)
});

/**
 * Web search tool for MCP server
 * This is an adapter that maps the MCP server interface to the core web search tool
 */
export const webSearchTool = {
    name: 'web-search',
    version: '0.3.0',
    description: 'Performs a web search using Perplexity AI and returns formatted results.',
    
    execute: async (request: unknown): Promise<unknown> => {
        try {
            // Validate request using our schema
            const validatedRequest = WebSearchRequestSchema.parse(request);
            
            logger.info(`🔍 Performing web search: "${validatedRequest.query}"`);
            
            // Map the request to the format expected by the core tool
            const coreRequest = {
                query: validatedRequest.query,
                saveToFile: !!validatedRequest.saveTo,
                outputFormat: validatedRequest.format,
                maxTokens: validatedRequest.maxTokens,
                includeSources: validatedRequest.includeSources,
                customFileName: validatedRequest.saveTo
            };
            
            // Execute the core tool
            const result = await coreWebSearchTool.execute(coreRequest);
            
            // Log success
            logger.info(`✅ Web search completed for: "${validatedRequest.query}"`);
            
            // Return the result
            return result;
        } catch (error) {
            // Log error
            logger.error(`❌ Web search failed: ${error instanceof Error ? error.message : String(error)}`);
            
            // Re-throw the error
            throw error;
        }
    },

    requestSchema: {
        type: 'object',
        properties: {
            query: { 
                type: 'string', 
                description: 'The search query.' 
            },
            saveTo: { 
                type: 'string', 
                description: 'Optional file path to save the search results.' 
            },
            format: {
                type: 'string',
                enum: ['text', 'markdown', 'json'],
                description: 'Output format (text, markdown, json)',
                default: 'markdown'
            },
            maxTokens: {
                type: 'number',
                description: 'Maximum number of tokens for the response',
                default: 150
            },
            includeSources: {
                type: 'boolean',
                description: 'Whether to include sources in the output',
                default: true
            }
        },
        required: ['query']
    },

    responseSchema: {
        type: 'object',
        properties: {
            searchResults: { 
                type: 'string', 
                description: 'Web search results.' 
            },
            savedToFile: { 
                type: 'string', 
                description: 'Path to the file where results were saved, if applicable.' 
            },
            metadata: {
                type: 'object',
                properties: {
                    model: {
                        type: 'string',
                        description: 'The model used for the search'
                    },
                    tokenUsage: {
                        type: 'object',
                        properties: {
                            promptTokens: {
                                type: 'number',
                                description: 'Number of tokens in the prompt'
                            },
                            completionTokens: {
                                type: 'number',
                                description: 'Number of tokens in the completion'
                            },
                            totalTokens: {
                                type: 'number',
                                description: 'Total number of tokens used'
                            }
                        }
                    },
                    sources: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                title: {
                                    type: 'string',
                                    description: 'Title of the source'
                                },
                                url: {
                                    type: 'string',
                                    description: 'URL of the source'
                                },
                                snippet: {
                                    type: 'string',
                                    description: 'Snippet from the source'
                                }
                            }
                        }
                    }
                }
            }
        },
        required: ['searchResults']
    }
}; 