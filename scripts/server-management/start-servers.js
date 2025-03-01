import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Configuration
const servers = [
  {
    name: 'HTTP Transport',
    script: path.join(projectRoot, 'servers', 'http.js'),
    port: 3001,
    endpoint: '/mcp'
  },
  {
    name: 'SSE Transport',
    script: path.join(projectRoot, 'servers', 'sse.js'),
    port: 3002,
    endpoint: '/mcp-sse'
  },
  {
    name: 'Web Interface',
    command: 'npx',
    args: ['http-server', path.join(projectRoot, 'clients'), '-p', '3003', '--cors'],
    port: 3003,
    endpoint: '/index.html'
  }
];

// Spawn a server process and handle logging
function startServer(server) {
  console.log(`Starting ${server.name} on port ${server.port}...`);
  
  const command = server.command || 'node';
  const args = server.command ? server.args : [server.script];
  
  const process = spawn(command, args, {
    cwd: projectRoot,
    detached: false
  });
  
  process.stdout.on('data', (data) => {
    console.log(`[${server.name}] ${data.toString().trim()}`);
  });
  
  process.stderr.on('data', (data) => {
    console.error(`[${server.name} ERROR] ${data.toString().trim()}`);
  });
  
  process.on('close', (code) => {
    if (code !== 0) {
      console.error(`[${server.name}] Process exited with code ${code}`);
    } else {
      console.log(`[${server.name}] Process completed successfully`);
    }
  });
  
  // Store process reference
  server.process = process;
  
  return process;
}

// Start all servers
function startAllServers() {
  console.log('Starting all servers...');
  
  servers.forEach(startServer);
  
  console.log('\nAll servers started!');
  console.log('====================');
  servers.forEach(server => {
    console.log(`${server.name}: http://localhost:${server.port}${server.endpoint}`);
  });
  console.log('\nPress Ctrl+C to stop all servers');
}

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\nGracefully stopping all servers...');
  
  servers.forEach(server => {
    if (server.process) {
      console.log(`Stopping ${server.name}...`);
      // Negative PID kills the process group
      process.kill(-server.process.pid);
    }
  });
  
  console.log('All servers stopped');
  process.exit(0);
});

// Start all servers
startAllServers(); 