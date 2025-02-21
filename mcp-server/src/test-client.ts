import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { z } from 'zod';
import { spawn } from 'child_process';
import { logger } from './utils/logger.js';
import { config } from './config/index.js';

// Define response schema
const WebSearchResponseSchema = z.object({
    result: z.object({
        searchResults: z.string(),
        savedToFile: z.string().optional()
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
        console.log("Connecting to MCP server...");
        await client.connect(transport);
        console.log("✅ Connected to MCP server\n");

        // Test web search
        console.log("Testing web search tool...");
        const response = await client.request({
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

        console.log("\nWeb Search Results:");
        console.log("------------------");
        console.log(response.result.searchResults);

        if (response.result.savedToFile) {
            console.log(`\nResults saved to: ${response.result.savedToFile}`);
        }

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        console.log("\nClosing client connection...");
        client.close();
    }
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
}); 