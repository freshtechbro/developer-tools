/**
 * Options for starting the MCP server
 */
interface ServerOptions {
    port?: string;
    stdio?: boolean;
    api?: boolean;
}
/**
 * Start the MCP server
 * @param options Server options
 */
export declare function startMcpServer(options: ServerOptions): Promise<void>;
export {};
