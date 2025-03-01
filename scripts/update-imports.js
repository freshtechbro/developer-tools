#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Define mapping of old imports to new package-based imports
const importMappings = {
  // Utils
  '../utils/logger.js': '@developer-tools/shared/logger',
  '../../utils/logger.js': '@developer-tools/shared/logger',
  '../../../utils/logger.js': '@developer-tools/shared/logger',
  '../utils/rate-limiter.js': '@developer-tools/shared/rate-limiter',
  '../../utils/rate-limiter.js': '@developer-tools/shared/rate-limiter',
  '../../../utils/rate-limiter.js': '@developer-tools/shared/rate-limiter',
  
  // Types
  '../types/tool.js': '@developer-tools/shared/types/tool',
  '../../types/tool.js': '@developer-tools/shared/types/tool',
  '../../../types/tool.js': '@developer-tools/shared/types/tool',
  
  // Config
  '../config/index.js': '@developer-tools/shared/config',
  '../../config/index.js': '@developer-tools/shared/config',
  '../../../config/index.js': '@developer-tools/shared/config',
  
  // Services
  '../services/browser.service.js': '@developer-tools/server/services/browser.service',
  '../../services/browser.service.js': '@developer-tools/server/services/browser.service',
  '../../../services/browser.service.js': '@developer-tools/server/services/browser.service',
  '../services/file-storage.service.js': '@developer-tools/server/services/file-storage.service',
  '../../services/file-storage.service.js': '@developer-tools/server/services/file-storage.service',
  '../../../services/file-storage.service.js': '@developer-tools/server/services/file-storage.service',
  '../services/gemini.service.js': '@developer-tools/server/services/gemini.service',
  '../../services/gemini.service.js': '@developer-tools/server/services/gemini.service',
  '../../../services/gemini.service.js': '@developer-tools/server/services/gemini.service',
  '../services/perplexity.service.js': '@developer-tools/server/services/perplexity.service',
  '../../services/perplexity.service.js': '@developer-tools/server/services/perplexity.service',
  '../../../services/perplexity.service.js': '@developer-tools/server/services/perplexity.service',
  
  // Resources
  '../resources/search-history.resource.js': '@developer-tools/server/resources/search-history.resource',
  '../../resources/search-history.resource.js': '@developer-tools/server/resources/search-history.resource',
  '../../../resources/search-history.resource.js': '@developer-tools/server/resources/search-history.resource',
};

// File extensions to process
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

// Directories to exclude
const excludeDirs = ['node_modules', 'dist', '.git', '.github', '.husky', '.vscode'];

function updateImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace imports based on mappings
    for (const [oldImport, newImport] of Object.entries(importMappings)) {
      const regex = new RegExp(`from ['"]${oldImport.replace(/\./g, '\\.')}['"]`, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, `from '${newImport}'`);
        modified = true;
        console.log(`Updated import in ${filePath}: ${oldImport} -> ${newImport}`);
      }
    }
    
    // Write back if modified
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated file: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      if (!excludeDirs.includes(entry.name)) {
        processDirectory(fullPath);
      }
    } else if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
      updateImportsInFile(fullPath);
    }
  }
}

// Start processing from the packages directory
processDirectory(path.join(rootDir, 'packages'));
// Process tools directory
processDirectory(path.join(rootDir, 'tools'));
// Process resources directory
processDirectory(path.join(rootDir, 'resources'));

console.log('Import paths update completed!'); 