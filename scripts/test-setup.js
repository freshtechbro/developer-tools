#!/usr/bin/env node
/**
 * Unified Test Setup for Developer Tools
 * 
 * This script provides a single command to set up and run all components
 * required for testing the web search tool in the unified web interface.
 */

import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import http from 'http';
import https from 'https';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

// Parse command line arguments
function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach((arg, i, argv) => {
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = argv[i + 1];
      const value = nextArg && !nextArg.startsWith('--') ? nextArg : true;
      args[key] = value;
    } else if (arg.startsWith('-')) {
      // Handle short options
      const shortKey = arg.slice(1);
      if (shortKey === 'c') args.config = argv[i + 1];
      if (shortKey === 'i') args['install-deps'] = true;
      if (shortKey === 's') args['skip-health-checks'] = true;
      if (shortKey === 'o') args['open-browser'] = true;
      if (shortKey === 'v') args.verbose = true;
      if (shortKey === 'h') args.help = true;
    }
  });

  // Set defaults
  args.config = args.config || './test-configs/default.json';
  args['install-deps'] = args['install-deps'] !== undefined ? args['install-deps'] : true;
  args['skip-health-checks'] = args['skip-health-checks'] || false;
  args['open-browser'] = args['open-browser'] !== undefined ? args['open-browser'] : true;
  args.verbose = args.verbose || false;

  // Show help if requested
  if (args.help) {
    console.log(`
    Unified Test Setup for Developer Tools
    
    Options:
      --config, -c          Path to configuration file (default: ./test-configs/default.json)
      --install-deps, -i    Install dependencies automatically (default: true)
      --skip-health-checks, -s  Skip health checks (default: false)
      --open-browser, -o    Open browser automatically (default: true)
      --verbose, -v         Verbose output (default: false)
      --help, -h            Show this help message
    `);
    process.exit(0);
  }

  return args;
}

const argv = parseArgs();

// Logger utility
const logger = {
  info: (message) => console.log(`${colors.blue}[INFO]${colors.reset} ${message}`),
  success: (message) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`),
  warn: (message) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`),
  error: (message) => console.error(`${colors.red}[ERROR]${colors.reset} ${message}`),
  debug: (message) => argv.verbose && console.log(`${colors.dim}[DEBUG]${colors.reset} ${message}`)
};

