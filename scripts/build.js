#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Build order - shared must be built first
const buildOrder = [
  'shared',
  'server',
  'client'
];

async function buildPackage(packageName) {
  const packageDir = path.join(rootDir, 'packages', packageName);
  console.log(`Building package: ${packageName}...`);
  
  // Path to node_modules/.bin/tsc
  const tscPath = path.join(rootDir, 'node_modules', '.bin', 'tsc');
  
  try {
    // Run tsc in the package directory - use the TypeScript compiler from node_modules/.bin
    const { stdout, stderr } = await execAsync(`"${tscPath}" -b`, { cwd: packageDir });
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log(`Successfully built package: ${packageName}`);
    return true;
  } catch (error) {
    console.error(`Error building package ${packageName}:`, error.message);
    return false;
  }
}

async function buildAll() {
  console.log('Building all packages in order...');
  
  for (const packageName of buildOrder) {
    const success = await buildPackage(packageName);
    if (!success) {
      console.error(`Build failed at package: ${packageName}. Stopping build process.`);
      process.exit(1);
    }
  }
  
  console.log('All packages built successfully!');
}

buildAll().catch(error => {
  console.error('Build failed:', error);
  process.exit(1);
}); 