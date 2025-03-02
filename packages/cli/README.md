# Developer Tools CLI

A command-line interface for managing and using the Developer Tools suite, including the MCP server and various tools.

## Installation

The CLI is installed as part of the Developer Tools package. After installing the main package, you can use the CLI globally:

```bash
npm install -g developer-tools
```

Or run it directly from the project:

```bash
npx dev-tools <command>
```

## Commands

### Web Search

Search the web using the integrated web search tool:

```bash
dev-tools web "your search query"
```

Options:
- `-s, --save`: Save the search results to a file
- `-f, --format <format>`: Output format (text, markdown, json, html)
- `-p, --provider <provider>`: Provider to use (perplexity, gemini, openai)
- `-d, --detailed`: Get a more detailed answer

### Run a Tool

Execute any registered tool:

```bash
dev-tools run <tool-name> [options]
```

Options:
- `-d, --data <json>`: JSON data to pass to the tool
- `-f, --file <path>`: Path to a JSON file containing tool parameters
- `-o, --output <path>`: Path to write the output to
- `-s, --server <url>`: MCP server URL (default: http://localhost:3001/api)

### List Available Tools

List all tools registered with the MCP server:

```bash
dev-tools list
```

Options:
- `-s, --server <url>`: MCP server URL (default: http://localhost:3001/api)

### Start the MCP Server

Start the MCP server:

```bash
dev-tools start [options]
```

Options:
- `-p, --port <port>`: Port to run the server on (default: 3001)
- `--stdio`: Use stdio transport instead of HTTP
- `--no-api`: Disable the HTTP API server

### Install and Configure

Install and configure the developer tools:

```bash
dev-tools install [options]
```

Options:
- `-y, --yes`: Skip prompts and use default values
- `--api-key <key>`: API key for search providers
- `--server-port <port>`: Port for the MCP server
- `--api-enabled`: Enable the HTTP API server

## Integration with Cursor IDE

The Developer Tools CLI integrates with Cursor IDE through the `.cursorrules` file, allowing you to execute commands directly from the Cursor AI chat interface.

## Development

To build the CLI:

```bash
npm run build
```

To run the CLI in development mode:

```bash
npm run dev
```

## License

MIT 