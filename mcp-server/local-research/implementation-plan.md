Packing repository using repomix...
Querying Gemini AI using gemini-2.0-flash-thinking-exp-01-21...
Based on the research document and best practices, here's a detailed step-by-step implementation plan for the MCP server:

## MCP Server Implementation Plan

This plan outlines the steps to implement an MCP server, focusing on best practices for transport layers, security measures, caching, rate limiting, testing, error handling, logging, and scalability, as researched in `local-research/mcp-implementation-research.md`.

**Phase 1: Project Setup and Core Structure**

1.  **Initialize Project**:
    *   Ensure Node.js and npm (or yarn/pnpm) are installed.
    *   Initialize a new npm project: `npm init -y`
    *   Initialize a TypeScript project: `tsc --init --rootDir src --outDir dist --module commonjs --esModuleInterop --strict --skipLibCheck` (Adjust `module` if ESM is preferred, and update `package.json` accordingly, as currently configured).
    *   Install core dependencies: `@modelcontextprotocol/sdk`, `dotenv`, `axios`, `zod`, `ts-node`, `typescript`.
        ```bash
        npm install @modelcontextprotocol/sdk dotenv axios zod ts-node typescript
        ```

2.  **Directory Structure Setup**:
    *   Create the following directory structure (as already present in the provided files, reinforcing good organization):
        ```
        mcp-server/
        ├── src/
        │   ├── capabilities/
        │   │   ├── resources/
        │   │   └── tools/
        │   ├── config/
        │   └── utils/
        ├── local-research/
        ├── dist/         (Output directory for compiled JavaScript)
        ├── package.json
        ├── tsconfig.json
        ```

3.  **Configuration Management**:
    *   Install `dotenv`: `npm install dotenv`
    *   Create a `.env` file in the root directory to store environment variables (e.g., `PERPLEXITY_API_KEY`).
    *   Configure `dotenv` to load environment variables in server and tool files (already implemented in `web-search.ts`).

4.  **Basic Server Structure**:
    *   Create `src/server.ts` (or `src/server.js` for JavaScript) as the main server entry point.
    *   Implement the basic server setup using `@modelcontextprotocol/sdk/server` (as in `src/server.ts`):
        ```typescript
        import { Server } from "@modelcontextprotocol/sdk/server/index.js";
        import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

        async function main() {
            try {
                console.log("Starting MCP server...");
                const server = new Server({
                    name: "your-mcp-server-name",
                    version: "0.1.0",
                    description: "Description of your MCP server."
                }, {
                    capabilities: {
                        resources: {},
                        tools: {}
                    }
                });
                const transport = new StdioServerTransport();
                await server.connect(transport);
                console.log("✅ MCP Server started using stdio transport.");
            } catch (error) {
                console.error("❌ Server failed to start:", error);
                process.exit(1);
            }
        }

        main().catch(console.error);
        ```

**Phase 2: Transport Layer Implementation (STDIO)**

1.  **STDIO Transport**:
    *   Utilize `StdioServerTransport` from `@modelcontextprotocol/sdk/server/stdio.js` for initial transport layer implementation. This is suitable for local development and simplifies initial setup as it uses standard input/output streams (as already implemented in `src/server.ts`).
    *   Ensure the server connects to the transport using `server.connect(transport)`.
    *   Verify basic communication by sending a simple request from a client (see Phase 5 for testing).

2.  **Future Transport Considerations (Research Point 1)**:
    *   **Layered Architecture**: Keep in mind the layered architecture principle for future transport implementations (client/server, session, transport layers).  The MCP SDK inherently supports this separation.
    *   **Alternative Transports**: For future enhancements, consider:
        *   **SSE (Server-Sent Events)** for HTTP-based communication if web-based clients are needed.
        *   **WebSockets** for persistent bidirectional communication if more interactive features are required.
        *   **TCP Sockets** for potentially higher performance in specific network environments if needed later.

**Phase 3: Capability Implementation - `web-search` Tool**

