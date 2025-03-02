#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';
import ora from 'ora';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration defaults
const DEFAULT_CONFIG = {
  httpTransport: {
    enabled: true,
    port: 3001,
    path: '/mcp'
  },
  sseTransport: {
    enabled: true,
    port: 3002,
    path: '/mcp-sse'
  },
  webInterface: {
    enabled: true,
    port: 3003
  },
  restApi: {
    enabled: true,
    port: 3000
  }
};

// Required API keys
const REQUIRED_API_KEYS = [
  { name: 'PERPLEXITY_API_KEY', description: 'Perplexity API Key (for web search)' },
  { name: 'GEMINI_API_KEY', description: 'Google Gemini API Key (for repo analysis)' }
];

// Optional API keys
const OPTIONAL_API_KEYS = [
  { name: 'OPENAI_API_KEY', description: 'OpenAI API Key (fallback for web search)' }
];

/**
 * Main installation function
 */
async function install() {
  console.log(chalk.blue.bold('\n=== Developer Tools Installation ===\n'));
  
  try {
    // Check Node.js version
    const nodeVersion = process.version;
    console.log(chalk.gray(`Node.js version: ${nodeVersion}`));
    
    const versionMatch = nodeVersion.match(/v(\d+)\./);
    const majorVersion = versionMatch ? parseInt(versionMatch[1], 10) : 0;
    
    if (majorVersion < 16) {
      console.log(chalk.red('Error: Node.js version 16 or higher is required.'));
      process.exit(1);
    }
    
    // Welcome message
    console.log(chalk.green('Welcome to the Developer Tools installation!'));
    console.log('This script will guide you through setting up the project.\n');
    
    // Installation steps
    await checkDependencies();
    const config = await configureTransports();
    const apiKeys = await collectApiKeys();
    await createEnvFile(apiKeys);
    await updateConfig(config);
    await installDependencies();
    await setupCursorIntegration();
    
    // Success message
    console.log(chalk.green.bold('\n✅ Installation completed successfully!\n'));
    console.log('To start the server, run:');
    console.log(chalk.cyan('  npm start'));
    console.log('\nTo start the development server with hot reloading:');
    console.log(chalk.cyan('  npm run dev'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Installation failed:'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

/**
 * Check for required dependencies
 */
async function checkDependencies() {
  const spinner = ora('Checking dependencies...').start();
  
  try {
    // Check for npm
    execSync('npm --version', { stdio: 'ignore' });
    
    spinner.succeed('Dependencies check passed');
  } catch (error) {
    spinner.fail('Dependencies check failed');
    throw new Error('npm is required but not found. Please install npm and try again.');
  }
}

/**
 * Configure transport settings
 */
async function configureTransports() {
  console.log(chalk.blue.bold('\nTransport Configuration\n'));
  console.log('Configure how the MCP server will communicate with clients:');
  
  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'httpEnabled',
      message: 'Enable HTTP transport?',
      default: DEFAULT_CONFIG.httpTransport.enabled
    },
    {
      type: 'number',
      name: 'httpPort',
      message: 'HTTP transport port:',
      default: DEFAULT_CONFIG.httpTransport.port,
      when: (answers) => answers.httpEnabled
    },
    {
      type: 'input',
      name: 'httpPath',
      message: 'HTTP transport path:',
      default: DEFAULT_CONFIG.httpTransport.path,
      when: (answers) => answers.httpEnabled
    },
    {
      type: 'confirm',
      name: 'sseEnabled',
      message: 'Enable SSE transport?',
      default: DEFAULT_CONFIG.sseTransport.enabled
    },
    {
      type: 'number',
      name: 'ssePort',
      message: 'SSE transport port:',
      default: DEFAULT_CONFIG.sseTransport.port,
      when: (answers) => answers.sseEnabled
    },
    {
      type: 'input',
      name: 'ssePath',
      message: 'SSE transport path:',
      default: DEFAULT_CONFIG.sseTransport.path,
      when: (answers) => answers.sseEnabled
    },
    {
      type: 'confirm',
      name: 'webEnabled',
      message: 'Enable web interface?',
      default: DEFAULT_CONFIG.webInterface.enabled
    },
    {
      type: 'number',
      name: 'webPort',
      message: 'Web interface port:',
      default: DEFAULT_CONFIG.webInterface.port,
      when: (answers) => answers.webEnabled
    },
    {
      type: 'confirm',
      name: 'restEnabled',
      message: 'Enable REST API?',
      default: DEFAULT_CONFIG.restApi.enabled
    },
    {
      type: 'number',
      name: 'restPort',
      message: 'REST API port:',
      default: DEFAULT_CONFIG.restApi.port,
      when: (answers) => answers.restEnabled
    }
  ]);
  
  // Format the configuration
  return {
    httpTransport: {
      enabled: answers.httpEnabled,
      port: answers.httpPort,
      path: answers.httpPath
    },
    sseTransport: {
      enabled: answers.sseEnabled,
      port: answers.ssePort,
      path: answers.ssePath
    },
    webInterface: {
      enabled: answers.webEnabled,
      port: answers.webPort
    },
    restApi: {
      enabled: answers.restEnabled,
      port: answers.restPort
    }
  };
}

/**
 * Collect API keys from the user
 */
async function collectApiKeys() {
  console.log(chalk.blue.bold('\nAPI Keys Configuration\n'));
  console.log('Enter your API keys for the various services:');
  
  const requiredQuestions = REQUIRED_API_KEYS.map(key => ({
    type: 'password',
    name: key.name,
    message: `${key.description} (required):`,
    validate: (input) => input.trim() !== '' ? true : `${key.name} is required`
  }));
  
  const optionalQuestions = OPTIONAL_API_KEYS.map(key => ({
    type: 'password',
    name: key.name,
    message: `${key.description} (optional):`,
  }));
  
  const requiredAnswers = await inquirer.prompt(requiredQuestions);
  const optionalAnswers = await inquirer.prompt(optionalQuestions);
  
  return { ...requiredAnswers, ...optionalAnswers };
}

/**
 * Create or update the .env file with API keys
 */
async function createEnvFile(apiKeys) {
  const spinner = ora('Creating .env file...').start();
  
  try {
    // Check if .env file exists
    let envContent = '';
    try {
      envContent = await fs.readFile(path.join(__dirname, '.env'), 'utf8');
    } catch (error) {
      // File doesn't exist, create it
      envContent = '# Environment Variables\n\n';
    }
    
    // Add or update API keys
    for (const [key, value] of Object.entries(apiKeys)) {
      if (value && value.trim() !== '') {
        // Check if key already exists in the file
        const regex = new RegExp(`^${key}=.*`, 'm');
        if (regex.test(envContent)) {
          // Update existing key
          envContent = envContent.replace(regex, `${key}=${value}`);
        } else {
          // Add new key
          envContent += `${key}=${value}\n`;
        }
      }
    }
    
    // Add transport configuration
    envContent += '\n# Transport Configuration\n';
    envContent += 'HTTP_TRANSPORT_ENABLED=true\n';
    envContent += 'SSE_TRANSPORT_ENABLED=true\n';
    envContent += 'WEB_INTERFACE_ENABLED=true\n';
    
    // Write the file
    await fs.writeFile(path.join(__dirname, '.env'), envContent);
    
    spinner.succeed('.env file created successfully');
  } catch (error) {
    spinner.fail('Failed to create .env file');
    throw error;
  }
}

/**
 * Update configuration files
 */
async function updateConfig(config) {
  const spinner = ora('Updating configuration...').start();
  
  try {
    // Create config directory if it doesn't exist
    try {
      await fs.mkdir(path.join(__dirname, 'config'), { recursive: true });
    } catch (error) {
      // Directory already exists
    }
    
    // Create or update local config file
    const configContent = `// Local configuration
export const localConfig = ${JSON.stringify(config, null, 2)};
`;
    
    await fs.writeFile(path.join(__dirname, 'config', 'local.js'), configContent);
    
    spinner.succeed('Configuration updated successfully');
  } catch (error) {
    spinner.fail('Failed to update configuration');
    throw error;
  }
}

/**
 * Install dependencies
 */
async function installDependencies() {
  console.log(chalk.blue.bold('\nInstalling Dependencies\n'));
  
  const spinner = ora('Installing dependencies...').start();
  
  return new Promise((resolve, reject) => {
    const install = spawn('npm', ['install'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });
    
    install.stdout.on('data', (data) => {
      spinner.text = `Installing dependencies... ${data.toString().trim().split('\n').pop()}`;
    });
    
    install.stderr.on('data', (data) => {
      spinner.text = `Installing dependencies... ${data.toString().trim().split('\n').pop()}`;
    });
    
    install.on('close', (code) => {
      if (code === 0) {
        spinner.succeed('Dependencies installed successfully');
        resolve();
      } else {
        spinner.fail('Failed to install dependencies');
        reject(new Error('npm install failed'));
      }
    });
  });
}

/**
 * Setup Cursor IDE integration
 */
async function setupCursorIntegration() {
  console.log(chalk.blue.bold('\nCursor IDE Integration\n'));
  
  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'setupCursor',
      message: 'Set up Cursor IDE integration?',
      default: true
    }
  ]);
  
  if (!answers.setupCursor) {
    console.log(chalk.gray('Skipping Cursor IDE integration'));
    return;
  }
  
  const spinner = ora('Setting up Cursor IDE integration...').start();
  
  try {
    // Create .cursorrules file
    const cursorRulesContent = `# Cursor IDE Integration Rules

# MCP Server Integration
mcp-server-integration:
  description: |
    This project uses the Model Context Protocol (MCP) for AI integration.
    The server supports multiple transport layers (HTTP and SSE) for communication.
    
    Key components:
    - Transport Factory: Creates and configures transport instances
    - Server: Connects to transports and handles tool execution
    - Tools: Web search, repo analysis, and browser automation
    
  glob: "**/*.{ts,js}"

# Installation
installation:
  description: |
    To install and configure the project:
    1. Run 'node install.js' for interactive setup
    2. Configure API keys and transport settings
    3. Start the server with 'npm start'
    
  glob: "*.{md,js,ts}"
`;
    
    await fs.writeFile(path.join(__dirname, '.cursorrules'), cursorRulesContent);
    
    spinner.succeed('Cursor IDE integration set up successfully');
  } catch (error) {
    spinner.fail('Failed to set up Cursor IDE integration');
    throw error;
  }
}

// Run the installation
install(); 