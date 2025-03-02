# Developer Tools

A comprehensive suite of tools for developers, integrated into a unified platform. This project provides tools for web search, repository analysis, documentation generation, and browser automation.

## Features

- **Web Search**: Search the web using natural language queries with Perplexity AI
- **Repository Analysis**: Analyze code repositories using Google Gemini
- **Documentation Generation**: Generate documentation from code repositories
- **Browser Automation**: Automate browser actions for testing and scraping
- **Command Line Interface**: Unified CLI for all tools and server management

## Architecture

This project is organized as a monorepo with the following components:

- **packages/**: Core packages used throughout the project
  - **server/**: Server-side code including services, transports, and routes
  - **shared/**: Shared utilities, types, and configurations
  - **client/**: Client-side code for web interfaces
  - **cli/**: Command-line interface for all tools and server management

- **tools/**: Individual command-line tools
  - **web-search/**: Web search tool using Perplexity AI
  - **command-handler/**: Command handler for CLI and chat integrations
  - **repo-analysis/**: Repository analysis tool using Google Gemini
  - **doc-generation/**: Documentation generation tool
  - **browser-automation/**: Browser automation tool

- **unified-test-interface/**: Web interface for interacting with all tools
- **mcp-server/**: Model Context Protocol server for AI integration

## Getting Started

### Prerequisites

- Node.js v16 or higher
- npm v8 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/developer-tools.git
cd developer-tools

# Install dependencies
npm install

# Run the interactive installer
npm run install:interactive
# Or use the CLI
npx dev-tools install
```

## Configuration

Configuration is managed through environment variables and configuration files:

- `.env`: Environment variables for API keys and settings
- `config/`: Configuration files for different components

Required environment variables:

- `PERPLEXITY_API_KEY`: Perplexity AI API key for web search
- `GEMINI_API_KEY`: Google Gemini API key for repository analysis
- `RESEARCH_DIR`: Directory for saving search results

## Usage

### Command Line Interface

The new unified CLI provides access to all tools and server management:

```bash
# Install the CLI globally
npm install -g developer-tools

# Or use it directly
npx dev-tools <command>
```

Available commands:

```bash
# Web search
dev-tools web "What is the capital of France?"
dev-tools web "Latest JavaScript framework trends" --save
dev-tools web "Node.js file system API" --format json

# Run any registered tool
dev-tools run web-search --data '{"query": "JavaScript async/await patterns"}'

# List available tools
dev-tools list

# Start the MCP server
dev-tools start
dev-tools start --port 3002 --no-api

# Install and configure
dev-tools install
dev-tools install -y --api-key "your-api-key" --server-port 3001
```

### Legacy Command Line Tools

The original command-line tools are still available:

```bash
# Web search
npx dt web "What is the capital of France?"

# Repository analysis
npx dt repo "Explain the authentication flow"

# Documentation generation
npx dt doc --output docs.md

# Browser automation
npx dt browser open "https://example.com" --html
```

### Unified Web Interface

Start the unified web interface for accessing all tools:

```bash
npm run start-unified
```

Then open http://localhost:3000 in your browser.

### Programmatic Usage

```javascript
import { webSearch } from '@developer-tools/web-search';
import { repoAnalysis } from '@developer-tools/repo-analysis';

// Perform a web search
const searchResults = await webSearch("What is quantum computing?", {
  format: "markdown",
  save: true,
  output: "quantum-computing.md"
});

// Analyze a repository
const analysis = await repoAnalysis("Explain the authentication flow");
```

## Development

This project uses a monorepo structure with npm workspaces:

```bash
# Run tests
npm test

# Build all packages
npm run build

# Lint code
npm run lint
```

### Testing Transport Integrations

The project supports multiple transport mechanisms for tool execution:

- HTTP: RESTful API transport
- SSE: Server-Sent Events for real-time communication

To test transport integrations:

```bash
npm run test-transport
```

## Cursor IDE Integration

The Developer Tools CLI integrates with Cursor IDE through the `.cursorrules` file, allowing you to execute commands directly from the Cursor AI chat interface. See the `.cursorrules` file for available commands and usage examples.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 