1.  **Implement `web-search` Tool (Research Point 4)**:
    *   Create `src/capabilities/tools/web-search.ts` (or `.js`).
    *   Implement the `webSearchTool` as defined in `src/capabilities/tools/web-search.ts`, leveraging the Perplexity AI API.
    *   **API Key Handling**: Ensure secure handling of `PERPLEXITY_API_KEY` using environment variables (as implemented).
    *   **Request and Response Schemas**: Utilize `requestSchema` and `responseSchema` to define and validate inputs and outputs using Zod (as implemented). This is crucial for input validation (Security Point 2.1).

2.  **Integrate Tool with Server**:
    *   Register the `webSearchTool` in the `tools` capability section of the `Server` constructor in `src/server.ts` (as implemented):
        ```typescript
        tools: {
            'web-search': webSearchTool
        }
        ```

**Phase 4: Security Measures Implementation (Research Point 2)**

1.  **Input Validation and Sanitization (Research Point 2.1)**:
    *   **Schema Validation**: Enforce input validation using the `requestSchema` defined for each tool. The MCP SDK handles schema validation automatically.
    *   **Data Sanitization**: If necessary for specific tool logic (though less critical for web search output), sanitize inputs to prevent injection attacks. For now, focus on robust schema validation.

2.  **API Key Security (Research Point 2.6)**:
    *   **Environment Variables**: Store `PERPLEXITY_API_KEY` and other sensitive credentials in environment variables, not directly in the code (as implemented).
    *   **`.gitignore`**: Ensure `.env` is added to `.gitignore` to prevent accidental commits of API keys to version control.

3.  **Rate Limiting (Research Point 3)**:
    *   **Basic Rate Limiting for Perplexity API**: Implement a basic rate limiting mechanism to avoid exceeding Perplexity AI API limits. A simple token bucket approach can be initially used within the `web-search` tool execution:
        ```typescript
        // Example (simplified token bucket - needs proper state management in a real scenario)
        let tokens = 100; // Initial tokens
        const replenishRate = 700/3600; // Tokens per second (700 per hour)

        async execute: async (request: WebSearchRequest): Promise<WebSearchResponse> => {
            // ... API key check ...
            if (tokens < 1) {
                throw new Error("Rate limit exceeded. Please try again later."); // Or implement queuing/delay
            }
            tokens -= 1;
            setTimeout(() => { tokens = Math.min(100, tokens + replenishRate * 1); }, 1000); // Replenish tokens
            // ... Perplexity API call ...
        }
        ```
        *   **More Advanced Rate Limiting**: For production, consider using a more robust rate limiting library or middleware, especially if you expose APIs to multiple users or services. Explore options like token bucket or sliding window algorithms with libraries that handle concurrency and storage.

4.  **Command Whitelisting and Flag Validation (Research Point 2.2) (Less relevant for this server but good to note for future CLI tools)**:
    *   If implementing tools that execute system commands in the future, use command whitelisting and flag validation to prevent command injection vulnerabilities. This is less applicable for the `web-search` tool but important for general security.

5.  **TLS Encryption and Access Controls (Research Point 2.5 & 2.7)**:
    *   **TLS**: If exposing the MCP server over a network (e.g., using HTTP transport), enforce TLS (HTTPS) for all API endpoints, especially for management interfaces. This is less relevant for stdio but critical for network deployments.
    *   **Access Controls**: Implement proper authentication and authorization mechanisms if the server needs to be accessed by authenticated users or services in the future.

**Phase 5: Testing (Research Point 4)**

1.  **Unit Tests**:
    *   Write unit tests for individual tools and utility functions to ensure they function correctly in isolation. Use a testing framework like Jest or Mocha if needed for more complex testing scenarios later. For now, basic testing through `test-client` is sufficient to start.

2.  **Integration Tests**:
    *   Create integration tests to verify the interaction between the MCP server and client. `src/test-client.ts` (and `.js`) serves as a basic integration test client.
    *   **Test `web-search` Tool**: The existing `src/test-client.ts` effectively tests the `web-search` tool by sending a request and validating the response against `WebSearchResponseSchema`. Expand this test client to cover more scenarios (e.g., error cases, different queries).
    *   **MCP Inspector (Research Point 4.1 & 4.4)**: Explore the MCP Inspector tool (if available and applicable to your SDK version) for more systematic testing of MCP capabilities and protocol compliance.

