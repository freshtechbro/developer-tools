export interface Tool {
    name: string;
    version: string;
    description: string;
    execute: (request: unknown) => Promise<unknown>;
    requestSchema?: unknown;
    responseSchema?: unknown;
}
export declare class ToolRegistry {
    private tools;
    /**
     * Register a tool with the registry
     * @param tool The tool to register
     */
    register(tool: Tool): void;
    /**
     * Get a tool by name
     * @param name The name of the tool to get
     * @returns The tool, or undefined if not found
     */
    getTool(name: string): Tool | undefined;
    /**
     * Get all registered tools
     * @returns All registered tools
     */
    getAllTools(): Record<string, Tool>;
    /**
     * Load tools from a directory
     * @param toolsDir The directory to load tools from
     */
    loadToolsFromDirectory(toolsDir: string): Promise<void>;
    /**
     * Execute a tool
     * @param name The name of the tool to execute
     * @param request The request to pass to the tool
     * @returns The result of the tool execution
     */
    executeTool(name: string, request: unknown): Promise<unknown>;
}
export declare const toolRegistry: ToolRegistry;
