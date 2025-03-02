import { z } from 'zod';
import { logger } from '../../utils/logger.js';
import { toolRegistry } from '../../tools/registry.js';
// Define the schema for tool execution requests
const ToolExecutorRequestSchema = z.object({
    tool: z.string().min(1, "Tool name cannot be empty"),
    request: z.any()
});
const ToolExecutorResponseSchema = z.object({
    success: z.boolean(),
    result: z.any().optional(),
    error: z.string().optional()
});
/**
 * Tool executor tool for the MCP server
 * This tool allows executing any registered tool by name
 */
export const toolExecutorTool = {
    name: 'tool-executor',
    version: '0.1.0',
    description: 'Executes any registered tool by name',
    async execute(request) {
        try {
            // Validate the request
            const validatedRequest = ToolExecutorRequestSchema.parse(request);
            logger.info(`Tool executor received request for tool: ${validatedRequest.tool}`);
            try {
                // Execute the requested tool
                const result = await toolRegistry.executeTool(validatedRequest.tool, validatedRequest.request);
                return {
                    success: true,
                    result
                };
            }
            catch (error) {
                logger.error(`Tool execution failed for ${validatedRequest.tool}:`, { error });
                return {
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                };
            }
        }
        catch (error) {
            logger.error("Tool executor request validation failed:", { error });
            return {
                success: false,
                error: error instanceof Error ? error.message : "Invalid request format"
            };
        }
    },
    requestSchema: ToolExecutorRequestSchema,
    responseSchema: ToolExecutorResponseSchema
};
