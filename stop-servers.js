#!/usr/bin/env node

import { spawn } from 'child_process';

console.log('=== Stopping servers ===');

// Function to execute a command
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, { shell: true });
    let output = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      console.error(`Error: ${data}`);
    });

    process.on('close', (code) => {
      if (code !== 0) {
        console.log(`Command '${command}' exited with code ${code}`);
      }
      resolve(output);
    });
  });
}

// For Windows, use netstat and taskkill
async function stopWindowsProcesses() {
  const ports = [3001, 3002, 3003];
  
  for (const port of ports) {
    console.log(`Checking for processes on port ${port}...`);
    
    try {
      // Find process using the port
      const netstatOutput = await executeCommand(`netstat -ano | findstr :${port}`);
      const lines = netstatOutput.split('\n');
      
      for (const line of lines) {
        if (line.includes(`LISTENING`)) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          
          if (pid && /^\d+$/.test(pid)) {
            console.log(`Found process ${pid} using port ${port}, stopping...`);
            await executeCommand(`taskkill /F /PID ${pid}`);
            console.log(`Process ${pid} stopped.`);
          }
        }
      }
    } catch (err) {
      console.log(`No processes found using port ${port}`);
    }
  }
}

// Main function
async function main() {
  const platform = process.platform;
  
  if (platform === 'win32') {
    await stopWindowsProcesses();
  } else {
    console.log('This script currently only supports Windows. For Unix-based systems, use:');
    console.log('lsof -i :PORT | grep LISTEN | awk \'{print $2}\' | xargs kill -9');
  }
  
  console.log('All matching processes have been stopped.');
}

main().catch(err => {
  console.error('Error stopping servers:', err);
  process.exit(1);
}); 