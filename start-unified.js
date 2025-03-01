import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== Starting Unified Test Interface ===');
console.log('First, stopping any existing servers...');

// Run the stop-servers script first
const stopProcess = spawn('node', ['stop-servers.js'], {
  cwd: __dirname,
  stdio: 'inherit'
});

stopProcess.on('close', (code) => {
  if (code !== 0) {
    console.warn(`Warning: stop-servers exited with code ${code}`);
  }
  
  console.log('Starting backend server...');
  // Start the backend server
  const backendProcess = spawn('node', ['unified-backend.js'], {
    stdio: 'inherit',
    shell: true
  });

  console.log(`Backend server process started with PID: ${backendProcess.pid}`);

  // Listen for process exit
  process.on('SIGINT', () => {
    console.log('Stopping servers...');
    backendProcess.kill('SIGINT');
    process.exit(0);
  });

  // Listen for backend process exit
  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
    process.exit(code);
  });

  console.log('\nThe unified backend is now running!');
  console.log('To use the development interface:');
  console.log('1. Open a new terminal');
  console.log('2. Navigate to the unified-test-interface directory');
  console.log('3. Run: npm run dev');
  console.log('\nOr to build and serve the production version:');
  console.log('1. Navigate to the unified-test-interface directory');
  console.log('2. Run: npm run build');
  console.log('3. Then the built interface will be served from the backend');
  console.log('\nPress Ctrl+C to stop the server');
}); 