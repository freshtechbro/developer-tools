import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3003;
const FALLBACK_PORT = 3004; // Fallback port if 3003 is in use

// Create server instance separately to handle port conflicts
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'unified-test-interface/dist')));

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Main API endpoint
app.post('/api/command', async (req, res) => {
  try {
    const { command, query, ...options } = req.body;
    console.log('Received command request:', { command, query, options });
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (command === 'web-search') {
      // Simulate a web search response
      res.json({
        success: true,
        results: `Search results for: "${query}"\n\nAccording to recent sources, ${query} is a topic of significant interest. Multiple websites provide information about this subject, including detailed analyses and historical context.\n\nSome key points from the search:\n\n1. The topic has been researched extensively in academic literature.\n2. There are several practical applications in various industries.\n3. Recent developments have expanded our understanding significantly.\n\nFor more information, consider exploring specialized resources and academic publications.`,
        metadata: {
          provider: options.provider || 'default',
          cached: !options.noCache,
          timestamp: new Date().toISOString(),
          requestId: 'req_' + Date.now().toString(36) + Math.random().toString(36).substring(2),
          tokenUsage: {
            promptTokens: Math.floor(Math.random() * 100) + 20,
            completionTokens: Math.floor(Math.random() * 300) + 100,
            totalTokens: Math.floor(Math.random() * 400) + 120
          }
        }
      });
    } else if (command === 'command-interceptor') {
      // Simulate a command interceptor response
      res.json({
        success: true,
        message: 'Command processed',
        command: query,
        output: `Executed command: ${query}\nResult: Success\n\n$ ${query}\n> Command completed successfully with exit code 0`,
        exitCode: 0,
        executionTime: Math.floor(Math.random() * 1000) + 500
      });
    } else if (command === 'repo-analysis') {
      // Simulate a repo analysis response
      const repoName = query.includes('/') ? query.split('/').pop() : query;
      
      res.json({
        success: true,
        repoPath: query,
        analysisType: options.analysisType || 'general',
        summary: generateMockSummary(query),
        details: generateMockDetails(query),
        recommendations: generateMockRecommendations(query),
        codeSnippets: generateMockCodeSnippets(query),
        timestamp: new Date().toISOString()
      });
    } else if (command === 'browser-automation') {
      // Simulate a browser automation response
      res.json({
        success: true,
        url: options.url || 'https://example.com',
        action: options.action || 'open',
        instruction: options.instruction,
        screenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        html: options.captureHtml ? generateMockHtml(options.url || 'https://example.com') : undefined,
        networkRequests: options.captureNetwork ? generateMockNetworkRequests(options.url || 'https://example.com') : undefined,
        consoleMessages: options.captureConsole ? generateMockConsoleMessages() : undefined,
        extractedData: options.action === 'extract' ? generateMockExtractedData(options.instruction || '') : undefined,
        executionTime: Math.floor(Math.random() * 2000) + 500
      });
    } else if (command === 'doc-generation') {
      // Simulate a documentation generation response
      const sections = [];
      
      if (options.includeReadme) {
        sections.push({
          title: 'README',
          content: generateMockReadme(query)
        });
      }
      
      if (options.includeArchitecture) {
        sections.push({
          title: 'Architecture',
          content: generateMockArchitecture(query)
        });
      }
      
      if (options.includeApi) {
        sections.push({
          title: 'API Documentation',
          content: generateMockApiDocs(query)
        });
      }
      
      if (options.includeDependencies) {
        sections.push({
          title: 'Dependencies',
          content: generateMockDependencies(query)
        });
      }
      
      if (options.includeSetup) {
        sections.push({
          title: 'Setup Instructions',
          content: generateMockSetup(query)
        });
      }
      
      res.json({
        success: true,
        repoPath: query,
        outputFormat: options.outputFormat || 'markdown',
        sections,
        timestamp: new Date().toISOString(),
        generationTime: Math.floor(Math.random() * 2000) + 1500
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Unknown command',
        message: `Command '${command}' is not supported`
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '0.1.0'
  });
});

// Catch-all route to serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'unified-test-interface/dist/index.html'));
});

