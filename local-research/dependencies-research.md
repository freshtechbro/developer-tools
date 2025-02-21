Querying Perplexity AI using sonar-pro for: List all dependencies needed to build an MCP server, including the Model Context Protocol SDK, web search (Perplexity), GitHub integration, browser automation (Playwright), and any utility libraries. For each dependency, provide the latest stable version and documentation URL.
Here's a list of dependencies for building an MCP server with the specified features:

1. @modelcontextprotocol/sdk: v1.2.0
   https://modelcontextprotocol.io/docs/sdk/

2. perplexity-api: v1.1.2
   https://docs.perplexity.ai/

3. @octokit/rest: v19.0.13
   https://octokit.github.io/rest.js/

4. playwright: v1.41.2
   https://playwright.dev/docs/api/class-playwright

5. axios: v1.6.5
   https://axios-http.com/docs/intro

6. dotenv: v16.3.1
   https://github.com/motdotla/dotenv#readme

7. typescript: v5.3.3
   https://www.typescriptlang.org/docs/

8. ts-node: v10.9.2
   https://typestrong.org/ts-node/docs/

9. @types/node: v20.11.5
   https://www.npmjs.com/package/@types/node

These versions are the latest stable as of February 2025. Install using:

```bash
npm install @modelcontextprotocol/sdk@1.2.0 perplexity-api@1.1.2 @octokit/rest@19.0.13 playwright@1.41.2 axios@1.6.5 dotenv@16.3.1
npm install --save-dev typescript@5.3.3 ts-node@10.9.2 @types/node@20.11.5
```

Query: Write a TypeScript code for an MCP server that implements tools for web search using Perplexity API, GitHub repository management, and browser automation with Playwright. Include error handling and proper typing.