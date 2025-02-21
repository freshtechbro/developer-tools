"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.environment = exports.config = exports.ServerConfigSchema = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Define environment variable schema
const EnvSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: zod_1.z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    PERPLEXITY_API_KEY: zod_1.z.string(),
    PORT: zod_1.z.string().optional(),
    HOST: zod_1.z.string().optional()
});
// Define server configuration schema
exports.ServerConfigSchema = zod_1.z.object({
    name: zod_1.z.string(),
    version: zod_1.z.string(),
    description: zod_1.z.string(),
    logLevel: zod_1.z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    env: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    port: zod_1.z.number().optional(),
    host: zod_1.z.string().optional()
});
// Parse and validate environment variables
const env = EnvSchema.parse(process.env);
// Export validated configuration
exports.config = {
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
exports.environment = env;
