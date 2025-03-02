import { z } from 'zod';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();
// Define environment variable schema
const EnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    PERPLEXITY_API_KEY: z.string().optional(),
    GEMINI_API_KEY: z.string(),
    PORT: z.string().optional(),
    HOST: z.string().optional(),
    API_PORT: z.string().optional(),
    API_ENABLED: z.string().optional(),
    TOOLS_DIR: z.string().optional()
});
// Define API server configuration schema
const ApiConfigSchema = z.object({
    enabled: z.boolean().default(true),
    port: z.number().default(3001),
    host: z.string().default('localhost')
});
// Define storage configuration schema
const StorageConfigSchema = z.object({
    path: z.string().default('./storage'),
    researchDir: z.string().default('./local-research')
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
    api: ApiConfigSchema.optional(),
    storage: StorageConfigSchema.optional(),
    toolsDir: z.string().optional()
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
    geminiApiKey: env.GEMINI_API_KEY,
    // API server configuration
    api: {
        enabled: env.API_ENABLED ? env.API_ENABLED.toLowerCase() === 'true' : true,
        port: env.API_PORT ? parseInt(env.API_PORT, 10) : 3001,
        host: env.HOST || 'localhost'
    },
    // Storage configuration
    storage: {
        path: './storage',
        researchDir: './local-research'
    },
    // Tools directory
    toolsDir: env.TOOLS_DIR || './tools'
};
// Export environment variables
export const environment = env;
