import { z } from 'zod';
import { logger } from '@developer-tools/shared/logger';
import type { Tool } from '@developer-tools/shared/types/tool';
import { perplexityService } from '@developer-tools/server/services/perplexity.service';
import { fileStorageService } from '@developer-tools/server/services/file-storage.service';

// Define request and response schemas
const WebSearchRequestSchema = z.object({
    query: z.string().min(1, "Search query cannot be empty"),
    saveToFile: z.boolean().optional().default(false),
    maxTokens: z.number().optional().default(150)
});

const WebSearchResponseSchema = z.object({
    searchResults: z.string(),
    savedToFile: z.string().optional(),
    metadata: z.object({
        model: z.string().optional(),
        tokenUsage: z.object({
            promptTokens: z.number().optional(),
            completionTokens: z.number().optional(),
            totalTokens: z.number().optional()
        }).optional()
    }).optional()
});

type WebSearchRequest = z.infer<typeof WebSearchRequestSchema>;
type WebSearchResponse = z.infer<typeof WebSearchResponseSchema>;

export const webSearchTool: Tool = {
    name: 'web-search',
    version: '0.2.0',
    description: 'Performs a web search using Perplexity AI.',
    
    execute: async (request: unknown): Promise<unknown> => {
        // Validate request
        const { query, saveToFile, maxTokens } = WebSearchRequestSchema.parse(request);

        try {
            logger.info("Executing web search tool", { query, saveToFile });

            // Use PerplexityService to perform the search
            const searchResult = await perplexityService.search(query, { maxTokens });
            
            // If saveToFile is true, save results to file using FileStorageService
            let savedFilePath: string | undefined;
            if (saveToFile) {
                try {
                    const savePath = `local-research/web-search-${Date.now()}.md`;
                    logger.debug("Saving search results to file", { path: savePath });
                    
                    savedFilePath = await fileStorageService.saveToFile(savePath, searchResult.content, {
                        createDirectory: true
                    });
                    
                    logger.info("Search results saved successfully", { path: savedFilePath });
                } catch (fsError) {
                    logger.error("Failed to save search results to file", {
                        error: fsError instanceof Error ? fsError.message : String(fsError),
                        query
                    });
                    // Continue execution even if file saving fails
                }
            }

            // Format the response according to the schema
            return WebSearchResponseSchema.parse({
                searchResults: searchResult.content,
                savedToFile: savedFilePath,
                metadata: searchResult.metadata
            });

        } catch (error) {
            logger.error("Web search tool execution failed", {
                error: error instanceof Error ? error.message : String(error),
                query,
                stack: error instanceof Error ? error.stack : undefined
            });

            if (error instanceof z.ZodError) {
                throw new Error(`Validation error: ${error.errors[0]?.message || 'Invalid data format'}`);
            }

            throw error; // Let the service's error propagate
        }
    },

    requestSchema: WebSearchRequestSchema,
    responseSchema: WebSearchResponseSchema
}; 