Packing repository using repomix...
Querying Gemini AI using gemini-2.0-flash-thinking-exp-01-21...
Okay, based on all the research in `local-research/`, here's a comprehensive implementation plan for our MCP server, designed to be both beginner-friendly and powerful, drawing inspiration from Claude's MCP, popular servers, and best practices:

## MCP Server Implementation Plan: Beginner-Friendly & Powerful

**I. Project Goals & Principles:**

*   **Goal:** Build an MCP server that mirrors the core functionalities of `cursor-tools`, providing AI assistance for web search, repository context, GitHub information, and browser automation.
*   **Beginner-Friendliness:**  Prioritize ease of installation, setup, and initial use. Offer a smooth onboarding experience for developers new to MCP.
*   **Power & Flexibility:** Design an extensible and modular architecture that can be easily expanded with new resources, tools, and features. Ensure scalability and robustness for future growth.
*   **Best Practices:**  Incorporate security, versioning, error handling, logging, and documentation best practices throughout the development process.
*   **Iterative Development:** Adopt an iterative approach, starting with core features and progressively adding complexity and enhancements.

**II. Architectural Design:**

1.  **Client-Server Model:** Adhere to the standard MCP client-server architecture using `@modelcontextprotocol/sdk` (Node.js).
2.  **Transport Layer:**
    *   **Initial:** `stdio` (Standard Input/Output) for local development and beginner simplicity.
    *   **Future:** HTTP/SSE (Server-Sent Events) for remote access, scalability, and broader deployment scenarios.
3.  **Modular Design:**
    *   **Core Server:** Handles MCP protocol, request routing, and capability registration.
    *   **Capabilities:** Organized into `resources/` and `tools/` directories, each in its own module for maintainability and extensibility.
    *   **Schemas:**  `schemas/` directory to store JSON schemas for request and response validation, ensuring type safety and clear API contracts.
    *   **Configuration:**  `config/` directory for server configuration (API keys, settings), using environment variables for sensitive information.
4.  **Statelessness:**  Design server components to be as stateless as possible for improved scalability and simplified management.
5.  **Error Handling & Logging:** Implement robust error handling with MCP-compliant error responses. Utilize structured logging for debugging and monitoring.

**III. Implementation Phases & Steps:**

**Phase 1: Project Setup & Basic Server Core (Beginner-Focused)**

1.  **Step 1: Project Initialization:**
    *   Create project directory: `mkdir mcp-server && cd mcp-server`
    *   Initialize Node.js project: `npm init -y`
    *   Install MCP SDK: `npm install @modelcontextprotocol/sdk node-fetch` (for API interactions)

2.  **Step 2: Create Basic `server.js`:**
    ```javascript
    // server.js
    import { Server } from "@modelcontextprotocol/sdk/server/index.js";
    import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

    async function main() {
        const server = new Server({
            name: "cursor-tools-mcp-server",
            version: "0.1.0",
            description: "MCP server mimicking cursor-tools functionalities."
        }, {
            capabilities: {
                resources: {},
                tools: {}
            }
        });

        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.log("MCP Server started using stdio transport.");
    }

    main().catch(console.error);
    ```

3.  **Step 3: Run the Basic Server:**
    *   Execute: `node server.js`
    *   Verify output: "MCP Server started using stdio transport."

**Phase 2: Implement Web Search Tool (`cursor-tools web`)**

1.  **Step 4: Create `web-search.js` Tool Module:**
    *   Create directories: `mkdir -p capabilities/tools`
    *   Create file: `capabilities/tools/web-search.js`
    *   Implement `webSearchTool` (using Perplexity API - refer to `mcp-detailed-steps.md` and `cursor-tools-implementation.md` for code structure and API interaction).  Remember to use environment variables for `PERPLEXITY_API_KEY`.

2.  **Step 5: Register `web-search` Tool:**
    *   Modify `server.js` to import and register `webSearchTool` in `capabilities.tools`.

3.  **Step 6: Set Perplexity API Key:**
    *   Instruct users to obtain a Perplexity API key and set the `PERPLEXITY_API_KEY` environment variable.

4.  **Step 7: Test `web-search` Tool:**
    *   Create `test-client.js` (based on `mcp-detailed-steps.md`) to send `ExecuteToolRequest` for `web-search`.
    *   Run server in one terminal (`node server.js`), client in another (`node test-client.js`).
    *   Verify web search results are returned.

