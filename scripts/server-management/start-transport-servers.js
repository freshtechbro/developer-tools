#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chalk from 'chalk';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../..');

// Server configurations
const servers = [
  {
    name: 'HTTP Transport Server',
    command: 'node',
    args: ['packages/server/src/http-transport.js'],
    color: 'green',
    logPrefix: '[HTTP]'
  },
  {
    name: 'SSE Transport Server',
    command: 'node',
    args: ['packages/server/src/sse-transport.js'],
    color: 'blue',
    logPrefix: '[SSE]'
  }
];

// Store server processes
const serverProcesses = [];

// Function to start a server
function startServer(server) {
  console.log(chalk[server.color](`Starting ${server.name}...`));
  
  const process = spawn(server.command, server.args, {
    cwd: rootDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false
  });
  
  serverProcesses.push(process);
  
  process.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      console.log(chalk[server.color](`${server.logPrefix} ${line}`));
    });
  });
  
  process.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      console.error(chalk.red(`${server.logPrefix} ERROR: ${line}`));
    });
  });
  
  process.on('close', (code) => {
    console.log(chalk[server.color](`${server.name} exited with code ${code}`));
    
    // Remove from the list of processes
    const index = serverProcesses.indexOf(process);
    if (index !== -1) {
      serverProcesses.splice(index, 1);
    }
    
    // If all servers have stopped, exit the script
    if (serverProcesses.length === 0) {
      console.log(chalk.yellow('All servers have stopped. Exiting...'));
      process.exit(0);
    }
  });
  
  return process;
}

// Start all servers
console.log(chalk.yellow('=== Starting Transport Servers ==='));
servers.forEach(server => startServer(server));

console.log(chalk.green('\nAll servers started successfully!'));
console.log(chalk.cyan('HTTP Transport server is running on: http://localhost:3001'));
console.log(chalk.cyan('SSE Transport server is running on: http://localhost:3002'));
console.log(chalk.magenta('\nPress Ctrl+C to stop all servers.'));

// Handle process termination
process.on('SIGINT', () => {
  console.log(chalk.yellow('\nShutting down all servers...'));
  
  // Terminate all server processes
  serverProcesses.forEach(process => {
    process.kill('SIGTERM');
  });
  
  // Exit after a short delay to allow proper shutdown
  setTimeout(() => {
    console.log(chalk.yellow('Exiting...'));
    process.exit(0);
  }, 500);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught exception:'));
  console.error(error);
  
  // Terminate all server processes
  serverProcesses.forEach(process => {
    process.kill('SIGTERM');
  });
  
  process.exit(1);
}); 