// Helper functions for generating mock data
function generateMockSummary(repoPath) {
  const repoName = repoPath.includes('/') ? repoPath.split('/').pop() : repoPath;
  return `## ${repoName} Repository Analysis

This repository appears to be a ${getRandomProjectType()} project with approximately ${Math.floor(Math.random() * 100) + 10} files and ${Math.floor(Math.random() * 10000) + 1000} lines of code.

### Key Findings:
- Well-structured codebase with clear organization
- ${Math.floor(Math.random() * 5) + 1} potential security vulnerabilities identified
- Code quality is generally good with some areas for improvement
- Test coverage is approximately ${Math.floor(Math.random() * 60) + 40}%

The repository uses modern development practices and follows most industry standards for ${getRandomProjectType()} projects.`;
}

function generateMockDetails(repoPath) {
  return `# Detailed Analysis

## Project Structure
The project follows a ${Math.random() > 0.5 ? 'standard' : 'custom'} directory structure with the following main components:
- \`src/\`: Main source code
- \`tests/\`: Test files
- \`docs/\`: Documentation
- \`config/\`: Configuration files

## Dependencies
The project has ${Math.floor(Math.random() * 50) + 20} dependencies, with ${Math.floor(Math.random() * 10) + 1} of them being potentially outdated or having known vulnerabilities.

## Code Quality
- Consistent coding style throughout most files
- Some functions exceed recommended complexity metrics
- Variable naming is generally descriptive and follows conventions
- Comments are present but could be more comprehensive in some areas

## Performance Considerations
- Several opportunities for optimization identified
- No major performance bottlenecks detected
- Resource usage appears reasonable for this type of application

## Security Analysis
- ${Math.floor(Math.random() * 3) + 1} high-priority security issues found
- ${Math.floor(Math.random() * 5) + 2} medium-priority security concerns
- Input validation could be improved in several areas
- Authentication mechanisms appear robust`;
}

function generateMockRecommendations(repoPath) {
  return `# Recommendations

1. **Improve Test Coverage**
   - Add unit tests for the \`utils\` and \`helpers\` modules
   - Implement integration tests for the API endpoints

2. **Address Security Vulnerabilities**
   - Update dependencies with known security issues
   - Implement proper input validation for user-submitted data
   - Review and strengthen authentication mechanisms

3. **Code Quality Improvements**
   - Refactor complex functions in the \`core\` module
   - Add more comprehensive documentation for public APIs
   - Consider implementing a consistent error handling strategy

4. **Performance Optimizations**
   - Implement caching for frequently accessed data
   - Optimize database queries in the data access layer
   - Consider lazy loading for resource-intensive components

5. **Maintenance Recommendations**
   - Set up automated dependency updates
   - Implement a more comprehensive logging strategy
   - Consider adopting a more structured code review process`;
}

function generateMockCodeSnippets(repoPath) {
  return [
    {
      path: 'src/core/auth.js',
      code: `function authenticate(username, password) {
  // TODO: Implement proper password hashing
  if (username === 'admin' && password === 'password123') {
    return generateToken(username);
  }
  return null;
}

function generateToken(username) {
  // This should use a more secure method
  return Buffer.from(username + Date.now()).toString('base64');
}`,
      comments: 'This authentication implementation has several security issues. It uses plain text password comparison and a weak token generation method.'
    },
    {
      path: 'src/utils/helpers.js',
      code: `export function processData(data) {
  let result = [];
  
  // This function is overly complex and could be optimized
  for (let i = 0; i < data.length; i++) {
    if (data[i].active) {
      let item = {
        id: data[i].id,
        name: data[i].name,
        value: data[i].value * 2
      };
      
      if (data[i].type === 'special') {
        item.specialValue = calculateSpecialValue(data[i]);
      }
      
      result.push(item);
    }
  }
  
  return result;
}

function calculateSpecialValue(item) {
  // Complex calculation that could be simplified
  return item.value * 3 + (item.modifier || 0);
}`,
      comments: 'This utility function could be refactored to use array methods like map and filter for better readability and performance.'
    },
    {
      path: 'src/api/endpoints.js',
      code: `app.post('/api/data', (req, res) => {
  const data = req.body;
  
  // Missing input validation
  db.insert(data)
    .then(() => {
      res.status(200).json({ success: true });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    });
});`,
      comments: 'This API endpoint lacks proper input validation before inserting data into the database, which could lead to security vulnerabilities.'
    }
  ];
}

