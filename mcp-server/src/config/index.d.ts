import { z } from 'zod';
export declare const ServerConfigSchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodString;
    description: z.ZodString;
    logLevel: z.ZodDefault<z.ZodEnum<["debug", "info", "warn", "error"]>>;
    env: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    port: z.ZodOptional<z.ZodNumber>;
    host: z.ZodOptional<z.ZodString>;
    api: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        port: z.ZodDefault<z.ZodNumber>;
        host: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        port: number;
        host: string;
    }, {
        enabled?: boolean | undefined;
        port?: number | undefined;
        host?: string | undefined;
    }>>;
    storage: z.ZodOptional<z.ZodObject<{
        path: z.ZodDefault<z.ZodString>;
        researchDir: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        researchDir: string;
    }, {
        path?: string | undefined;
        researchDir?: string | undefined;
    }>>;
    toolsDir: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    version: string;
    description: string;
    logLevel: "debug" | "info" | "warn" | "error";
    env: "development" | "production" | "test";
    port?: number | undefined;
    host?: string | undefined;
    api?: {
        enabled: boolean;
        port: number;
        host: string;
    } | undefined;
    storage?: {
        path: string;
        researchDir: string;
    } | undefined;
    toolsDir?: string | undefined;
}, {
    name: string;
    version: string;
    description: string;
    port?: number | undefined;
    host?: string | undefined;
    logLevel?: "debug" | "info" | "warn" | "error" | undefined;
    env?: "development" | "production" | "test" | undefined;
    api?: {
        enabled?: boolean | undefined;
        port?: number | undefined;
        host?: string | undefined;
    } | undefined;
    storage?: {
        path?: string | undefined;
        researchDir?: string | undefined;
    } | undefined;
    toolsDir?: string | undefined;
}>;
export declare const config: {
    name: string;
    version: string;
    description: string;
    logLevel: "debug" | "info" | "warn" | "error";
    env: "development" | "production" | "test";
    port: number | undefined;
    host: string | undefined;
    perplexityApiKey: string | undefined;
    geminiApiKey: string;
    api: {
        enabled: boolean;
        port: number;
        host: string;
    };
    storage: {
        path: string;
        researchDir: string;
    };
    toolsDir: string;
};
export declare const environment: {
    NODE_ENV: "development" | "production" | "test";
    LOG_LEVEL: "debug" | "info" | "warn" | "error";
    GEMINI_API_KEY: string;
    PERPLEXITY_API_KEY?: string | undefined;
    PORT?: string | undefined;
    HOST?: string | undefined;
    API_PORT?: string | undefined;
    API_ENABLED?: string | undefined;
    TOOLS_DIR?: string | undefined;
};
