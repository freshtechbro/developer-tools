# Contributing to Developer Tools

Thank you for your interest in contributing to the Developer Tools project! This document provides guidelines and instructions for contributing to the project.

## Development Setup

### Prerequisites

- Node.js v16 or higher
- npm v8 or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/developer-tools.git
   cd developer-tools
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Project Structure

The project is organized as a monorepo with the following components:

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

## Development Workflow

1. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and ensure they follow the project's coding standards.

3. Run tests to ensure your changes don't break existing functionality:
   ```bash
   npm test
   ```

4. Build the project to ensure it compiles correctly:
   ```bash
   npm run build
   ```

5. Commit your changes with a descriptive commit message:
   ```bash
   git commit -m "Add feature: your feature description"
   ```

6. Push your branch to the repository:
   ```bash
   git push origin feature/your-feature-name
   ```

7. Create a pull request with a clear description of your changes.

## Adding a New Tool

To add a new tool to the Developer Tools suite:

1. Create a new directory in the `tools/` directory with your tool name.
2. Implement your tool following the existing patterns.
3. Register your tool with the MCP server in `mcp-server/src/tools/registry.ts`.
4. Add tests for your tool in the `tests/` directory.
5. Update documentation to include your new tool.

## Coding Standards

- Use TypeScript for all new code.
- Follow the existing code style and formatting.
- Write comprehensive tests for new features.
- Document your code with JSDoc comments.
- Keep dependencies to a minimum and prefer native Node.js modules when possible.

## Pull Request Process

1. Ensure your code passes all tests and builds successfully.
2. Update documentation if necessary.
3. Your pull request will be reviewed by maintainers, who may request changes.
4. Once approved, your pull request will be merged.

## License

By contributing to this project, you agree that your contributions will be licensed under the project's MIT License. 