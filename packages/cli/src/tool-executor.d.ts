/**
 * Options for executing a tool
 */
interface ToolExecutionOptions {
    data?: string;
    file?: string;
    output?: string;
    server?: string;
}
/**
 * Execute a tool through the MCP server
 * @param toolName Name of the tool to execute
 * @param options Tool execution options
 * @returns The tool execution result
 */
export declare function execTool(toolName: string, options: ToolExecutionOptions): Promise<any>;
export {};
