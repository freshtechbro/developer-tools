import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define environment variable schema
const EnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    PERPLEXITY_API_KEY: z.string().optional(),
    GOOGLE_API_KEY: z.string(),
    PORT: z.string().optional(),
    HOST: z.string().optional(),
    REST_API_ENABLED: z.enum(['true', 'false']).default('false'),
    REST_API_PORT: z.string().optional()
});

// Define REST API configuration schema
const RestApiConfigSchema = z.object({
    enabled: z.boolean().default(false),
    port: z.number().default(3000),
    host: z.string().default('localhost')
});

// Define server configuration schema
export const ServerConfigSchema = z.object({
    name: z.string(),
    version: z.string(),
    description: z.string(),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    env: z.enum(['development', 'production', 'test']).default('development'),
    port: z.number().optional(),
    host: z.string().optional(),
    restApi: RestApiConfigSchema.optional()
});

// Parse and validate environment variables
const env = EnvSchema.parse(process.env);

// Export validated configuration
export const config = {
    name: "cursor-tools-mcp-server",
    version: "0.1.0",
    description: "MCP server mimicking cursor-tools functionalities.",
    logLevel: env.LOG_LEVEL,
    env: env.NODE_ENV,
    port: env.PORT ? parseInt(env.PORT, 10) : undefined,
    host: env.HOST,
    perplexityApiKey: env.PERPLEXITY_API_KEY,
    googleApiKey: env.GOOGLE_API_KEY,
    restApi: {
        enabled: env.REST_API_ENABLED === 'true',
        port: env.REST_API_PORT ? parseInt(env.REST_API_PORT, 10) : 3000,
        host: env.HOST || 'localhost'
    }
};

// Export environment variables
export const environment = env; 