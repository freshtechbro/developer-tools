#!/usr/bin/env node

import { spawn } from 'child_process';

// Start the HTTP transport server
console.log('Starting HTTP transport server...');

const server = spawn('node', ['packages/server/src/http-transport.js'], {
  stdio: 'inherit',
  shell: true
});

// Handle server exit
server.on('close', (code) => {
  console.log(`HTTP transport server exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down HTTP transport server...');
  server.kill('SIGINT');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  server.kill('SIGINT');
  process.exit(1);
}); 