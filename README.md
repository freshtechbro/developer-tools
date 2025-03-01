# Developer Tools

A comprehensive suite of AI-powered tools and utilities for supercharging developer productivity.

## Vision

Developer Tools is designed to give developers superpowers when working with AI tools. It serves as an intelligent assistant that performs actions to help developers answer questions, solve problems, and automate tedious tasks. By providing a unified interface to various AI capabilities, it enables developers to:

- **Search the web** with semantic understanding using Perplexity AI
- **Analyze codebases** with contextual awareness using Google Gemini
- **Automate browser interactions** for testing and data collection with Playwright
- **Access GitHub information** seamlessly from within their workflow
- **Generate comprehensive documentation** for projects and components

The vision is to create an indispensable companion for the modern developer, bridging the gap between human creativity and AI assistance to create a workflow that feels like pair programming with a superhuman partner.

## Project Structure

The project is organized as a monorepo with the following packages:

- **client**: Client-side implementations for interacting with the tools
- **server**: Server-side implementations for providing tool functionality
- **shared**: Shared utilities and types used across packages

### Architecture

The system is built on the Model Context Protocol (MCP), with multiple transport methods:

- **HTTP Transport**: RESTful endpoint at http://localhost:3001/mcp
- **SSE Transport**: Event streaming endpoint at http://localhost:3002/mcp-sse
- **Web Interface**: Interactive testing UI at http://localhost:3003

For more details, see the [architecture documentation](local-research/architecture-design.md).

### Directory Structure

```
developer-tools/
├── config/                 # Configuration files
├── docs/                   # Documentation
│   ├── api/                # API documentation
│   ├── resources/          # Resource documentation
│   └── tools/              # Tool documentation
├── packages/               # Monorepo packages
│   ├── client/             # Client-side implementations
│   ├── server/             # Server-side implementations
│   └── shared/             # Shared utilities and types
├── public/                 # Static web assets
├── resources/              # Resource files
├── scripts/                # Utility scripts
│   ├── health-checks/      # Server health check scripts
│   └── server-management/  # Server management scripts
├── local-research/         # Project research and documentation
└── tools/                  # Development tools
```

## Available Tools

### Web Search

The web search tool enables semantic search across the internet using Perplexity AI:

```javascript
// Example usage
await client.executeTool({
  toolName: 'web-search',
  version: '0.1.0',
  arguments: { query: 'How to implement rate limiting in Node.js' }
});
```

### Repository Analysis

Analyze codebases and answer questions using Google Gemini:

```javascript
// Example usage
await client.executeTool({
  toolName: 'repo-analysis',
  version: '0.1.0',
  arguments: { repository: 'username/repo', query: 'Explain the authentication flow' }
});
```

### Browser Automation

Control web browsers for testing and data gathering:

```javascript
// Example usage
await client.executeTool({
  toolName: 'browser-open',
  version: '0.1.0',
  arguments: { url: 'https://example.com', options: { capture: ['html', 'screenshot'] } }
});
```

### GitHub Integration

Access GitHub information directly:

```javascript
// Example: Get PR information
await client.readResource({
  resourceType: 'github-pr',
  resourceId: 'username/repo/123'
});
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys
```

### Running the Servers

To start all servers at once:

```bash
# On Windows
npm run start:all:windows

# On Unix/Linux/Mac
npm run start:all
```

This will start:
- HTTP Transport Server (port 3001)
- SSE Transport Server (port 3002)
- Web Interface (port 3003)

To start individual servers:

```bash
npm run start:http  # Start HTTP transport server
npm run start:sse   # Start SSE transport server
npm run start:web   # Start web interface
```

### Checking Server Health

```bash
npm run check
```

### Testing SSE Connection

```bash
npm run test:sse
```

## Development

### Building

```bash
# Build all packages
npm run build

# Build specific packages
npm run build:shared
npm run build:server
npm run build:client

# Watch mode for development
npm run build:watch
```

### Testing

```bash
# Run all tests
npm test

# Test specific packages
npm run test:shared
npm run test:server
npm run test:client

# Watch mode for testing
npm run test:watch

# Generate test coverage
npm run test:coverage
```

### Linting

```bash
npm run lint
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 