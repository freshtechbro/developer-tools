# Developer Tools

A comprehensive suite of development tools including an MCP (Model Context Protocol) server implementation and various utilities for enhancing developer productivity.

## 🚀 Features

- **MCP Server Implementation**: A TypeScript-based server implementing the Model Context Protocol
- **Web Search Integration**: Powered by Perplexity AI
- **Repository Analysis**: Using Google's Gemini AI
- **Browser Automation**: For web interaction and testing
- **REST API**: Optional HTTP API for accessing MCP resources
- **Search History**: Store and retrieve past searches
- **Comprehensive Documentation**: Including research and implementation guides

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- TypeScript knowledge for development
- Playwright for browser automation capabilities

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/freshtechbro/developer-tools.git
cd developer-tools
```

2. Install dependencies:
```bash
npm install
```

3. Install Playwright (optional, for browser automation):
```bash
npm install playwright
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your actual API keys and configuration
```

## 🔧 Configuration

The following environment variables are required:

- `PERPLEXITY_API_KEY`: Your Perplexity AI API key
- `GOOGLE_API_KEY`: Your Google API key for Gemini
- `NODE_ENV`: Development environment (development/production/test)
- `LOG_LEVEL`: Logging level (debug/info/warn/error)
- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: localhost)
- `REST_API_ENABLED`: Enable REST API server (true/false)
- `REST_API_PORT`: REST API server port (default: 3000)

## 🚀 Usage

1. Start the MCP server:
```bash
npm run start
```

2. For development with hot-reload:
```bash
npm run dev
```

3. Build the project:
```bash
npm run build
```

## 🧩 Services

The project is organized into modular services:

### PerplexityService
Handles web search operations using the Perplexity AI API. It provides:
- Web search functionality with customizable parameters
- Detailed logging for search operations
- Error handling for API failures

### GeminiService
Manages interactions with the Google Gemini API for:
- Code and repository analysis
- Content generation
- AI-powered insights

### FileStorageService
Provides file system operations with:
- File reading/writing with configurable options
- Directory creation
- Append operations
- File existence checking
- File deletion

### BrowserService
Provides browser automation capabilities using Playwright:
- Web page navigation and content collection
- Form filling and submission
- Data extraction from web pages
- Screenshot capture
- Console and network request monitoring

## 🔧 Tools

The MCP server provides the following tools:

### Web Search
```typescript
// Example usage
const result = await webSearchTool.execute({
  query: "TypeScript best practices",
  saveToFile: "search-results.md" // Optional
});
```

### Repository Analysis
```typescript
// Example usage
const result = await repoAnalysisTool.execute({
  query: "Analyze code quality",
  targetPath: "./src",
  maxDepth: 3,
  saveToFile: "analysis-results.md" // Optional
});
```

### Browser Automation
```typescript
// Example usage - Navigate to a URL
const result = await browserAutomationTool.execute({
  action: "navigate",
  url: "https://example.com",
  options: {
    captureScreenshot: true,
    captureHtml: true,
    captureConsole: true
  }
});

// Example usage - Fill a form
const result = await browserAutomationTool.execute({
  action: "form",
  url: "https://example.com/login",
  formData: {
    username: "user",
    password: "pass"
  }
});

// Example usage - Extract data
const result = await browserAutomationTool.execute({
  action: "extract",
  url: "https://example.com/products",
  selectors: {
    titles: ".product-title",
    prices: ".product-price"
  }
});
```

## 🌐 REST API

When enabled, the REST API provides HTTP endpoints for accessing MCP resources:

### Search History Endpoints

- `GET /api/search-history`: Get all search history entries with pagination
- `GET /api/search-history/search?term=query`: Search through history
- `GET /api/search-history/:id`: Get a specific search by ID
- `POST /api/search-history`: Add a new search entry
- `DELETE /api/search-history/:id`: Delete a specific search
- `DELETE /api/search-history`: Clear all search history

Enable the REST API by setting `REST_API_ENABLED=true` in your `.env` file.

## 📚 Documentation

Detailed documentation is available in the `local-research` directory:

- `mcp-setup-guide.md`: Complete setup instructions
- `dependencies-installation-guide.md`: Dependency management guide
- `typescript-esm-config.md`: TypeScript and ESM configuration details
- Additional implementation and research documents

## 🧪 Testing

Run the test suite:
```bash
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔐 Security

- Environment variables and sensitive data are never committed to the repository
- API keys should be kept secure and not shared
- See `.env.example` for required environment variables
- Branch protection rules are in place for the main branch

## 🙏 Acknowledgments

- Model Context Protocol team for the SDK
- Perplexity AI for search capabilities
- Google Gemini for AI features
- Playwright team for browser automation capabilities 