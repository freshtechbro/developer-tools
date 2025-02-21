import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define environment variable schema
const EnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    PERPLEXITY_API_KEY: z.string(),
    PORT: z.string().optional(),
    HOST: z.string().optional()
});

// Define server configuration schema
export const ServerConfigSchema = z.object({
    name: z.string(),
    version: z.string(),
    description: z.string(),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    env: z.enum(['development', 'production', 'test']).default('development'),
    port: z.number().optional(),
    host: z.string().optional()
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
    perplexityApiKey: env.PERPLEXITY_API_KEY
};

// Export environment variables
export const environment = env; 