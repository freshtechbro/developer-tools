Packing repository using repomix...
Querying Gemini AI using gemini-2.0-flash-thinking-exp-01-21...
Okay, here is a detailed, step-by-step implementation plan for building the MCP server with `cursor-tools` features. This plan breaks down the process into the smallest possible steps to ensure clarity and ease of implementation, especially for beginners.

**Phase 1: Project Setup and Basic Server Structure**

**Step 1: Create Project Directory**

1.  Open your terminal.
2.  Navigate to the directory where you want to create your project.
3.  Create a new directory for your MCP server:
    ```bash
    mkdir mcp-server
    cd mcp-server
    ```

**Step 2: Initialize Node.js Project**

1.  Inside the `mcp-server` directory, initialize a new Node.js project using npm:
    ```bash
    npm init -y
    ```
    This will create a `package.json` file with default settings.

**Step 3: Install MCP SDK and Core Dependencies**

1.  Install the `@modelcontextprotocol/sdk` which is essential for building MCP servers. We'll also install `node-fetch` for making HTTP requests (needed for web search and potentially GitHub API).
    ```bash
    npm install @modelcontextprotocol/sdk node-fetch
    ```

**Step 4: Create `server.js` - Basic Server Structure**

1.  Create a new file named `server.js` in your project root.
2.  Add the following basic server structure to `server.js`:

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
                resources: {}, // Resources will be defined here
                tools: {}      // Tools will be defined here
            }
        });

        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.log("MCP Server started using stdio transport.");
    }

    main().catch(console.error);
    ```

**Step 5: Run the Basic Server**

1.  In your terminal, run the server:
    ```bash
    node server.js
    ```
    You should see the output: `MCP Server started using stdio transport.` This confirms your basic server setup is working. Press `Ctrl+C` to stop the server.

**Phase 2: Implement Web Search Tool (`cursor-tools web`)**

**Step 6: Install Perplexity AI API Client (or use `node-fetch` directly)**

1.  For this example, we'll use `node-fetch` directly for simplicity to interact with Perplexity AI. If a dedicated Perplexity Node.js SDK becomes available, you could consider using it later.

**Step 7: Create `web-search.js` Tool Module**

1.  Create a new directory `capabilities` in your project root.
2.  Inside `capabilities`, create a directory `tools`.
3.  Inside `tools`, create a file named `web-search.js`.
4.  Add the following code to `capabilities/tools/web-search.js`:

    ```javascript
    // capabilities/tools/web-search.js
    import fetch from 'node-fetch';

    const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"; // Replace with actual API endpoint if different
    const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY; // Load API key from environment variable

    export const webSearchTool = {
        name: 'web-search',
        version: '0.1.0',
        description: 'Performs a web search using Perplexity AI.',
        execute: async (request) => {
            if (!PERPLEXITY_API_KEY) {
                throw new Error("Perplexity API key is not set in environment variables (PERPLEXITY_API_KEY)");
            }
            const { query } = request;
            if (!query) {
                throw new Error("Search query is required.");
            }

            try {
                const response = await fetch(PERPLEXITY_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "pplx-7b-online", // Or another suitable Perplexity model
                        messages: [{ role: "user", content: query }]
                    })
                });

                if (!response.ok) {
                    const errorDetails = await response.text();
                    throw new Error(`Perplexity API request failed: ${response.status} - ${errorDetails}`);
                }

                const data = await response.json();
                const searchResults = data.choices[0]?.message?.content || "No results found."; // Extract result from API response

                return {
                    searchResults: searchResults
                };

            } catch (error) {
                console.error("Error during web search:", error);
                throw new Error(`Web search failed: ${error.message}`);
            }
        },
        requestSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'The search query.' }
            },
            required: ['query']
        },
        responseSchema: {
            type: 'object',
            properties: {
                searchResults: { type: 'string', description: 'Web search results.' }
            },
            required: ['searchResults']
        }
    };
    ```

**Step 8: Register `web-search` Tool in `server.js`**

1.  Open `server.js` and modify the `capabilities.tools` section and import the `webSearchTool`:

    ```javascript
    // server.js
    import { Server } from "@modelcontextprotocol/sdk/server/index.js";
    import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
    import { webSearchTool } from './capabilities/tools/web-search.js'; // Import the web search tool

    async function main() {
        const server = new Server({
            name: "cursor-tools-mcp-server",
            version: "0.1.0",
            description: "MCP server mimicking cursor-tools functionalities."
        }, {
            capabilities: {
                resources: {},
                tools: {
                    'web-search': webSearchTool, // Register the web search tool
                }
            }
        });

        // ... (rest of server.js remains the same) ...
    }

    main().catch(console.error);
    ```

**Step 9: Set Perplexity API Key**

1.  You need a Perplexity API key to use their API. If you don't have one, sign up at [https://developer.perplexity.ai/](https://developer.perplexity.ai/).
2.  Set the API key as an environment variable named `PERPLEXITY_API_KEY`. How you set environment variables depends on your operating system:
    *   **Linux/macOS:**
        ```bash
        export PERPLEXITY_API_KEY="your_perplexity_api_key_here"
        ```
    *   **Windows (Command Prompt):**
        ```cmd
        set PERPLEXITY_API_KEY=your_perplexity_api_key_here
        ```
    *   **Windows (PowerShell):**
        ```powershell
        $env:PERPLEXITY_API_KEY="your_perplexity_api_key_here"
        ```
    *(Replace `your_perplexity_api_key_here` with your actual API key.)*

**Step 10: Test the `web-search` Tool**

1.  Start your MCP server in the terminal:
    ```bash
    node server.js
    ```
2.  To test the `web-search` tool, you'll need an MCP client. For a quick test, you can use a simple Node.js script to act as a client and send an `ExecuteToolRequest`. Create a new file `test-client.js` in your project root:

    ```javascript
    // test-client.js
    import { Client } from "@modelcontextprotocol/sdk/client/index.js";
    import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

    async function main() {
        const transport = new StdioClientTransport();
        const client = new Client();
        await client.connect(transport);

        try {
            const response = await client.executeTool({
                toolName: 'web-search',
                version: '0.1.0',
                arguments: {
                    query: "latest news on AI" // Your search query
                }
            });

            console.log("Web Search Results:\n", response.tool_response.searchResults);

        } catch (error) {
            console.error("Error executing web-search tool:", error);
        } finally {
            client.close();
        }
    }

    main().catch(console.error);
    ```

3.  Run the test client in a *separate* terminal window (while your server is running in the first terminal):
    ```bash
    node test-client.js
    ```
    You should see web search results from Perplexity AI printed in your client terminal. If you encounter errors, check your API key, network connection, and server logs for details.

**Phase 3: Implement Repository Context Tool (`cursor-tools repo`) (Simplified)**

For this initial implementation, we'll create a simplified `repo-query` tool that uses Gemini API for general code-related questions *without* deep repository context indexing. We'll add basic functionality and can enhance it later.

**Step 11: Install Google Gemini API Client (or use `node-fetch` directly)**

1.  Similar to Perplexity, we'll use `node-fetch` for simplicity to interact with the Gemini API. You might consider using a dedicated Google API client library in a more advanced setup.

**Step 12: Create `repo-query.js` Tool Module**

1.  Inside `capabilities/tools`, create a new file named `repo-query.js`.
2.  Add the following code to `capabilities/tools/repo-query.js`:

    ```javascript
    // capabilities/tools/repo-query.js
    import fetch from 'node-fetch';

    const GOOGLE_GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"; // Gemini Pro API endpoint
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; // Load Google API key from environment variable

    export const repoQueryTool = {
        name: 'repo-query',
        version: '0.1.0',
        description: 'Answers questions about the repository using Google Gemini (simplified).',
        execute: async (request) => {
            if (!GOOGLE_API_KEY) {
                throw new Error("Google API key is not set in environment variables (GOOGLE_API_KEY)");
            }
            const { query } = request;
            if (!query) {
                throw new Error("Repository query is required.");
            }

            try {
                const response = await fetch(`${GOOGLE_GEMINI_API_URL}?key=${GOOGLE_API_KEY}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{ role: "user", parts: [{ text: query }] }],
                    })
                });

                if (!response.ok) {
                    const errorDetails = await response.text();
                    throw new Error(`Google Gemini API request failed: ${response.status} - ${errorDetails}`);
                }

                const data = await response.json();
                const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "No answer found.";

                return {
                    answer: answer
                };

            } catch (error) {
                console.error("Error during repository query:", error);
                throw new Error(`Repository query failed: ${error.message}`);
            }
        },
        requestSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Question about the repository.' }
            },
            required: ['query']
        },
        responseSchema: {
            type: 'object',
            properties: {
                answer: { type: 'string', description: 'Context-aware answer from Gemini.' }
            },
            required: ['answer']
        }
    };
    ```

**Step 13: Register `repo-query` Tool in `server.js`**

1.  Open `server.js` and import and register the `repoQueryTool`:

    ```javascript
    // server.js
    // ... other imports ...
    import { webSearchTool } from './capabilities/tools/web-search.js';
    import { repoQueryTool } from './capabilities/tools/repo-query.js'; // Import repo query tool

    async function main() {
        // ... server setup ...
            capabilities: {
                resources: {},
                tools: {
                    'web-search': webSearchTool,
                    'repo-query': repoQueryTool, // Register repo query tool
                }
            }
        // ... rest of server.js ...
    }

    main().catch(console.error);
    ```

**Step 14: Set Google API Key**

1.  You need a Google Cloud API key with access to the Gemini API. If you don't have one, you'll need to set up a Google Cloud project and enable the Gemini API. Instructions can be found in Google Cloud documentation.
2.  Set your Google API key as an environment variable named `GOOGLE_API_KEY`:
    *   **Linux/macOS:** `export GOOGLE_API_KEY="your_google_api_key_here"`
    *   **Windows (Command Prompt):** `set GOOGLE_API_KEY=your_google_api_key_here`
    *   **Windows (PowerShell):** `$env:GOOGLE_API_KEY="your_google_api_key_here"`
    *(Replace `your_google_api_key_here` with your actual Google API key.)*

**Step 15: Test the `repo-query` Tool**

1.  Ensure your MCP server is running (`node server.js`).
2.  Modify your `test-client.js` to test `repo-query`:

    ```javascript
    // test-client.js
    // ... imports ...

    async function main() {
        // ... transport and client setup ...

        try {
            // ... web-search test (you can keep it or comment out) ...

            const repoQueryResponse = await client.executeTool({
                toolName: 'repo-query',
                version: '0.1.0',
                arguments: {
                    query: "Explain the basic structure of a Node.js project." // Your repo question
                }
            });

            console.log("\nRepository Query Answer:\n", repoQueryResponse.tool_response.answer);

        } catch (error) {
            console.error("Error executing repo-query tool:", error);
        } finally {
            client.close();
        }
    }

    main().catch(console.error);
    ```

3.  Run the modified `test-client.js` (`node test-client.js`). You should see an answer from Gemini related to your query about a Node.js project.

**Phase 4: Implement GitHub PRs Resource (`cursor-tools github pr`)**

**Step 16: Create `github-pr.js` Resource Module**

1.  Create a new directory `resources` inside `capabilities` directory.
2.  Inside `resources`, create a file named `github-pr.js`.
3.  Add the following code to `capabilities/resources/github-pr.js`:

    ```javascript
    // capabilities/resources/github-pr.js
    import fetch from 'node-fetch';

    const GITHUB_API_BASE_URL = "https://api.github.com";
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Optional, but recommended for higher rate limits

    export const githubPullRequestResource = {
        name: 'github-pr',
        version: '0.1.0',
        description: 'Provides information about GitHub Pull Requests.',
        list: async (request) => {
            const { owner, repo } = request;
            if (!owner || !repo) {
                throw new Error("GitHub repository owner and name are required.");
            }

            const apiUrl = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/pulls?state=open`; // Get open PRs by default
            const headers = GITHUB_TOKEN ? { 'Authorization': `token ${GITHUB_TOKEN}` } : {};

            try {
                const response = await fetch(apiUrl, { headers });
                if (!response.ok) {
                    const errorDetails = await response.json();
                    throw new Error(`GitHub API request failed: ${response.status} - ${JSON.stringify(errorDetails)}`);
                }
                const prs = await response.json();
                const resourceList = prs.map(pr => ({
                    uri: `github-pr://${owner}/${repo}/${pr.number}`, // Construct URI
                    title: pr.title,
                    number: pr.number,
                    url: pr.html_url
                }));

                return { resources: resourceList };

            } catch (error) {
                console.error("Error fetching GitHub PRs:", error);
                throw new Error(`Failed to fetch GitHub PRs: ${error.message}`);
            }
        },
        read: async (request) => {
            const { uri } = request; // e.g., "github-pr://owner/repo/123"
            const parts = uri.substring(9).split('/'); // Remove "github-pr://" and split
            if (parts.length !== 3) {
                throw new Error("Invalid GitHub PR URI format. Expected format: github-pr://owner/repo/number");
            }
            const owner = parts[0];
            const repo = parts[1];
            const prNumber = parts[2];

            const apiUrl = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/pulls/${prNumber}`;
            const headers = GITHUB_TOKEN ? { 'Authorization': `token ${GITHUB_TOKEN}` } : {};

            try {
                const response = await fetch(apiUrl, { headers });
                if (!response.ok) {
                    const errorDetails = await response.json();
                    throw new Error(`GitHub API request failed: ${response.status} - ${JSON.stringify(errorDetails)}`);
                }
                const prDetails = await response.json();
                const resource = {
                    uri: `github-pr://${owner}/${repo}/${prNumber}`,
                    title: prDetails.title,
                    number: prDetails.number,
                    url: prDetails.html_url,
                    body: prDetails.body, // PR description
                    author: prDetails.user.login,
                    author_url: prDetails.user.html_url,
                    state: prDetails.state, // open, closed
                    created_at: prDetails.created_at,
                    updated_at: prDetails.updated_at
                };
                return { resource };

            } catch (error) {
                console.error("Error fetching GitHub PR details:", error);
                throw new Error(`Failed to fetch GitHub PR details: ${error.message}`);
            }
        },
        listRequestSchema: { // Schema for list capability request
            type: 'object',
            properties: {
                owner: { type: 'string', description: 'GitHub repository owner (username or organization).' },
                repo: { type: 'string', description: 'GitHub repository name.' }
            },
            required: ['owner', 'repo']
        },
        listResponseSchema: { // Schema for list capability response
            type: 'object',
            properties: {
                resources: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            uri: { type: 'string', description: 'Unique URI for the GitHub PR resource.' },
                            title: { type: 'string', description: 'Title of the Pull Request.' },
                            number: { type: 'number', description: 'Pull Request number.' },
                            url: { type: 'string', description: 'URL to the Pull Request on GitHub.' }
                        },
                        required: ['uri', 'title', 'number', 'url']
                    }
                }
            },
            required: ['resources']
        },
        readRequestSchema: { // Schema for read capability request
            type: 'object',
            properties: {
                uri: { type: 'string', description: 'URI of the GitHub PR resource to read (e.g., github-pr://owner/repo/number).' }
            },
            required: ['uri']
        },
        readResponseSchema: { // Schema for read capability response
            type: 'object',
            properties: {
                resource: {
                    type: 'object',
                    properties: {
                        uri: { type: 'string' },
                        title: { type: 'string' },
                        number: { type: 'number' },
                        url: { type: 'string' },
                        body: { type: 'string', description: 'Pull Request description.' },
                        author: { type: 'string' },
                        author_url: { type: 'string' },
                        state: { type: 'string' },
                        created_at: { type: 'string' },
                        updated_at: { type: 'string' }
                    },
                    required: ['uri', 'title', 'number', 'url', 'body', 'author', 'author_url', 'state', 'created_at', 'updated_at']
                }
            },
            required: ['resource']
        }
    };
    ```

**Step 17: Register `github-pr` Resource in `server.js`**

1.  Open `server.js` and import and register the `githubPullRequestResource`:

    ```javascript
    // server.js
    // ... other imports ...
    import { webSearchTool } from './capabilities/tools/web-search.js';
    import { repoQueryTool } from './capabilities/tools/repo-query.js';
    import { githubPullRequestResource } from './capabilities/resources/github-pr.js'; // Import GitHub PR resource

    async function main() {
        // ... server setup ...
            capabilities: {
                resources: {
                    'github-pr': githubPullRequestResource, // Register GitHub PR resource
                },
                tools: {
                    'web-search': webSearchTool,
                    'repo-query': repoQueryTool,
                }
            }
        // ... rest of server.js ...
    }

    main().catch(console.error);
    ```

**Step 18: Set GitHub Token (Optional but Recommended)**

1.  For unauthenticated requests to the GitHub API, you are subject to rate limits. To increase your rate limit, you can create a personal access token on GitHub (no specific scopes needed for public repos).
2.  Set your GitHub token as an environment variable named `GITHUB_TOKEN`:
    *   **Linux/macOS:** `export GITHUB_TOKEN="your_github_token_here"`
    *   **Windows (Command Prompt):** `set GITHUB_TOKEN=your_github_token_here`
    *   **Windows (PowerShell):** `$env:GITHUB_TOKEN="your_github_token_here"`
    *(Replace `your_github_token_here` with your actual GitHub token, or leave it unset for lower rate limits.)*

**Step 19: Test the `github-pr` Resource**

1.  Ensure your MCP server is running (`node server.js`).
2.  Modify your `test-client.js` to test `github-pr` resource's `list` and `read` capabilities:

    ```javascript
    // test-client.js
    // ... imports ...

    async function main() {
        // ... transport and client setup ...

        try {
            // ... web-search and repo-query tests (you can keep them or comment out) ...

            console.log("\n--- GitHub PRs List ---");
            const prListResponse = await client.listResources({
                resourceName: 'github-pr',
                version: '0.1.0',
                arguments: {
                    owner: "nodejs", // Example: Node.js organization
                    repo: "node"     // Example: Node.js repository
                }
            });
            console.log("Open PRs in nodejs/node:\n", prListResponse.resource_list.resources.map(r => `${r.title} (${r.uri})`).join('\n'));

            if (prListResponse.resource_list.resources.length > 0) {
                const firstPrUri = prListResponse.resource_list.resources[0].uri;
                console.log(`\n--- GitHub PR Details for ${firstPrUri} ---`);
                const prDetailsResponse = await client.readResource({
                    resourceUri: firstPrUri
                });
                const pr = prDetailsResponse.resource_response.resource;
                console.log("PR Details:\n", `Title: ${pr.title}\nURL: ${pr.url}\nAuthor: ${pr.author}\nState: ${pr.state}\nDescription (truncated):\n${pr.body?.substring(0, 200)}...`);
            }

        } catch (error) {
            console.error("Error interacting with github-pr resource:", error);
        } finally {
            client.close();
        }
    }

    main().catch(console.error);
    ```

3.  Run the modified `test-client.js` (`node test-client.js`). You should see a list of open pull requests for the `nodejs/node` repository and details of the first PR listed.

**Phase 5: Implement Browser Open Tool (`cursor-tools browser open`)**

**Step 20: Install Playwright**

1.  If you haven't already, install Playwright which is needed for browser automation:
    ```bash
    npm install playwright
    ```

**Step 21: Create `browser-open.js` Tool Module**

1.  Inside `capabilities/tools/browser-automation`, create a new directory named `browser-automation` (if it doesn't exist already).
2.  Inside `browser-automation`, create a file named `browser-open.js`.
3.  Add the following code to `capabilities/tools/browser-automation/browser-open.js`:

    ```javascript
    // capabilities/tools/browser-automation/browser-open.js
    import playwright from 'playwright';
    import fs from 'node:fs/promises';
    import path from 'node:path';

    export const browserOpenTool = {
        name: 'browser-open',
        version: '0.1.0',
        description: 'Opens a URL in a browser and captures page content and metadata.',
        execute: async (request) => {
            const { url, html, console: captureConsole, network, screenshot, timeout, viewport, headless } = request;
            if (!url) {
                throw new Error("URL is required for browser-open tool.");
            }

            const browserType = 'chromium'; // Or 'firefox', 'webkit' if needed, Chromium is default for cursor-tools
            const browser = await playwright[browserType].launch({ headless: headless !== false }); // Default headless: true
            const page = await browser.newPage({ viewport: viewport ? parseViewport(viewport) : undefined });
            let consoleLogs = [];
            let networkActivity = [];
            let screenshotPath = null;
            let htmlContent = null;

            if (captureConsole !== false) { // Capture console logs by default
                page.on('console', msg => consoleLogs.push(`${msg.type().toUpperCase()} ${msg.text()}`));
            }
            if (network !== false) { // Capture network activity by default
                page.on('requestfinished', req => networkActivity.push({
                    url: req.url(),
                    method: req.method(),
                    status: req.response()?.status(),
                    // ... you can add more details if needed, but keep it concise for now
                }));
            }

            try {
                await page.goto(url, { timeout: timeout || 30000 }); // Default timeout: 30 seconds

                if (screenshot) {
                    screenshotPath = path.resolve(screenshot); // Ensure absolute path or relative to server working dir
                    await page.screenshot({ path: screenshotPath, fullPage: true });
                }
                if (html) {
                    htmlContent = await page.content();
                }

                return {
                    ...(html ? { htmlContent } : {}),
                    ...(captureConsole !== false ? { consoleLogs } : {}),
                    ...(network !== false ? { networkActivity } : {}),
                    ...(screenshot ? { screenshotPath } : {}),
                    message: `Successfully opened URL: ${url}`
                };

            } catch (error) {
                console.error("Error during browser automation:", error);
                throw new Error(`Browser automation failed: ${error.message}`);
            } finally {
                await browser.close();
            }
        },
        requestSchema: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'URL to open in the browser.' },
                html: { type: 'boolean', description: 'Capture page HTML content (optional, default: false).' },
                console: { type: 'boolean', description: 'Capture browser console logs (optional, default: true).' },
                network: { type: 'boolean', description: 'Capture network activity (optional, default: true).' },
                screenshot: { type: 'string', description: 'File path to save a screenshot (optional).' },
                timeout: { type: 'number', description: 'Navigation timeout in milliseconds (optional, default: 30000ms).' },
                viewport: { type: 'string', description: 'Viewport size in format "widthxheight" (e.g., "1280x720", optional).' },
                headless: { type: 'boolean', description: 'Run browser in headless mode (optional, default: true).' },
            },
            required: ['url']
        },
        responseSchema: {
            type: 'object',
            properties: {
                message: { type: 'string', description: 'Confirmation message.' },
                htmlContent: { type: 'string', description: 'Page HTML content (if requested).' },
                consoleLogs: { type: 'array', items: { type: 'string' }, description: 'Captured browser console logs (if requested).' },
                networkActivity: { type: 'array', items: { type: 'object' }, description: 'Captured network activity (if requested).' },
                screenshotPath: { type: 'string', description: 'Path to the saved screenshot (if requested).' },
            },
            required: ['message']
        }
    };

    function parseViewport(viewportString) {
        const [width, height] = viewportString.split('x').map(Number);
        return { width, height };
    }
    ```

**Step 22: Register `browser-open` Tool in `server.js`**

1.  Open `server.js` and import and register the `browserOpenTool`:

    ```javascript
    // server.js
    // ... other imports ...
    import { webSearchTool } from './capabilities/tools/web-search.js';
    import { repoQueryTool } from './capabilities/tools/repo-query.js';
    import { githubPullRequestResource } from './capabilities/resources/github-pr.js';
    import { browserOpenTool } from './capabilities/tools/browser-automation/browser-open.js'; // Import browser-open tool

    async function main() {
        // ... server setup ...
            capabilities: {
                resources: {
                    'github-pr': githubPullRequestResource,
                },
                tools: {
                    'web-search': webSearchTool,
                    'repo-query': repoQueryTool,
                    'browser-open': browserOpenTool, // Register browser-open tool
                }
            }
        // ... rest of server.js ...
    }

    main().catch(console.error);
    ```

**Step 23: Test the `browser-open` Tool**

1.  Ensure your MCP server is running (`node server.js`).
2.  Modify your `test-client.js` to test `browser-open` tool:

    ```javascript
    // test-client.js
    // ... imports ...

    async function main() {
        // ... transport and client setup ...

        try {
            // ... previous tests (you can keep them or comment out) ...

            console.log("\n--- Browser Open Tool ---");
            const browserOpenResponse = await client.executeTool({
                toolName: 'browser-open',
                version: '0.1.0',
                arguments: {
                    url: "https://www.example.com", // Example URL
                    html: true,          // Request HTML content
                    screenshot: "example.png", // Save screenshot to example.png in project root
                    viewport: "800x600"  // Set viewport size
                }
            });
            console.log("Browser Open Message:", browserOpenResponse.tool_response.message);
            if (browserOpenResponse.tool_response.htmlContent) {
                console.log("\nHTML Content (truncated):\n", browserOpenResponse.tool_response.htmlContent.substring(0, 300) + "...");
            }
            if (browserOpenResponse.tool_response.screenshotPath) {
                console.log("\nScreenshot saved to:", browserOpenResponse.tool_response.screenshotPath);
                // You can open example.png in your project root to view the screenshot
            }

        } catch (error) {
            console.error("Error executing browser-open tool:", error);
        } finally {
            client.close();
        }
    }

    main().catch(console.error);
    ```

3.  Run the modified `test-client.js` (`node test-client.js`). You should see output indicating the URL was opened, and if successful, a truncated HTML content snippet and a message about the screenshot being saved. A file named `example.png` should be created in your project root directory containing a screenshot of `example.com`.

**Next Steps:**

This detailed plan has guided you through implementing the `web-search`, `repo-query`, `github-pr` and `browser-open` functionalities. You can continue implementing the remaining `cursor-tools` features (`browser act`, `browser observe`, `browser extract`, `cursor-tools doc`, `cursor-tools github issue`) by following a similar pattern:

1.  **Create a new tool or resource module** (e.g., `browser-act.js`, `github-issue.js`, `generate-doc.js`).
2.  **Implement the necessary capabilities** (`execute` for tools, `list`, `read` for resources) within the module, using appropriate APIs and libraries (Playwright for browser tools, GitHub API for issues, a documentation generation library for `doc`).
3.  **Define request and response schemas** in the module.
4.  **Register the new module** in the `capabilities` section of your `server.js`.
5.  **Test the new functionality** using your `test-client.js` or by creating new test scripts.

Remember to handle errors gracefully, add logging, and document your code as you proceed. This step-by-step approach will help you build a comprehensive MCP server mirroring the features of `cursor-tools`.