function generateMockHtml(url) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Example Page</title>
</head>
<body>
  <header>
    <h1>Welcome to ${url}</h1>
    <nav>
      <ul>
        <li><a href="#">Home</a></li>
        <li><a href="#">About</a></li>
        <li><a href="#">Contact</a></li>
      </ul>
    </nav>
  </header>
  <main>
    <section>
      <h2>Main Content</h2>
      <p>This is a sample page for demonstration purposes.</p>
      <button id="login-button">Login</button>
    </section>
  </main>
  <footer>
    <p>&copy; 2023 Example Website</p>
  </footer>
</body>
</html>`;
}

function generateMockNetworkRequests(url) {
  try {
    const domain = new URL(url).hostname;
    
    return [
      {
        url: url,
        method: 'GET',
        status: 200,
        contentType: 'text/html',
        size: 1256
      },
      {
        url: `https://${domain}/styles.css`,
        method: 'GET',
        status: 200,
        contentType: 'text/css',
        size: 4328
      },
      {
        url: `https://${domain}/main.js`,
        method: 'GET',
        status: 200,
        contentType: 'application/javascript',
        size: 2156
      },
      {
        url: `https://${domain}/api/user`,
        method: 'GET',
        status: 401,
        contentType: 'application/json',
        size: 42
      },
      {
        url: `https://${domain}/images/logo.png`,
        method: 'GET',
        status: 200,
        contentType: 'image/png',
        size: 15678
      }
    ];
  } catch (error) {
    return [
      {
        url: url,
        method: 'GET',
        status: 200,
        contentType: 'text/html',
        size: 1256
      }
    ];
  }
}

function generateMockConsoleMessages() {
  return [
    {
      type: 'log',
      text: 'Page loaded successfully',
      timestamp: new Date().toISOString()
    },
    {
      type: 'info',
      text: 'User session initialized',
      timestamp: new Date().toISOString()
    },
    {
      type: 'warning',
      text: 'Resource loading slow: main.js',
      timestamp: new Date().toISOString()
    },
    {
      type: 'error',
      text: 'Failed to load resource: api/user (401 Unauthorized)',
      timestamp: new Date().toISOString()
    },
    {
      type: 'log',
      text: 'Event listeners attached',
      timestamp: new Date().toISOString()
    }
  ];
}

function generateMockExtractedData(instruction) {
  if (instruction.toLowerCase().includes('product')) {
    return JSON.stringify({
      products: [
        { name: 'Product 1', price: '$19.99', rating: 4.5 },
        { name: 'Product 2', price: '$29.99', rating: 3.8 },
        { name: 'Product 3', price: '$39.99', rating: 4.2 },
        { name: 'Product 4', price: '$49.99', rating: 4.7 },
        { name: 'Product 5', price: '$59.99', rating: 3.5 }
      ]
    }, null, 2);
  }
  
  if (instruction.toLowerCase().includes('article') || instruction.toLowerCase().includes('heading')) {
    return JSON.stringify({
      articles: [
        { title: 'Getting Started with Browser Automation', date: '2023-01-15', author: 'John Doe' },
        { title: 'Advanced Web Scraping Techniques', date: '2023-02-22', author: 'Jane Smith' },
        { title: 'The Future of AI in Web Testing', date: '2023-03-10', author: 'Bob Johnson' },
        { title: 'Ethical Considerations in Data Extraction', date: '2023-04-05', author: 'Alice Brown' }
      ]
    }, null, 2);
  }
  
  return JSON.stringify({
    data: [
      { id: 1, name: 'Item 1', value: 'Value 1' },
      { id: 2, name: 'Item 2', value: 'Value 2' },
      { id: 3, name: 'Item 3', value: 'Value 3' }
    ]
  }, null, 2);
}