**Phase 3: Implement GitHub PRs Resource (`cursor-tools github pr`)**

1.  **Step 8: Create `github-pr.js` Resource Module:**
    *   Create directory: `mkdir capabilities/resources`
    *   Create file: `capabilities/resources/github-pr.js`
    *   Implement `githubPullRequestResource` (using GitHub API - refer to `mcp-detailed-steps.md` and `cursor-tools-implementation.md` for code structure and API interaction). Use environment variable for `GITHUB_TOKEN` (optional but recommended).

2.  **Step 9: Register `github-pr` Resource:**
    *   Modify `server.js` to import and register `githubPullRequestResource` in `capabilities.resources`.

3.  **Step 10: Set GitHub Token (Optional):**
    *   Instruct users on how to create a GitHub personal access token and set `GITHUB_TOKEN` for higher rate limits.

4.  **Step 11: Test `github-pr` Resource:**
    *   Modify `test-client.js` to test `ListResourcesRequest` and `ReadResourceRequest` for `github-pr` (refer to `mcp-detailed-steps.md`).
    *   Run client and server, verify PR list and details are retrieved.

**Phase 4: Implement Browser Open Tool (`cursor-tools browser open`)**

1.  **Step 12: Install Playwright:**
    *   Instruct users to install Playwright: `npm install playwright`

2.  **Step 13: Create `browser-open.js` Tool Module:**
    *   Create directory: `mkdir -p capabilities/tools/browser-automation`
    *   Create file: `capabilities/tools/browser-automation/browser-open.js`
    *   Implement `browserOpenTool` (using Playwright - refer to `mcp-detailed-steps.md` and `cursor-tools-implementation.md` for code structure and Playwright usage).

3.  **Step 14: Register `browser-open` Tool:**
    *   Modify `server.js` to import and register `browserOpenTool` in `capabilities.tools`.

4.  **Step 15: Test `browser-open` Tool:**
    *   Modify `test-client.js` to test `ExecuteToolRequest` for `browser-open` (refer to `mcp-detailed-steps.md`).
    *   Run client and server, verify browser automation and screenshot functionality.

**Phase 5:  Repository Context Tool (Simplified `cursor-tools repo`)**

1.  **Step 16: Create `repo-query.js` Tool Module:**
    *   Create file: `capabilities/tools/repo-query.js`
    *   Implement `repoQueryTool` (using Gemini API - refer to `mcp-detailed-steps.md` and `cursor-tools-implementation.md` for code structure and Gemini API interaction).  Initially, implement a *simplified* version without deep repository indexing, focusing on general code questions. Use environment variable for `GOOGLE_API_KEY`.

2.  **Step 17: Register `repo-query` Tool:**
    *   Modify `server.js` to import and register `repoQueryTool` in `capabilities.tools`.

3.  **Step 18: Set Google API Key:**
    *   Instruct users to obtain a Google Cloud API key with Gemini API access and set `GOOGLE_API_KEY` environment variable.

4.  **Step 19: Test `repo-query` Tool:**
    *   Modify `test-client.js` to test `ExecuteToolRequest` for `repo-query` (refer to `mcp-detailed-steps.md`).
    *   Run client and server, verify Gemini-powered code question answering.

**Phase 6: Documentation, Refinement & Best Practices Integration**

1.  **Step 20: Comprehensive Documentation (Beginner-Focused):**
    *   **README.md:** Create a detailed README.md with:
        *   Project description and goals.
        *   **Clear Installation Instructions:** Step-by-step guide using `npm install`, environment variable setup for API keys, and Playwright installation.
        *   **Quick Start Guide:**  Simple example of using `test-client.js` to interact with the server.
        *   **Capabilities Overview:** Explain the provided resources (`github-pr`) and tools (`web-search`, `browser-open`, `repo-query`).
        *   **Troubleshooting Guide:** Common issues and solutions.
        *   **Contribution Guide:** Encourage community contributions.
    *   **Code Comments:** Add clear and concise comments throughout the codebase.

2.  **Step 21: Implement Robust Error Handling:**
    *   Refine error handling in all resource and tool modules to return MCP-compliant error responses with descriptive messages.
    *   Use `try...catch` blocks and throw appropriate errors.

