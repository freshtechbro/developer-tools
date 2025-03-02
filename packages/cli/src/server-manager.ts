import { spawn } from 'child_process';
import * as path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Options for starting the MCP server
 */
interface ServerOptions {
  port?: string;
  stdio?: boolean;
  api?: boolean;
}

/**
 * Start the MCP server
 * @param options Server options
 */
export async function startMcpServer(options: ServerOptions): Promise<void> {
  // Find the path to the MCP server module
  const mcpServerPath = path.resolve(__dirname, '../../../mcp-server/dist/server.js');
  console.log(chalk.blue(`Starting MCP server from: ${mcpServerPath}`));
  
  // Prepare environment variables
  const env = {
    ...process.env,
    PORT: options.port || '3001',
    API_ENABLED: options.api !== false ? 'true' : 'false',
  };
  
  // Start the server
  const server = spawn('node', [mcpServerPath], {
    env,
    stdio: 'inherit',
    shell: false
  });
  
  // Log server status
  console.log(chalk.green('MCP Server started!'));
  console.log(chalk.blue('Press Ctrl+C to stop the server'));
  
  // Handle server exit
  server.on('close', (code) => {
    if (code === 0) {
      console.log(chalk.green('MCP Server stopped gracefully'));
    } else {
      console.error(chalk.red(`MCP Server exited with code ${code}`));
    }
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\nStopping MCP Server...'));
    server.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log(chalk.yellow('\nStopping MCP Server...'));
    server.kill('SIGTERM');
  });
  
  // Keep the process running
  await new Promise(() => {});
} 