function generateMockReadme(repoPath) {
  const repoName = repoPath.includes('/') ? repoPath.split('/').pop() : repoPath;

  return `# ${repoName}

## Overview

This project is a comprehensive solution for [specific problem domain]. It provides a set of tools and libraries to help developers [specific use case].

## Features

- Feature 1: Description of feature 1
- Feature 2: Description of feature 2
- Feature 3: Description of feature 3
- Feature 4: Description of feature 4

## Quick Start

\`\`\`bash
# Clone the repository
git clone https://github.com/${repoPath}.git

# Install dependencies
npm install

# Run the development server
npm run dev
\`\`\`

## Documentation

For more detailed documentation, please see:

- [Architecture](./docs/architecture.md)
- [API Documentation](./docs/api.md)
- [Contributing Guide](./CONTRIBUTING.md)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.`;
}

function generateMockArchitecture(repoPath) {
  return `# Architecture Overview

## System Components

The system is composed of the following main components:

1. **Frontend Layer**
   - React-based UI components
   - State management with Redux
   - Responsive design with Tailwind CSS

2. **API Layer**
   - RESTful API endpoints
   - GraphQL interface for complex queries
   - Authentication middleware

3. **Service Layer**
   - Business logic implementation
   - Integration with external services
   - Caching mechanisms

4. **Data Layer**
   - Database models and schemas
   - Data access patterns
   - Migration and seeding utilities

## Component Interactions

\`\`\`
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│  Frontend   │────▶│  API Layer  │────▶│  Services   │────▶│  Data Layer │
│             │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
\`\`\`

## Design Patterns

The codebase implements several design patterns:

- **Repository Pattern** for data access
- **Factory Pattern** for object creation
- **Observer Pattern** for event handling
- **Strategy Pattern** for algorithm selection

## Technology Stack

- **Frontend**: React, Redux, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL, Redis for caching
- **DevOps**: Docker, GitHub Actions, AWS

## Future Considerations

- Microservices architecture for better scalability
- Event-driven architecture for real-time features
- Enhanced security measures for sensitive operations`;
}

function generateMockApiDocs(repoPath) {
  return `# API Documentation

## Authentication

### POST /api/auth/login

Authenticates a user and returns a JWT token.

**Request Body:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "password123"
}
\`\`\`

**Response:**
\`\`\`json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
\`\`\`

### POST /api/auth/register

Registers a new user.

**Request Body:**
\`\`\`json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "Jane Smith"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "User registered successfully",
  "userId": "456"
}
\`\`\`

## Users

### GET /api/users/:id

Retrieves user information.

**Parameters:**
- \`id\`: User ID

**Response:**
\`\`\`json
{
  "id": "123",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2023-01-15T12:00:00Z"
}
\`\`\`

### PUT /api/users/:id

Updates user information.

**Parameters:**
- \`id\`: User ID

**Request Body:**
\`\`\`json
{
  "name": "John Smith",
  "email": "john.smith@example.com"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "User updated successfully"
}
\`\`\`

## Error Handling

All API endpoints return standard error responses:

\`\`\`json
{
  "error": true,
  "message": "Error message",
  "code": "ERROR_CODE",
  "status": 400
}
\`\`\``;
}

