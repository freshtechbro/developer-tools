# Unified Test Interface

A modern, comprehensive test interface for developer tools. This web application provides a unified interface for interacting with all developer tools in the monorepo.

## Features

- **Web Search Tool**: Search the web with Perplexity AI integration
- **Command Interceptor**: Execute tools via commands in AI chats
- **Repository Analysis**: Analyze GitHub repositories using Gemini AI
- **Browser Automation**: Test and automate browser actions
- **Documentation Generation**: Generate documentation from repositories
- **Settings Management**: Configure and manage all tool settings
- **Real-time Communication**: Connect via HTTP or WebSocket/SSE
- **Status Indicators**: Monitor connection status and active tools
- **Dark/Light Mode**: Toggle between dark and light themes

## Getting Started

### Prerequisites

- Node.js v16 or higher
- npm v8 or higher

### Installation

```bash
# Navigate to the unified-test-interface directory
cd unified-test-interface

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys and configuration
```

### Running the Application

#### Development Mode

Start the backend server:

```bash
# From the root directory
npm run start-backend
```

Start the React development server:

```bash
# From the unified-test-interface directory
npm run dev
```

Or use the convenience scripts from the root directory:

```bash
# Start both backend and frontend
npm run start-unified
```

#### Production Build

Build the application:

```bash
# From the unified-test-interface directory
npm run build
```

Serve the production build:

```bash
# From the root directory
npm run serve-ui
```

## Usage

### Web Search

- Navigate to the Web Search tab
- Enter your search query in the input field
- Click "Search" or press Enter
- View results in the response panel
- Toggle between different result formats (Text, Markdown, JSON, HTML)
- Save results to a file via the download button

### Repository Analysis

- Navigate to the Repository Analysis tab
- Enter a GitHub repository URL
- Enter your analysis query
- Click "Analyze" to start the analysis
- View the analysis results in the response panel

### Browser Automation

- Navigate to the Browser Automation tab
- Enter a URL to open
- Select browser actions to perform
- View screenshots and console logs from the browser session

### Documentation Generation

- Navigate to the Documentation tab
- Enter a GitHub repository URL
- Configure documentation options
- Click "Generate" to create documentation
- Download the generated documentation

### Settings

- Navigate to the Settings tab
- Configure connection settings (HTTP/WebSocket)
- Set default options for each tool
- Toggle dark/light mode
- Save settings for future sessions

## Architecture

The Unified Test Interface is built with:

- **React**: Front-end UI library
- **Vite**: Build tool and development server
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library
- **TypeScript**: Type-safe JavaScript

### Project Structure

```
unified-test-interface/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable React components
│   │   ├── ui/          # UI components (buttons, inputs, etc.)
│   │   └── ...
│   ├── contexts/        # React context providers
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   ├── pages/           # Route components
│   ├── services/        # API and service integrations
│   ├── types/           # TypeScript types and interfaces
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Application entry point
└── ...
```

### Communication

The interface communicates with the backend server using:

- **HTTP Transport**: RESTful API for basic commands
- **WebSocket/SSE Transport**: Real-time communication for streaming results

## Adding New Tools

To add a new tool to the interface:

1. Create a new page component in `src/pages/`
2. Add a new route in `src/App.tsx`
3. Create any necessary components in `src/components/`
4. Add service integration in `src/services/`
5. Update the navigation menu in `src/components/Layout.tsx`

## Future Improvements

- Real-time updates with WebSockets for all tools
- User authentication and personal settings
- History of previous searches and analyses
- Export/import of tool configurations
- Integration with more AI models and services
- Mobile-responsive design improvements
- Keyboard shortcuts for common actions

## License

This project is licensed under the MIT License. 