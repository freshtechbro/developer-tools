/**
 * Web search tool for MCP server
 * This is an adapter that maps the MCP server interface to the core web search tool
 */
export declare const webSearchTool: {
    name: string;
    version: string;
    description: string;
    execute: (request: unknown) => Promise<unknown>;
    requestSchema: {
        type: string;
        properties: {
            query: {
                type: string;
                description: string;
            };
            saveTo: {
                type: string;
                description: string;
            };
            format: {
                type: string;
                enum: string[];
                description: string;
                default: string;
            };
            maxTokens: {
                type: string;
                description: string;
                default: number;
            };
            includeSources: {
                type: string;
                description: string;
                default: boolean;
            };
        };
        required: string[];
    };
    responseSchema: {
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
                properties: {
                    model: {
                        type: string;
                        description: string;
                    };
                    tokenUsage: {
                        type: string;
                        properties: {
                            promptTokens: {
                                type: string;
                                description: string;
                            };
                            completionTokens: {
                                type: string;
                                description: string;
                            };
                            totalTokens: {
                                type: string;
                                description: string;
                            };
                        };
                    };
                    sources: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                title: {
                                    type: string;
                                    description: string;
                                };
                                url: {
                                    type: string;
                                    description: string;
                                };
                                snippet: {
                                    type: string;
                                    description: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        required: string[];
    };
};
