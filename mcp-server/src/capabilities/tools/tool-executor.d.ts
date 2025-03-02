import { z } from 'zod';
declare const ToolExecutorResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    result: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    error?: string | undefined;
    result?: any;
}, {
    success: boolean;
    error?: string | undefined;
    result?: any;
}>;
type ToolExecutorResponse = z.infer<typeof ToolExecutorResponseSchema>;
/**
 * Tool executor tool for the MCP server
 * This tool allows executing any registered tool by name
 */
export declare const toolExecutorTool: {
    name: string;
    version: string;
    description: string;
    execute(request: unknown): Promise<ToolExecutorResponse>;
    requestSchema: z.ZodObject<{
        tool: z.ZodString;
        request: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        tool: string;
        request?: any;
    }, {
        tool: string;
        request?: any;
    }>;
    responseSchema: z.ZodObject<{
        success: z.ZodBoolean;
        result: z.ZodOptional<z.ZodAny>;
        error: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        success: boolean;
        error?: string | undefined;
        result?: any;
    }, {
        success: boolean;
        error?: string | undefined;
        result?: any;
    }>;
};
export {};
