import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { webSearchTool } from './capabilities/tools/web-search.js';
import { commandInterceptorTool } from './capabilities/tools/command-interceptor.js';
import { toolExecutorTool } from './capabilities/tools/tool-executor.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { toolRegistry } from './tools/registry.js';
import { startApiServer } from './api/server.js';
import path from 'path';
import { fileURLToPath } from 'url';
// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function main() {
    try {
        logger.info("Starting MCP server...");
        // Log available API keys (masked for security)
        if (process.env.PERPLEXITY_API_KEY) {
            logger.info("Perplexity API key is available");
        }
        else {
            logger.warn("Perplexity API key is not set. Web search functionality will be limited.");
        }
        if (process.env.GEMINI_API_KEY) {
            logger.info("Gemini API key is available");
        }
        if (process.env.OPENAI_API_KEY) {
            logger.info("OpenAI API key is available");
        }
        // Load tools dynamically from the tools directory
        // This will be a relative path from the current file
        const toolsDir = path.resolve(__dirname, '../../tools');
        await toolRegistry.loadToolsFromDirectory(toolsDir);
        // Register built-in tools
        toolRegistry.register(webSearchTool);
        toolRegistry.register(commandInterceptorTool);
        toolRegistry.register(toolExecutorTool);
        // Create MCP server
        const server = new Server({
            name: "cursor-tools-mcp-server",
            version: "0.1.0",
            description: "MCP server with enhanced web search and command interception capabilities."
        }, {
            capabilities: {
                resources: {}, // Resources will be defined here
                tools: {
                    'web-search': webSearchTool,
                    'command-interceptor': commandInterceptorTool,
                    'tool-executor': toolExecutorTool
                }
            }
        });
        // Start the MCP server with stdio transport
        const transport = new StdioServerTransport();
        logger.info("Connecting to MCP transport...");
        await server.connect(transport);
        logger.info("✅ MCP Server started using stdio transport.");
        // List available tools
        logger.info("Available MCP tools:");
        logger.info("  - web-search: Enhanced web search with multiple providers");
        logger.info("  - command-interceptor: Intercept and process special commands from chat");
        logger.info("  - tool-executor: Execute any registered tool by name");
        // Start the HTTP API server if enabled in config
        if (config.api?.enabled !== false) {
            try {
                await startApiServer();
                logger.info("HTTP API server started successfully");
            }
            catch (apiError) {
                logger.error("Failed to start HTTP API server:", { error: apiError });
            }
        }
        else {
            logger.info("HTTP API server is disabled in the configuration");
        }
    }
    catch (error) {
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
