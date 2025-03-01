import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== Building Unified Test Interface ===');

// Check if the unified-test-interface directory exists
const uiDir = path.join(__dirname, 'unified-test-interface');
if (!fs.existsSync(uiDir)) {
  console.error('Error: unified-test-interface directory not found');
  process.exit(1);
}

try {
  // Navigate to the UI directory and install dependencies
  console.log('Installing dependencies...');
  execSync('npm install', { 
    cwd: uiDir, 
    stdio: 'inherit' 
  });

  // Build the UI
  console.log('Building React application...');
  execSync('npm run build', { 
    cwd: uiDir, 
    stdio: 'inherit' 
  });

  console.log('\n✅ Unified Test Interface built successfully!');
  console.log('To start the backend server with the built UI:');
  console.log('npm run start:unified-backend');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 