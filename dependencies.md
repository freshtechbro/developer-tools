# MCP Server Dependencies

This document lists all dependencies required to build the MCP server, including their versions, purposes, and documentation links.

## Core Dependencies

### Model Context Protocol SDK
- **Package**: `@modelcontextprotocol/sdk`
- **Version**: 1.2.0
- **Purpose**: Core SDK for implementing the Model Context Protocol
- **Documentation**: [MCP SDK Documentation](https://modelcontextprotocol.github.io/sdk/)
- **Installation**: `npm install @modelcontextprotocol/sdk@1.2.0`

### Perplexity API (Web Search)
- **Package**: `perplexity-api`
- **Version**: 1.1.2
- **Purpose**: Integration with Perplexity AI for web search functionality
- **Documentation**: [Perplexity API Documentation](https://docs.perplexity.ai/)
- **Installation**: `npm install perplexity-api@1.1.2`
- **Note**: Requires API key from Perplexity

### GitHub API Client
- **Package**: `@octokit/rest`
- **Version**: 19.0.13
- **Purpose**: GitHub API integration for repository management
- **Documentation**: [Octokit REST Documentation](https://octokit.github.io/rest.js/)
- **Installation**: `npm install @octokit/rest@19.0.13`
- **Note**: Requires GitHub Personal Access Token

### Browser Automation
- **Package**: `playwright`
- **Version**: 1.41.2
- **Purpose**: Browser automation for web interaction and testing
- **Documentation**: [Playwright Documentation](https://playwright.dev/docs/api/class-playwright)
- **Installation**: `npm install playwright@1.41.2`

### HTTP Client
- **Package**: `axios`
- **Version**: 1.6.5
- **Purpose**: Making HTTP requests to external APIs
- **Documentation**: [Axios Documentation](https://axios-http.com/docs/intro)
- **Installation**: `npm install axios@1.6.5`

### Environment Variables
- **Package**: `dotenv`
- **Version**: 16.3.1
- **Purpose**: Loading environment variables from .env files
- **Documentation**: [dotenv Documentation](https://github.com/motdotla/dotenv#readme)
- **Installation**: `npm install dotenv@16.3.1`

## Development Dependencies

### TypeScript
- **Package**: `typescript`
- **Version**: 5.3.3
- **Purpose**: Static typing and modern JavaScript features
- **Documentation**: [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- **Installation**: `npm install --save-dev typescript@5.3.3`

### TypeScript Node
- **Package**: `ts-node`
- **Version**: 10.9.2
- **Purpose**: Running TypeScript files directly
- **Documentation**: [ts-node Documentation](https://typestrong.org/ts-node/docs/)
- **Installation**: `npm install --save-dev ts-node@10.9.2`

### Node.js Types
- **Package**: `@types/node`
- **Version**: 20.11.5
- **Purpose**: TypeScript type definitions for Node.js
- **Documentation**: [Node.js Types Package](https://www.npmjs.com/package/@types/node)
- **Installation**: `npm install --save-dev @types/node@20.11.5`

## Quick Install Commands

### Production Dependencies
```bash
npm install @modelcontextprotocol/sdk@1.2.0 perplexity-api@1.1.2 @octokit/rest@19.0.13 playwright@1.41.2 axios@1.6.5 dotenv@16.3.1
```

### Development Dependencies
```bash
npm install --save-dev typescript@5.3.3 ts-node@10.9.2 @types/node@20.11.5
```

## Environment Variables Required

Create a `.env` file in your project root with the following variables:
```env
# Required for web search functionality
PERPLEXITY_API_KEY=your_perplexity_api_key

# Required for GitHub integration (optional if only using public repos)
GITHUB_TOKEN=your_github_token

# Optional configuration
NODE_ENV=development
LOG_LEVEL=info
```

## Post-Installation Steps

1. **Initialize TypeScript Configuration**
   ```bash
   npx tsc --init
   ```

2. **Install Playwright Browsers**
   ```bash
   npx playwright install
   ```

3. **Create tsconfig.json**
   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "ESNext",
       "moduleResolution": "node",
       "esModuleInterop": true,
       "strict": true,
       "outDir": "./dist",
       "rootDir": "./src",
       "declaration": true
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "dist"]
   }
   ```

## Version Management

- All dependencies use semantic versioning (MAJOR.MINOR.PATCH)
- Regular updates recommended for security patches
- Major version updates should be carefully tested for breaking changes

## Security Notes

- Keep API keys and tokens secure in `.env` file
- Add `.env` to `.gitignore`
- Regularly update dependencies for security patches
- Review security advisories for all dependencies

## Support and Resources

- MCP SDK Issues: [GitHub Issues](https://github.com/modelcontextprotocol/sdk/issues)
- Perplexity API Support: [Documentation](https://docs.perplexity.ai/support)
- Playwright Help: [Discord Community](https://playwright.dev/community/discord)
- TypeScript Questions: [Stack Overflow](https://stackoverflow.com/questions/tagged/typescript) 