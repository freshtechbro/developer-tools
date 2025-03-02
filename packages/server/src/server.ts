import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { webSearchTool } from './capabilities/tools/web-search.js';
import { repoAnalysisTool } from './capabilities/tools/repo-analysis.js';
import { browserAutomationTool } from './capabilities/tools/browser-automation.js';
import { config, ServerConfigSchema } from './config/index.js';
import { logger } from './utils/logger.js';
import { z } from 'zod';
import express from 'express';
import cors from 'cors';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { searchHistoryRoutes } from './routes/search-history.routes.js';
import { searchHistoryResource } from './resources/search-history.resource.js';
import { githubPrResource } from './resources/github-pr.resource.js';
import { createWebInterface } from './web-interface.js';
import { TransportFactory, TransportType } from './transports/factory.js';

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

        // Initialize resources
        await searchHistoryResource.initialize();
        await githubPrResource.initialize();

        // Create tools map
        const tools: Record<string, Tool> = {
            'web-search': webSearchTool,
            'repo-analysis': repoAnalysisTool,
            'browser-automation': browserAutomationTool,
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

        // Create MCP server - Fixed constructor with proper format
        const server = new Server({
            name: validatedConfig.name,
            version: validatedConfig.version,
            description: validatedConfig.description,
            tools
        }, {
            capabilities: {
                protocol: {
                    version: '0.1.0',
                    name: 'jsonrpc'
                }
            }
        });

        // Determine transport type
        let transports = [];
        const host = validatedConfig.host || 'localhost';

        // ALWAYS create Express app for REST API (regardless of config)
        const app = express();
        app.use(cors());
        app.use(express.json());

        // Add search history routes
        app.use('/api/search-history', searchHistoryRoutes);

        // Add health check endpoint
        app.get('/health', (req, res) => {
            const health = {
                status: 'healthy',
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                version: validatedConfig.version
            };
            res.json(health);
        });

        // Set up HTTP server (no HTTPS for now)
        const http = await import('http');
        const httpServer = http.createServer(app);

        // Start the REST API server
        const restApiPort = validatedConfig.restApi?.port || 3000;
        httpServer.listen(restApiPort, host, () => {
            logger.info(`REST API server listening on ${host}:${restApiPort}`);
        });

        // Create HTTP transport
        const httpTransportPort = validatedConfig.httpTransport?.port || 3001;
        const httpTransportPath = validatedConfig.httpTransport?.path || '/mcp';
        
        const httpTransport = TransportFactory.createTransport({
            type: TransportType.HTTP,
            port: httpTransportPort,
            path: httpTransportPath,
            host
        });
        
        transports.push(httpTransport.transport);

        // Create SSE transport
        const sseTransportPort = validatedConfig.sseTransport?.port || 3002;
        const sseTransportPath = validatedConfig.sseTransport?.path || '/mcp-sse';
        
        const sseTransport = TransportFactory.createTransport({
            type: TransportType.SSE,
            port: sseTransportPort,
            path: sseTransportPath,
            host
        });
        
        transports.push(sseTransport.transport);

        // Set up error handlers
        process.on('uncaughtException', (error) => {
            logger.error("Uncaught exception", { error: error.message, stack: error.stack });
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error("Unhandled rejection", { reason });
            process.exit(1);
        });

        // Handle termination
        process.on('SIGINT', async () => {
            logger.info("Shutting down server...");
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            logger.info("Shutting down server...");
            process.exit(0);
        });

        // Initialize and connect to transports
        logger.debug("Connecting to transports...");
        if (transports.length > 0) {
            // Connect to all transports
            for (const transport of transports) {
                await server.connect(transport);
                logger.info(`MCP server connected to ${transport.constructor.name}`);
            }
            
            logger.info(`Enabled features: ${Object.keys(config.features || {}).filter(key => (config.features || {})[key as keyof typeof config.features]).join(', ') || 'web-search, repo-analysis'}`);

            // Always start the web interface
            const webInterfacePort = validatedConfig.webInterface?.port || 3003;
            createWebInterface(webInterfacePort);
            logger.info(`Web interface started on port ${webInterfacePort}`);
        } else {
            throw new Error("No transport configured");
        }

    } catch (error) {
        logger.error("Server failed to start", { 
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        process.exit(1);
    }
}

// Start the server
main(); 