import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { z } from 'zod';
import { spawn } from 'child_process';
import { logger } from './utils/logger.js';
import { config } from './config/index.js';

// Define response schemas
const WebSearchResponseSchema = z.object({
    result: z.object({
        searchResults: z.string(),
        savedToFile: z.string().optional()
    })
});

const HealthCheckResponseSchema = z.object({
    result: z.object({
        status: z.enum(['healthy', 'unhealthy']),
        uptime: z.number(),
        timestamp: z.string(),
        version: z.string()
    })
});

async function main() {
    // Initialize transport with required parameters
    const transport = new StdioClientTransport({
        command: 'node',
        args: ['dist/server.js']
    });

    const client = new Client({
        name: "test-client",
        version: "0.1.0"
    }, {
        capabilities: {}
    });

    try {
        logger.info("Connecting to MCP server...");
        await client.connect(transport);
        logger.info("Connected to MCP server");

        // Test health check
        logger.info("Testing health check tool...");
        const healthResponse = await client.request({
            method: "tool/execute",
            params: {
                toolName: 'health-check',
                version: '0.1.0',
                arguments: {}
            }
        }, HealthCheckResponseSchema);

        logger.info("Health check results:", { health: healthResponse.result });

        // Test web search
        logger.info("Testing web search tool...");
        const searchResponse = await client.request({
            method: "tool/execute",
            params: {
                toolName: 'web-search',
                version: '0.1.0',
                arguments: {
                    query: "What are the latest developments in AI?",
                    saveTo: "local-research/ai-developments.md"
                }
            }
        }, WebSearchResponseSchema);

        logger.info("Web Search Results:", {
            results: searchResponse.result.searchResults,
            savedTo: searchResponse.result.savedToFile
        });

    } catch (error) {
        logger.error("Error during test:", {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
    } finally {
        logger.info("Closing client connection...");
        client.close();
    }
}

main().catch((error) => {
    logger.error("Fatal error:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
}); 