3.  **Testing Approaches (Research Point 4.3 & 4.4)**:
    *   **Core Features First**: Focus testing on core functionalities like tool execution and basic communication.
    *   **Edge Cases**: Gradually add tests for edge cases, error conditions, and boundary values for tool parameters.
    *   **Error Handling**: Specifically test error handling paths to ensure the server and tools gracefully handle errors and provide informative messages.
    *   **Performance Testing (Future)**: Consider basic performance testing later if performance becomes a concern, especially for API-intensive tools.

**Phase 6: Error Handling and Logging (Research Point 5)**

1.  **Structured Logging (Research Point 5.1)**:
    *   Implement structured logging using `console.log` for now, but plan to transition to a more robust logging library (like `winston` or `pino`) for production.
    *   Log in a consistent JSON format for easier parsing and analysis in the future if needed. Include context, timestamps, and log levels (info, warning, error).

2.  **Log Relevant Events (Research Point 5.5)**:
    *   Log server startup and shutdown events.
    *   Log tool execution requests, including tool name and parameters.
    *   Log errors and exceptions, including stack traces where appropriate (as done in `web-search.ts`).
    *   Log important resource access events if you add resource capabilities later.
    *   Consider logging performance metrics in the future if needed.

3.  **Server-Side Logging to `stderr` (Research Point 5.3)**:
    *   For stdio transport, logging errors and server-side events to `stderr` is a good practice for local transports. `console.error` naturally directs output to `stderr`.

4.  **Client Log Messages (Research Point 5.4) (Consider for future transports)**:
    *   For transports beyond stdio (like SSE or WebSockets), consider implementing the ability for the server to send log messages back to the client through MCP protocol mechanisms if client-side logging is desired. For stdio, client can observe server logs directly.

**Phase 7: Scalability Considerations (Research Point 6)**

1.  **Asynchronous Operations (Research Point 6.1)**:
    *   Utilize asynchronous operations (`async/await`) throughout the server and tool implementations to handle concurrent requests efficiently (already implemented in `web-search.ts` and server setup).

2.  **Connection Management (Research Point 6.2)**:
    *   The `@modelcontextprotocol/sdk` handles connection management for you in terms of MCP protocol. Ensure proper resource cleanup in your tool implementations if they manage external resources, though less critical for the current `web-search` tool.

3.  **Scalability Patterns (Research Point 6.6) (Future Considerations)**:
    *   **Load Balancing**: If you anticipate high request loads in the future and move beyond stdio transport, consider load balancing strategies to distribute requests across multiple server instances.
    *   **Horizontal Scaling**: Plan for horizontal scaling by designing the server to be stateless so you can easily add more server instances behind a load balancer as demand grows.
    *   **Resource Management and Monitoring (Research Point 6.3 & 6.5)**:  As you add more capabilities and complexity, monitor resource usage (CPU, memory, network) and implement efficient resource management practices in your tools and server.

**Phase 8: Documentation and Refinement**

1.  **Code Documentation**:
    *   Add comments to your code to explain the purpose of functions, classes, and complex logic.
    *   Generate API documentation using tools like TypeDoc if you intend to expose APIs beyond the MCP protocol itself.

2.  **README.md**:
    *   Create a `README.md` file in the project root to document:
        *   Project description and purpose.
        *   Setup instructions (environment variables, dependencies).
        *   How to run the server and test client.
        *   Available tools and their usage.
        *   Scalability and security considerations.

3.  **Continuous Refinement**:
    *   Continuously review and refine the implementation based on testing, feedback, and evolving requirements.
    *   Stay updated with best practices in MCP server development and security.

This detailed plan provides a roadmap for implementing your MCP server, incorporating research-backed best practices and focusing on security and scalability from the outset. Start with Phase 1 and progressively implement each phase, testing and refining as you go.