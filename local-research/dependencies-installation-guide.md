Packing repository using repomix...
Querying Gemini AI using gemini-2.0-flash-thinking-exp-01-21...

# MCP Server Dependencies Installation Guide

This guide provides step-by-step instructions for installing and configuring all dependencies required for the MCP server project.

## Prerequisites

1. **Node.js and npm**
   ```bash
   # Check if Node.js is installed
   node --version  # Should be v14 or later
   npm --version   # Should be v6 or later
   
   # If not installed, download from https://nodejs.org/
   ```

2. **Git**
   ```bash
   # Check if Git is installed
   git --version
   
   # If not installed, download from https://git-scm.com/
   ```

## Project Setup

1. **Create Project Directory**
   ```bash
   mkdir mcp-server
   cd mcp-server
   ```

2. **Initialize Git Repository**
   ```bash
   git init
   ```

3. **Create .gitignore**
   ```bash
   echo "node_modules/
   dist/
   .env
   *.log" > .gitignore
   ```

## Core Dependencies Installation

### 1. Model Context Protocol SDK
```bash
# Install MCP SDK
npm install @modelcontextprotocol/sdk@1.2.0

# Verify installation
npm list @modelcontextprotocol/sdk
```

### 2. Perplexity API
```bash
# Install Perplexity API client
npm install perplexity-api@1.1.2

# Verify installation
npm list perplexity-api
```

### 3. GitHub API Client (Octokit)
```bash
# Install Octokit REST
npm install @octokit/rest@19.0.13

# Verify installation
npm list @octokit/rest
```

### 4. Playwright (Browser Automation)
```bash
# Install Playwright
npm install playwright@1.41.2

# Install browser binaries
npx playwright install

# Install supported browsers (chromium, firefox, webkit)
npx playwright install-deps

# Verify installation
npx playwright --version
```

### 5. Axios (HTTP Client)
```bash
# Install Axios
npm install axios@1.6.5

# Verify installation
npm list axios
```

### 6. Dotenv (Environment Variables)
```bash
# Install dotenv
npm install dotenv@16.3.1

# Verify installation
npm list dotenv

# Create .env file
touch .env
```

## Development Dependencies Installation

### 1. TypeScript
```bash
# Install TypeScript
npm install --save-dev typescript@5.3.3

# Initialize TypeScript configuration
npx tsc --init

# Verify installation
npx tsc --version
```

### 2. TypeScript Node
```bash
# Install ts-node
npm install --save-dev ts-node@10.9.2

# Verify installation
npx ts-node --version
```

### 3. Node.js Types
```bash
# Install Node.js types
npm install --save-dev @types/node@20.11.5

# Verify installation
npm list @types/node
```

## Configuration Files Setup

### 1. TypeScript Configuration (tsconfig.json)
```bash
# Create tsconfig.json with recommended settings
cat > tsconfig.json << EOL
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOL
```

### 2. Environment Variables (.env)
```bash
# Create .env file with required variables
cat > .env << EOL
# Required for web search functionality
PERPLEXITY_API_KEY=your_perplexity_api_key

# Required for GitHub integration
GITHUB_TOKEN=your_github_token

# Optional configuration
NODE_ENV=development
LOG_LEVEL=info
EOL
```

### 3. Package.json Scripts
```bash
# Add useful scripts to package.json
npm pkg set scripts.build="tsc"
npm pkg set scripts.start="node dist/server.js"
npm pkg set scripts.dev="ts-node src/server.ts"
npm pkg set scripts.test="echo \"No tests specified\" && exit 1"
```

## Project Structure Setup
```bash
# Create source directory
mkdir src

# Create directories for capabilities
mkdir -p src/capabilities/resources
mkdir -p src/capabilities/tools

# Create directories for utilities
mkdir -p src/utils
mkdir -p src/config
```

## Verification Steps

1. **Verify All Dependencies**
   ```bash
   npm list
   ```

2. **Verify TypeScript Setup**
   ```bash
   # Create a test TypeScript file
   echo "console.log('TypeScript is working!')" > src/test.ts
   
   # Try compiling it
   npx tsc
   ```

3. **Verify Playwright Setup**
   ```bash
   # Run Playwright test
   npx playwright --version
   ```

## Troubleshooting

### Common Issues and Solutions

1. **Node Version Mismatch**
   ```bash
   # Check Node.js version
   node --version
   
   # If needed, install nvm and switch version
   nvm install 14
   nvm use 14
   ```

2. **Permission Issues**
   ```bash
   # If npm install fails with permission errors
   sudo npm install -g npm@latest  # On Linux/macOS
   # Or run PowerShell as Administrator on Windows
   ```

3. **Playwright Browser Installation Issues**
   ```bash
   # If browser installation fails
   npx playwright install --force
   ```

4. **TypeScript Configuration Issues**
   ```bash
   # Reset TypeScript configuration
   rm tsconfig.json
   npx tsc --init
   ```

### Dependency Version Conflicts

If you encounter version conflicts:
1. Clear npm cache: `npm cache clean --force`
2. Delete node_modules: `rm -rf node_modules`
3. Delete package-lock.json: `rm package-lock.json`
4. Reinstall dependencies: `npm install`

## Post-Installation Verification

Create a simple test file to verify all major dependencies:

```typescript
// src/test-setup.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { chromium } from 'playwright';
import { Octokit } from '@octokit/rest';
import axios from 'axios';
import dotenv from 'dotenv';

async function testSetup() {
  try {
    // Test MCP SDK
    const server = new Server({
      name: "test-server",
      version: "1.0.0"
    }, {
      capabilities: {}
    });
    console.log('✅ MCP SDK working');

    // Test Playwright
    const browser = await chromium.launch();
    await browser.close();
    console.log('✅ Playwright working');

    // Test Octokit
    const octokit = new Octokit();
    console.log('✅ Octokit working');

    // Test Axios
    await axios.get('https://api.github.com');
    console.log('✅ Axios working');

    // Test dotenv
    dotenv.config();
    console.log('✅ dotenv working');

  } catch (error) {
    console.error('❌ Setup test failed:', error);
  }
}

testSetup();
```

Run the test:
```bash
npx ts-node src/test-setup.ts
```

## Next Steps

After successful installation:
1. Set up your API keys in `.env`
2. Start implementing your MCP server
3. Run the verification test
4. Begin development using `npm run dev`