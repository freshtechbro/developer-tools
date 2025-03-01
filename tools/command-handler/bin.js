#!/usr/bin/env node

// This is a simple wrapper script to run the command handler
// It ensures that the TypeScript code is properly transpiled and executed

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the CLI script
const cliPath = join(__dirname, 'index.js');

// Spawn the CLI process with all arguments
const child = spawn(process.execPath, [cliPath, ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: false
});

// Handle process exit
child.on('exit', (code) => {
  process.exit(code || 0);
});

// Handle process errors
child.on('error', (err) => {
  console.error('Failed to start developer-tools CLI:', err);
  process.exit(1);
}); 