/**
 * Command interceptor tool for MCP server
 * This tool intercepts special commands in chat messages and routes them to appropriate tools
 */
export declare const commandInterceptorTool: {
    name: string;
    version: string;
    description: string;
    execute: (request: unknown) => Promise<unknown>;
    requestSchema: {
        type: string;
        properties: {
            message: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    responseSchema: {
        oneOf: ({
            type: string;
            properties: {
                searchResults: {
                    type: string;
                    description: string;
                };
                savedToFile: {
                    type: string;
                    description: string;
                };
                metadata: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
            description?: undefined;
        } | {
            type: string;
            description: string;
            properties?: undefined;
            required?: undefined;
        })[];
    };
};
