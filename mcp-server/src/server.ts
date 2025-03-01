import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { webSearchTool } from './capabilities/tools/web-search.js';
import { commandInterceptorTool } from './capabilities/tools/command-interceptor.js';
import { config, ServerConfigSchema } from './config/index.js';
import { logger } from './utils/logger.js';
import { z } from 'zod';

async function main() {
    try {
        logger.info("Starting MCP server...");
        
        // Log available API keys (masked for security)
        if (process.env.PERPLEXITY_API_KEY) {
            logger.info("Perplexity API key is available");
        } else {
            logger.warn("Perplexity API key is not set. Web search functionality will be limited.");
        }
        
        if (process.env.GEMINI_API_KEY) {
            logger.info("Gemini API key is available");
        }
        
        if (process.env.OPENAI_API_KEY) {
            logger.info("OpenAI API key is available");
        }
        
        const server = new Server({
            name: "cursor-tools-mcp-server",
            version: "0.1.0",
            description: "MCP server with enhanced web search and command interception capabilities."
        }, {
            capabilities: {
                resources: {}, // Resources will be defined here
                tools: {
                    'web-search': webSearchTool,
                    'command-interceptor': commandInterceptorTool
                }
            }
        });

        const transport = new StdioServerTransport();
        
        logger.info("Connecting to transport...");
        await server.connect(transport);
        logger.info("✅ MCP Server started using stdio transport.");
        logger.info("Available tools:");
        logger.info("  - web-search: Enhanced web search with multiple providers (Perplexity, Gemini, OpenAI)");
        logger.info("  - command-interceptor: Intercept and process special commands from chat");
        
        // Log configuration information
        logger.info(`Server configuration loaded from: ${process.env.NODE_ENV || 'development'} environment`);
        logger.info(`Storage path: ${config.storage?.path || './storage'}`);
        logger.info(`Research directory: ${config.storage?.researchDir || './local-research'}`);
        
        // Log default provider if configured
        if (config.apis?.defaultProvider) {
            logger.info(`Default search provider: ${config.apis.defaultProvider}`);
        } else {
            logger.info("Default search provider: perplexity");
        }

    } catch (error) {
        logger.error("❌ Server failed to start:", { error });
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGINT', () => {
    logger.info("Shutting down MCP server...");
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info("Shutting down MCP server...");
    process.exit(0);
});

// Start the server
main().catch((error) => {
    logger.error("Fatal error:", { error });
    process.exit(1);
}); 