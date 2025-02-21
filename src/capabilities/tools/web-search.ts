import axios from 'axios';
import { z } from 'zod';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

// Define request and response schemas
const WebSearchRequestSchema = z.object({
    query: z.string().min(1, "Search query is required"),
    saveTo: z.string().optional()
});

const WebSearchResponseSchema = z.object({
    searchResults: z.string(),
    savedToFile: z.string().optional()
});

export const webSearchTool = {
    name: 'web-search',
    version: '0.1.0',
    description: 'Performs a web search using Perplexity AI.',
    
    execute: async (request: unknown): Promise<unknown> => {
        if (!config.perplexityApiKey) {
            const error = new Error("Perplexity API key is not set in environment variables (PERPLEXITY_API_KEY)");
            logger.error("API key missing", { tool: 'web-search' });
            throw error;
        }

        // Validate request
        const { query, saveTo } = WebSearchRequestSchema.parse(request);

        try {
            logger.info("Performing web search", { query, saveTo });

            const response = await axios.post(PERPLEXITY_API_URL, {
                model: "pplx-7b-online",
                messages: [{ role: "user", content: query }]
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.perplexityApiKey}`
                }
            });

            const searchResults = response.data.choices[0]?.message?.content || "No results found.";

            // If saveTo is specified, save results to file
            if (saveTo) {
                logger.debug("Saving search results to file", { path: saveTo });
                const fs = await import('fs/promises');
                await fs.writeFile(saveTo, searchResults, 'utf-8');
                logger.info("Search results saved successfully", { path: saveTo });
                return WebSearchResponseSchema.parse({ searchResults, savedToFile: saveTo });
            }

            return WebSearchResponseSchema.parse({ searchResults });

        } catch (error) {
            logger.error("Web search failed", {
                error: error instanceof Error ? error.message : String(error),
                query,
                saveTo
            });

            if (axios.isAxiosError(error)) {
                throw new Error(`Web search failed: ${error.response?.data?.error || error.message}`);
            }
            throw new Error(`Web search failed: ${error}`);
        }
    },

    requestSchema: WebSearchRequestSchema,
    responseSchema: WebSearchResponseSchema
}; 