function generateMockDependencies(repoPath) {
  return `# Dependencies

## Production Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| react | ^18.2.0 | A JavaScript library for building user interfaces |
| react-dom | ^18.2.0 | React package for working with the DOM |
| next | ^13.4.12 | React framework for production |
| @tanstack/react-query | ^4.29.19 | Hooks for fetching, caching and updating data |
| axios | ^1.4.0 | Promise based HTTP client |
| date-fns | ^2.30.0 | Modern JavaScript date utility library |
| zod | ^3.21.4 | TypeScript-first schema validation |
| tailwindcss | ^3.3.3 | A utility-first CSS framework |
| lucide-react | ^0.263.1 | Beautiful & consistent icons |
| clsx | ^2.0.0 | Utility for constructing className strings |

## Development Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| typescript | ^5.1.6 | Typed JavaScript at any scale |
| eslint | ^8.45.0 | Pluggable JavaScript linter |
| prettier | ^3.0.0 | Opinionated code formatter |
| jest | ^29.6.1 | JavaScript testing framework |
| @testing-library/react | ^14.0.0 | React testing utilities |
| cypress | ^12.17.2 | End-to-end testing framework |
| husky | ^8.0.3 | Git hooks made easy |
| lint-staged | ^13.2.3 | Run linters on git staged files |

## Dependency Graph

The project has a moderate dependency tree with approximately 350 transitive dependencies. Key dependency relationships:

- React as the core UI library
- Next.js for server-side rendering and routing
- TanStack Query for data fetching and state management
- Tailwind CSS for styling
- Zod for validation

## Vulnerability Analysis

No critical vulnerabilities detected in the current dependency set. Regular updates are recommended to maintain security.

## Update Strategy

Dependencies are updated on a monthly basis following these guidelines:

1. Minor versions: Updated automatically if tests pass
2. Major versions: Reviewed manually for breaking changes
3. Security patches: Applied immediately`;
}

function generateMockSetup(repoPath) {
  return `# Setup Instructions

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v16 or higher)
- npm (v8 or higher) or yarn (v1.22 or higher)
- Git
- PostgreSQL (v14 or higher)
- Redis (optional, for caching)

## Installation Steps

1. **Clone the repository**

   \`\`\`bash
   git clone https://github.com/${repoPath}.git
   cd ${repoPath.split('/').pop()}
   \`\`\`

2. **Install dependencies**

   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. **Set up environment variables**

   Copy the example environment file and update it with your configuration:

   \`\`\`bash
   cp .env.example .env
   \`\`\`

   Edit the \`.env\` file with your database credentials and other settings.

4. **Set up the database**

   \`\`\`bash
   # Create the database
   npm run db:create
   
   # Run migrations
   npm run db:migrate
   
   # Seed initial data (optional)
   npm run db:seed
   \`\`\`

5. **Start the development server**

   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

   The application should now be running at [http://localhost:3000](http://localhost:3000).

## Configuration Options

The application can be configured through environment variables:

- \`DATABASE_URL\`: PostgreSQL connection string
- \`REDIS_URL\`: Redis connection string (optional)
- \`JWT_SECRET\`: Secret key for JWT token generation
- \`PORT\`: Port to run the server on (default: 3000)
- \`NODE_ENV\`: Environment (development, test, production)

## Running Tests

\`\`\`bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e
\`\`\`

## Deployment

### Production Deployment

\`\`\`bash
# Build the application
npm run build

# Start the production server
npm start
\`\`\`

### Docker Deployment

\`\`\`bash
# Build the Docker image
docker build -t ${repoPath.split('/').pop()} .

# Run the container
docker run -p 3000:3000 ${repoPath.split('/').pop()}
\`\`\``;
}

function getRandomProjectType() {
  const types = ['React', 'Node.js', 'Python', 'Java', 'Go', 'Ruby on Rails', 'Vue.js', 'Angular', 'Django', 'Flask'];
  return types[Math.floor(Math.random() * types.length)];
}

// Start the server with error handling for port conflicts
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.warn(`Warning: Port ${PORT} is already in use.`);
    console.log(`Trying alternative port ${FALLBACK_PORT}...`);
    
    server.listen(FALLBACK_PORT, () => {
      console.log(`Server is running at http://localhost:${FALLBACK_PORT}`);
      console.log(`API endpoint: http://localhost:${FALLBACK_PORT}/api/command`);
      console.log(`Health check: http://localhost:${FALLBACK_PORT}/health`);
    });
  } else {
    console.error('Server error:', e);
  }
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/command`);
  console.log(`Health check: http://localhost:${PORT}/health`);
}); 