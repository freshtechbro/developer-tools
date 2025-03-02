import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { z } from 'zod';
import { logger } from './utils/logger.js';
// Define response schemas
const WebSearchResponseSchema = z.object({
    result: z.object({
        searchResults: z.string(),
        savedToFile: z.string().optional()
    })
});
const RepoAnalysisResponseSchema = z.object({
    result: z.object({
        analysis: z.string(),
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
        logger.info("Health check response:", healthResponse);
        // Test web search
        logger.info("Testing web search tool...");
        const webSearchResponse = await client.request({
            method: "tool/execute",
            params: {
                toolName: 'web-search',
                version: '0.1.0',
                arguments: {
                    query: "What is MCP (Model Context Protocol)?",
                    saveToFile: true
                }
            }
        }, WebSearchResponseSchema);
        logger.info("Web search response:", webSearchResponse);
        // Test repository analysis
        logger.info("Testing repository analysis tool...");
        const repoAnalysisResponse = await client.request({
            method: "tool/execute",
            params: {
                toolName: 'repo-analysis',
                version: '0.1.0',
                arguments: {
                    query: "What is the architecture of this project?",
                    analysisType: "both",
                    maxDepth: 2
                }
            }
        }, RepoAnalysisResponseSchema);
        logger.info("Repository analysis response:", repoAnalysisResponse);
    }
    catch (error) {
        if (error instanceof Error) {
            logger.error("Error occurred", { error: error.message });
        }
        else {
            logger.error("Unknown error occurred", { error: String(error) });
        }
    }
    finally {
        client.close();
    }
}
main().catch((error) => {
    if (error instanceof Error) {
        logger.error("Fatal error occurred", { error: error.message });
    }
    else {
        logger.error("Unknown fatal error occurred", { error: String(error) });
    }
    process.exit(1);
});
