# Developer Tools

A comprehensive suite of development tools including an MCP (Model Context Protocol) server implementation and various utilities for enhancing developer productivity.

## 🚀 Features

- **MCP Server Implementation**: A TypeScript-based server implementing the Model Context Protocol
- **Web Search Integration**: Powered by Perplexity AI
- **Repository Analysis**: Using Google's Gemini AI
- **Browser Automation**: For web interaction and testing
- **Comprehensive Documentation**: Including research and implementation guides

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- TypeScript knowledge for development

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

3. Set up environment variables:
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