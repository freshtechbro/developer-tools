# Web Search Tool

A command-line tool for performing web searches using Perplexity AI. This tool is part of the Developer Tools monorepo and is designed to be used standalone or as part of the unified platform.

## Features

- Search the web using natural language queries
- Format results as text, markdown, JSON, or HTML
- Save search results to a file
- Customize output file names and formats
- Rate limiting to prevent API overuse
- Integration with the services layer for Perplexity API interactions
- Multiple transport mechanisms (direct CLI, HTTP, SSE)

## Installation

```bash
# Install globally from the monorepo
npm install -g ./tools/web-search

# Or link it for development
cd tools/web-search
npm link
```

## Usage

### Basic Search

```bash
# Basic search query
dt web "What is the capital of France?"

# Use alternative commands
web-search "What is the capital of France?"
npx dt web "What is the capital of France?"
```

### Saving Results

```bash
# Save results to default file in research directory
dt web "Latest JavaScript frameworks" --save

# Save with custom filename
dt web "Node.js file system API" --save --output nodejs-fs-api.md
```

### Output Formats

```bash
# Specify output format
dt web "Quantum computing basics" --format markdown
dt web "JavaScript async/await" --format json
dt web "HTML5 canvas tutorial" --format html
```

### Advanced Options

```bash
# Exclude sources from results
dt web "Climate change research" --no-sources

# Quiet mode (less console output)
dt web "Python best practices" --quiet

# Customize token limit
dt web "History of artificial intelligence" --max-tokens 1000
```

## Options

- `--save`, `-s`: Save results to a file (default: false)
- `--format`, `-f`: Output format: text, markdown, json, html (default: "text")
- `--max-tokens`, `-m`: Maximum tokens for the response (default: 500)
- `--output`, `-o`: Custom output file name (default: based on query)
- `--no-sources`: Exclude sources from the results (default: includes sources)
- `--quiet`, `-q`: Reduce console output (default: false)
- `--help`, `-h`: Show help message

## Environment Variables

The web search tool requires several environment variables to be set:

- `PERPLEXITY_API_KEY`: Your Perplexity API key (required)
- `RESEARCH_DIR`: Directory to save search results (default: "./local-research")
- `RATE_LIMIT_ENABLED`: Enable/disable rate limiting (default: "true")
- `RATE_LIMIT_MAX`: Maximum searches per minute (default: "5")

## Integration with Monorepo

The web search tool is integrated with the Developer Tools monorepo:

- Uses the `PerplexityService` from the services layer
- Supports the MCP protocol for communication
- Can be accessed via the unified web interface
- Shares configuration with other tools

## Programmatic Usage

```javascript
import { webSearch } from '@developer-tools/web-search';

const results = await webSearch("Quantum computing explained", {
  format: "markdown",
  save: true,
  output: "quantum-computing.md",
  maxTokens: 750,
  includeSources: true
});

console.log(results.searchResults);
```

## Development

```bash
# Run tests
npm test

# Build the tool
npm run build

# Lint code
npm run lint
```

## License

This tool is licensed under the MIT License. 