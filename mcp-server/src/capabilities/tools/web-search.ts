import axios from 'axios';
import { z } from 'zod';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

interface WebSearchRequest {
    query: string;
    saveTo?: string;
}

interface WebSearchResponse {
    searchResults: string;
    savedToFile?: string;
}

export const webSearchTool = {
    name: 'web-search',
    version: '0.1.0',
    description: 'Performs a web search using Perplexity AI.',
    
    execute: async (request: WebSearchRequest): Promise<WebSearchResponse> => {
        if (!PERPLEXITY_API_KEY) {
            throw new Error("Perplexity API key is not set in environment variables (PERPLEXITY_API_KEY)");
        }

        const { query, saveTo } = request;
        if (!query) {
            throw new Error("Search query is required.");
        }

        try {
            console.log(`🔍 Performing web search: "${query}"`);

            const response = await axios.post(PERPLEXITY_API_URL, {
                model: "pplx-7b-online",
                messages: [{ role: "user", content: query }]
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
                }
            });

            const searchResults = response.data.choices[0]?.message?.content || "No results found.";

            // If saveTo is specified, save results to file
            if (saveTo) {
                const fs = await import('fs/promises');
                await fs.writeFile(saveTo, searchResults, 'utf-8');
                console.log(`✅ Results saved to: ${saveTo}`);
                return { searchResults, savedToFile: saveTo };
            }

            return { searchResults };

        } catch (error) {
            console.error("❌ Error during web search:", error);
            if (axios.isAxiosError(error)) {
                throw new Error(`Web search failed: ${error.response?.data?.error || error.message}`);
            }
            throw new Error(`Web search failed: ${error}`);
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
            }
        },
        required: ['searchResults']
    }
}; 