import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { webSearchTool } from './capabilities/tools/web-search.js';
import { config, ServerConfigSchema } from './config/index.js';
import { logger } from './utils/logger.js';
import { z } from 'zod';

// Define health check schema
const HealthCheckSchema = z.object({
    status: z.enum(['healthy', 'unhealthy']),
    uptime: z.number(),
    timestamp: z.string(),
    version: z.string()
});

// Define tool execution request schema
const ToolExecuteRequestSchema = z.object({
    method: z.literal('tool/execute'),
    params: z.object({
        toolName: z.string(),
        version: z.string(),
        arguments: z.record(z.unknown())
    })
});

// Define tool interface
interface Tool {
    name: string;
    version: string;
    description: string;
    execute: (request: unknown) => Promise<unknown>;
    requestSchema: z.ZodType;
    responseSchema: z.ZodType;
}

async function main() {
    try {
        logger.info("Starting MCP server...", { config });
        
        // Validate server configuration
        const validatedConfig = ServerConfigSchema.parse(config);

        // Create tools map
        const tools: Record<string, Tool> = {
            'web-search': webSearchTool,
            'health-check': {
                name: 'health-check',
                version: '0.1.0',
                description: 'Check server health status',
                execute: async () => {
                    const health = {
                        status: 'healthy',
                        uptime: process.uptime(),
                        timestamp: new Date().toISOString(),
                        version: validatedConfig.version
                    };
                    return HealthCheckSchema.parse(health);
                },
                requestSchema: z.object({}),
                responseSchema: HealthCheckSchema
            }
        };

        const server = new Server(validatedConfig, {
            capabilities: {
                resources: {}, // Resources will be defined here
                tools
            }
        });

        // Register tool execution handler
        server.setRequestHandler(ToolExecuteRequestSchema, async (request) => {
            const { toolName, version, arguments: args } = request.params;
            
            // Find the requested tool
            const tool = tools[toolName];
            if (!tool) {
                throw new Error(`Tool '${toolName}' not found`);
            }
            
            // Execute the tool
            return { result: await tool.execute(args) };
        });

        const transport = new StdioServerTransport();
        
        // Set up error handlers
        process.on('uncaughtException', (error) => {
            logger.error("Uncaught Exception", { error: error.message, stack: error.stack });
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error("Unhandled Rejection", { reason, promise });
            process.exit(1);
        });

        // Handle process termination
        process.on('SIGINT', () => {
            logger.info("Shutting down MCP server...");
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            logger.info("Shutting down MCP server...");
            process.exit(0);
        });
        
        logger.debug("Connecting to transport...");
        await server.connect(transport);
        logger.info("MCP Server started successfully", {
            transport: "stdio",
            tools: Object.keys(tools)
        });

    } catch (error) {
        logger.error("Server failed to start", { 
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        process.exit(1);
    }
}

// Start the server
main().catch((error) => {
    logger.error("Fatal error", { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
}); 