// Utility to check if a command exists
function commandExists(command) {
  try {
    execSync(`where ${command}`, { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

// Check and install dependencies
async function checkDependencies(config) {
  logger.info('Checking dependencies...');
  
  // Check command-line tools
  for (const cmd of config.dependencies.required) {
    if (!commandExists(cmd)) {
      logger.error(`Required tool not found: ${cmd}`);
      process.exit(1);
    }
  }
  
  // Check if packages are already installed
  if (argv['install-deps']) {
    logger.info('Checking for required npm packages...');
    try {
      // Try to run a quick check on each package
      for (const pkg of config.dependencies.packages) {
        try {
          execSync(`npm list ${pkg} --depth=0`, { stdio: 'ignore' });
          logger.debug(`Package ${pkg} is installed`);
        } catch (e) {
          logger.warn(`Package ${pkg} may be missing, but we'll continue anyway`);
        }
      }
      logger.success('Dependency check completed');
    } catch (error) {
      logger.error(`Failed to check dependencies: ${error.message}`);
      process.exit(1);
    }
  }
}

// Set up environment variables
function setupEnvironment(config) {
  logger.info('Setting up environment...');
  
  // Set environment variables from config
  Object.entries(config.environment).forEach(([key, value]) => {
    process.env[key] = value;
    logger.debug(`Set environment variable: ${key}=${value}`);
  });
  
  // Check for required API keys
  Object.entries(config.apiKeys).forEach(([provider, keyVar]) => {
    // Replace ${VAR} with actual environment variable
    const keyValue = keyVar.replace(/\${([^}]+)}/g, (_, name) => process.env[name] || '');
    
    if (!keyValue) {
      logger.warn(`API key not found for provider: ${provider}`);
    } else {
      process.env[`${provider.toUpperCase()}_API_KEY`] = keyValue;
      logger.debug(`Set API key for provider: ${provider}`);
    }
  });
  
  // Create necessary directories
  const storageDir = path.resolve(process.cwd(), config.environment.STORAGE_DIR);
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
    logger.debug(`Created storage directory: ${storageDir}`);
  }
  
  // Create report directory
  const reportDir = path.resolve(process.cwd(), config.test.reportDir);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
    logger.debug(`Created report directory: ${reportDir}`);
  }
}

// Start server
function startServer(serverConfig, name) {
  return new Promise((resolve, reject) => {
    logger.info(`Starting ${name} server...`);
    
    const serverPath = path.resolve(process.cwd(), serverConfig.path);
    if (!fs.existsSync(serverPath)) {
      return reject(new Error(`Server directory not found: ${serverPath}`));
    }
    
    const [cmd, ...args] = serverConfig.command.split(' ');
    const server = spawn(cmd, args, { 
      cwd: serverPath,
      shell: true,
      env: { ...process.env },
      stdio: argv.verbose ? 'inherit' : 'pipe'
    });
    
    let stdoutData = '';
    let stderrData = '';
    
    if (server.stdout) {
      server.stdout.on('data', (data) => {
        stdoutData += data.toString();
        if (argv.verbose) {
          process.stdout.write(`${colors.dim}[${name}]${colors.reset} ${data}`);
        }
      });
    }
    
    if (server.stderr) {
      server.stderr.on('data', (data) => {
        stderrData += data.toString();
        if (argv.verbose) {
          process.stderr.write(`${colors.dim}[${name}]${colors.red} ${data}${colors.reset}`);
        }
      });
    }
    
    server.on('error', (error) => {
      reject(new Error(`Failed to start ${name} server: ${error.message}`));
    });
    
    server.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${name} server exited with code ${code}`));
      }
    });
    
    // Perform health check if not skipped
    if (!argv['skip-health-checks']) {
      checkServerHealth(serverConfig.healthCheck, serverConfig.timeout)
        .then(() => {
          logger.success(`${name} server started successfully`);
          resolve(server);
        })
        .catch((error) => {
          server.kill();
          reject(new Error(`Health check failed for ${name} server: ${error.message}`));
        });
    } else {
      logger.warn(`Skipping health check for ${name} server`);
      setTimeout(() => {
        logger.success(`${name} server started (no health check)`);
        resolve(server);
      }, 2000);
    }
  });
}

// Check server health using internal http module
async function checkServerHealth(url, timeout) {
  logger.debug(`Checking server health: ${url}`);
  
  const startTime = Date.now();
  
  // Function to make HTTP request without external dependencies
  function makeRequest(url) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      const req = protocol.get(url, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(true);
        } else {
          reject(new Error(`HTTP status code: ${res.statusCode}`));
        }
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }
  
  while (Date.now() - startTime < timeout) {
    try {
      await makeRequest(url);
      return true;
    } catch (error) {
      // Ignore errors and retry
      logger.debug(`Health check retry: ${error.message}`);
    }
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error(`Server did not respond within ${timeout}ms`);
}

// Open browser using system default browser
function openBrowser(config) {
  if (!argv['open-browser']) {
    return;
  }
  
  logger.info('Opening browser for testing...');
  
  try {
    const url = `http://localhost:${config.environment.PORT}`;
    
    // Cross-platform open browser command
    let command;
    switch (process.platform) {
      case 'win32':
        command = `start ${url}`;
        break;
      case 'darwin':
        command = `open ${url}`;
        break;
      default:
        command = `xdg-open ${url}`;
    }
    
    execSync(command);
    logger.success('Browser opened successfully');
  } catch (error) {
    logger.error(`Failed to open browser: ${error.message}`);
  }
}

// Cleanup and exit
function cleanupAndExit(servers) {
  logger.info('Shutting down servers...');
  
  for (const [name, server] of Object.entries(servers)) {
    if (server && typeof server.kill === 'function') {
      server.kill();
      logger.debug(`${name} server stopped`);
    } else if (server && typeof server.close === 'function') {
      server.close();
      logger.debug(`${name} closed`);
    }
  }
  
  logger.success('All servers stopped. Exiting...');
  process.exit(0);
}

// Main function
async function main() {
  logger.info('Starting unified test setup...');
  
  // Load configuration
  let config;
  try {
    const configPath = path.resolve(process.cwd(), argv.config);
    if (!fs.existsSync(configPath)) {
      throw new Error(`Configuration file not found: ${configPath}`);
    }
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    logger.success('Configuration loaded successfully');
  } catch (error) {
    logger.error(`Failed to load configuration: ${error.message}`);
    process.exit(1);
  }
  
  // Setup process
  try {
    // Check dependencies
    await checkDependencies(config);
    
    // Setup environment
    setupEnvironment(config);
    
    // Start servers
    const mcpServer = await startServer(config.servers.mcp, 'MCP');
    const webServer = await startServer(config.servers.web, 'Web Interface');
    
    // Register clean-up handler
    const servers = { mcp: mcpServer, web: webServer };
    process.on('SIGINT', () => cleanupAndExit(servers));
    process.on('SIGTERM', () => cleanupAndExit(servers));
    
    // Open browser
    openBrowser(config);
    
    logger.info('Setup complete. Ready for testing.');
    logger.info(`Web interface available at: http://localhost:${config.environment.PORT}`);
    logger.info(`MCP server available at: http://localhost:${config.environment.MCP_PORT}`);
    logger.info('Press Ctrl+C to stop servers and exit');
    
  } catch (error) {
    logger.error(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  logger.error(`Unified test setup failed: ${error.message}`);
  process.exit(1);
}); 