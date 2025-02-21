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
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/client/stdio.js");
const zod_1 = require("zod");
// Define response schema
const WebSearchResponseSchema = zod_1.z.object({
    result: zod_1.z.object({
        searchResults: zod_1.z.string(),
        savedToFile: zod_1.z.string().optional()
    })
});
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // Initialize transport with required parameters
        const transport = new stdio_js_1.StdioClientTransport({
            command: 'node',
            args: ['dist/server.js']
        });
        const client = new index_js_1.Client({
            name: "test-client",
            version: "0.1.0"
        }, {
            capabilities: {}
        });
        try {
            console.log("Connecting to MCP server...");
            yield client.connect(transport);
            console.log("✅ Connected to MCP server\n");
            // Test web search
            console.log("Testing web search tool...");
            const response = yield client.request({
                method: "tool/execute",
                params: {
                    toolName: 'web-search',
                    version: '0.1.0',
                    arguments: {
                        query: "What are the latest developments in AI?",
                        saveTo: "local-research/ai-developments.md"
                    }
                }
            }, WebSearchResponseSchema);
            console.log("\nWeb Search Results:");
            console.log("------------------");
            console.log(response.result.searchResults);
            if (response.result.savedToFile) {
                console.log(`\nResults saved to: ${response.result.savedToFile}`);
            }
        }
        catch (error) {
            console.error("❌ Error:", error);
        }
        finally {
            console.log("\nClosing client connection...");
            client.close();
        }
    });
}
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
