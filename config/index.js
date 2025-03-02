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
    REST_API_PORT: z.string().optional(),
    HTTP_TRANSPORT_ENABLED: z.enum(['true', 'false']).default('false'),
    HTTP_TRANSPORT_PORT: z.string().optional(),
    HTTP_TRANSPORT_PATH: z.string().optional(),
    SSE_TRANSPORT_ENABLED: z.enum(['true', 'false']).default('false'),
    SSE_TRANSPORT_PORT: z.string().optional(),
    SSE_TRANSPORT_PATH: z.string().optional(),
    HTTPS_ENABLED: z.enum(['true', 'false']).default('false'),
    HTTPS_KEY_PATH: z.string().optional(),
    HTTPS_CERT_PATH: z.string().optional(),
    WEB_INTERFACE_ENABLED: z.enum(['true', 'false']).default('true'),
    WEB_INTERFACE_PORT: z.string().optional()
});
// Define REST API configuration schema
const RestApiConfigSchema = z.object({
    enabled: z.boolean().default(false),
    port: z.number().default(3000),
    host: z.string().default('localhost')
});
// Define HTTP transport configuration schema
const HttpTransportConfigSchema = z.object({
    enabled: z.boolean().default(false),
    port: z.number().default(3000),
    host: z.string().default('localhost'),
    path: z.string().default('/mcp')
});
// Define SSE transport configuration schema
const SseTransportConfigSchema = z.object({
    enabled: z.boolean().default(false),
    port: z.number().default(3001),
    host: z.string().default('localhost'),
    path: z.string().default('/mcp-sse')
});
// Define HTTPS configuration schema
const HttpsConfigSchema = z.object({
    enabled: z.boolean().default(false),
    keyPath: z.string().optional(),
    certPath: z.string().optional()
});
// Define Web Interface configuration schema
const WebInterfaceConfigSchema = z.object({
    enabled: z.boolean().default(true),
    port: z.number().default(3002)
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
    restApi: RestApiConfigSchema.optional(),
    httpTransport: HttpTransportConfigSchema.optional(),
    sseTransport: SseTransportConfigSchema.optional(),
    https: HttpsConfigSchema.optional(),
    webInterface: WebInterfaceConfigSchema.optional(),
    features: z.object({
        webSearch: z.boolean().default(true),
        repoAnalysis: z.boolean().default(true),
        browserAutomation: z.boolean().default(true),
        webInterface: z.boolean().default(true)
    }).optional()
});
// Parse and validate environment variables
const env = EnvSchema.parse(process.env);
// Log the environment variables for debugging
console.log('Loaded environment variables:', {
    REST_API_ENABLED: env.REST_API_ENABLED,
    HTTP_TRANSPORT_ENABLED: env.HTTP_TRANSPORT_ENABLED,
    SSE_TRANSPORT_ENABLED: env.SSE_TRANSPORT_ENABLED,
    WEB_INTERFACE_ENABLED: env.WEB_INTERFACE_ENABLED
});
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
    },
    httpTransport: {
        enabled: env.HTTP_TRANSPORT_ENABLED === 'true',
        port: env.HTTP_TRANSPORT_PORT ? parseInt(env.HTTP_TRANSPORT_PORT, 10) : 3001,
        host: env.HOST || 'localhost',
        path: env.HTTP_TRANSPORT_PATH || '/mcp'
    },
    sseTransport: {
        enabled: env.SSE_TRANSPORT_ENABLED === 'true',
        port: env.SSE_TRANSPORT_PORT ? parseInt(env.SSE_TRANSPORT_PORT, 10) : 3002,
        host: env.HOST || 'localhost',
        path: env.SSE_TRANSPORT_PATH || '/mcp-sse'
    },
    https: {
        enabled: env.HTTPS_ENABLED === 'true',
        keyPath: env.HTTPS_KEY_PATH,
        certPath: env.HTTPS_CERT_PATH
    },
    webInterface: {
        enabled: env.WEB_INTERFACE_ENABLED === 'true',
        port: env.WEB_INTERFACE_PORT ? parseInt(env.WEB_INTERFACE_PORT, 10) : 3003
    },
    features: {
        webSearch: true,
        repoAnalysis: true,
        browserAutomation: true,
        webInterface: env.WEB_INTERFACE_ENABLED === 'true'
    }
};
// Export environment variables
export const environment = env;