3.  **Step 22: Implement Structured Logging:**
    *   Integrate a logging library (e.g., `pino` or `winston`).
    *   Log requests, responses, errors, and important server events with appropriate log levels.
    *   Use JSON format for logs for easier analysis.

4.  **Step 23: Basic Input Validation:**
    *   Implement basic input validation in request handlers to check for required parameters and data types.
    *   Consider using schema validation from MCP SDK for more robust validation in the future.

5.  **Step 24: Testing Strategy Expansion:**
    *   Write basic unit tests for individual tool and resource handlers.
    *   Expand `test-client.js` to include more comprehensive integration tests for different scenarios and edge cases.

**Phase 7: Future Enhancements (Power & Flexibility)**

1.  **Step 25: HTTP/SSE Transport Implementation:**
    *   Add support for HTTP/SSE transport using `HttpServerTransport` or `SseServerTransport` from the MCP SDK.
    *   Set up an HTTP server (using Node.js `http` or `express`).
    *   Provide instructions on how to run the server with HTTP/SSE transport.

2.  **Step 26: Advanced Schema Validation:**
    *   Implement full schema validation using the MCP SDK's schema capabilities for all requests and responses.
    *   Define schemas in separate `.json` files in `schemas/` directory.

3.  **Step 27: Security Enhancements:**
    *   **TLS for HTTP/SSE:** Configure HTTPS for HTTP/SSE transport.
    *   **Authentication:** Implement a basic authentication mechanism (e.g., API keys) for remote access via HTTP/SSE.
    *   **Rate Limiting:**  Implement rate limiting middleware for HTTP/SSE transport to prevent abuse.

4.  **Step 28: Advanced Repository Context (Indexing):**
    *   Enhance `repo-query` tool with repository indexing for deeper context-aware answers.
    *   Explore code parsing libraries and potentially vector databases for efficient code indexing and semantic search (as discussed in `cursor-tools-implementation.md`).

5.  **Step 29: Implement Remaining `cursor-tools browser` Features:**
    *   Implement `browser-act`, `browser-observe`, and `browser-extract` tools, following the pattern of `browser-open`.

6.  **Step 30: Health Check Endpoint:**
    *   Implement a basic health check endpoint (e.g., `/healthz` for HTTP/SSE).

7.  **Step 31: Deployment Considerations Documentation:**
    *   Add a section in `README.md` on basic deployment considerations (Docker, cloud platforms).

**IV. Technology Stack:**

*   **Language:** JavaScript (Node.js)
*   **MCP SDK:** `@modelcontextprotocol/sdk` (Node.js)
*   **HTTP Client:** `node-fetch` (or `axios`)
*   **Browser Automation:** `playwright`
*   **AI APIs:** Perplexity AI API, Google Gemini API
*   **Logging:** (e.g., `pino`, `winston`)
*   **Testing:** (e.g., `jest`, `mocha`)

**V.  Beginner-Friendliness Features Summary:**

*   **`stdio` Transport First:** Simplifies initial setup and testing.
*   **Detailed Step-by-Step Guide:**  Phased implementation plan with granular steps.
*   **Clear Installation Instructions:**  Emphasis on npm, environment variables, and Playwright setup.
*   **Quick Start Example:** `test-client.js` for immediate interaction.
*   **Comprehensive README.md:**  Well-structured documentation with troubleshooting and examples.
*   **Modular Design:**  Allows for gradual learning and feature adoption.
*   **Simple Examples:** Start with basic resources and tools to illustrate core concepts.

**VI. Power & Flexibility Features Summary:**

*   **Extensible Architecture:** Modular design for easy addition of new capabilities.
*   **HTTP/SSE Transport Support:** Enables remote access and scalability.
*   **Schema Validation:** Ensures API contract and data integrity.
*   **Robust Error Handling & Logging:**  Production-ready server characteristics.
*   **Security Best Practices Integration:**  Protects server and data.
*   **Advanced Features Planned:** Repository indexing, full browser automation suite, health checks, deployment considerations.

This implementation plan provides a structured roadmap for building a beginner-friendly yet powerful MCP server. By following these phases and steps, and continuously referring to the research and best practices, we can create a valuable tool that effectively integrates AI assistance into development workflows. Remember to prioritize clear communication, documentation, and iterative development throughout the process.