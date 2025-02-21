"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const web_search_js_1 = require("./capabilities/tools/web-search.js");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Starting MCP server...");
            const server = new index_js_1.Server({
                name: "cursor-tools-mcp-server",
                version: "0.1.0",
                description: "MCP server mimicking cursor-tools functionalities."
            }, {
                capabilities: {
                    resources: {}, // Resources will be defined here
                    tools: {
                        'web-search': web_search_js_1.webSearchTool
                    }
                }
            });
            const transport = new stdio_js_1.StdioServerTransport();
            console.log("Connecting to transport...");
            yield server.connect(transport);
            console.log("✅ MCP Server started using stdio transport.");
            console.log("Available tools:");
            console.log("  - web-search: Perform web searches using Perplexity AI");
        }
        catch (error) {
            console.error("❌ Server failed to start:", error);
            process.exit(1);
        }
    });
}
// Handle process termination
process.on('SIGINT', () => {
    console.log("\nShutting down MCP server...");
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log("\nShutting down MCP server...");
    process.exit(0);
});
// Start the server
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
