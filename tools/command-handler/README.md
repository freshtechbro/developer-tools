# Developer Tools Command Handler

Command handler for developer tools CLI integration. This module provides:

1. A command-line interface for interacting with developer tools
2. A programmatic API for invoking tools from code
3. Command parsing for AI chat integration

## Installation

```bash
# Install from the project root
npm install -g ./tools/command-handler

# Or link it for development
cd tools/command-handler
npm link
```

## Usage

### Command Line Interface

```bash
# Web search
dt web "What is the capital of France?"
dt web "Latest JavaScript framework trends" --save
dt web "Node.js file system API" --format json

# Repository analysis (future)
dt repo "Explain the authentication flow"

# Documentation generation (future)
dt doc --output docs.md

# Browser automation (future)
dt browser open "https://example.com" --html
```

### AI Chat Integration

In your AI chat (like Cursor AI), you can use developer tools commands directly:

```
dt-web "What is the capital of France?"
dt-repo "Explain the authentication flow"
dt-doc --output docs.md
dt-browser open "https://example.com" --html
```

These commands will be intercepted and processed by the MCP server integration.

### Programmatic Usage

```javascript
import { devTools } from '@developer-tools/command-handler';

// Use tools directly
const result = await devTools.web("What is quantum computing?", {
  format: "markdown",
  save: true,
  output: "quantum-computing.md"
});

console.log(result.searchResults);

// Process commands from strings (like in chat)
const chatCommand = 'dt-web "What is the capital of France?"';
const commandResult = await devTools.processCommand(chatCommand);

if (commandResult) {
  console.log(commandResult.searchResults);
}
```

## Command Prefixes

All commands in chat start with the prefix `dt-`, followed by the tool name:

- `dt-web` - Web search 
- `dt-repo` - Repository analysis
- `dt-doc` - Documentation generation
- `dt-browser` - Browser automation

## Configuration

The command handler uses the same configuration as the other developer tools. See the main project README for configuration details.

## Development

To add a new command, update the `COMMANDS` object in `index.ts` and implement the command handling logic in the appropriate section of the `processCommand` function. 