#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { webSearchTool } from './web-search.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package.json to get the version number
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

// Create the program
const program = new Command();

program
  .name('web-search')
  .description('Search the web using AI providers and returns formatted results')
  .version(packageJson.version)
  .argument('<query>', 'The search query')
  .option('-s, --save', 'Save search results to a file')
  .option('-f, --format <format>', 'Output format (text, markdown, json, html)', 'markdown')
  .option('-m, --max-tokens <number>', 'Maximum tokens for the response', '150')
  .option('--provider <provider>', 'Provider to use (perplexity, gemini, openai)')
  .option('--model <model>', 'Model to use for the search')
  .option('-t, --temperature <number>', 'Temperature for the model', '0.7')
  .option('-d, --detailed', 'Get a more detailed answer')
  .option('-o, --output <filename>', 'Custom filename for saving results')
  .option('--no-sources', 'Exclude sources from the output')
  .option('--include-metadata', 'Include metadata in the output')
  .option('--no-cache', 'Bypass cache and perform a fresh search')
  .option('--timeout <ms>', 'Timeout in milliseconds', '30000')
  .option('--css <css>', 'Custom CSS for HTML output')
  .option('-q, --quiet', 'Suppress all output except the search results')
  .action(async (query, options) => {
    try {
      // Show a loading message unless quiet mode is enabled
      if (!options.quiet) {
        console.log(chalk.blue(`🔍 Searching for: "${query}"...`));
        
        if (options.provider) {
          console.log(chalk.blue(`Using provider: ${options.provider}`));
        }
        
        console.log(); // Empty line for readability
      }
      
      // Call the web search tool
      const result = await webSearchTool.execute({
        query,
        saveToFile: options.save,
        outputFormat: options.format,
        maxTokens: parseInt(options.maxTokens, 10),
        includeSources: options.sources !== false,
        includeMetadata: options.includeMetadata || false,
        customFileName: options.output,
        provider: options.provider,
        model: options.model,
        temperature: parseFloat(options.temperature),
        detailed: options.detailed || false,
        noCache: options.noCache || false,
        timeout: parseInt(options.timeout, 10),
        customCss: options.css
      });
      
      // Extract results
      if (result && 'searchResults' in result) {
        // If quiet mode, only show the search results
        if (options.quiet) {
          console.log(result.searchResults);
        } else {
          // Show formatted output with metadata
          console.log(chalk.green.bold('Search Results:'));
          console.log(result.searchResults);
          
          // Show metadata if available and includeMetadata is true
          if (options.includeMetadata && result.metadata) {
            console.log('\n' + chalk.yellow.bold('Metadata:'));
            
            if (result.metadata.cached) {
              console.log(chalk.yellow('Cached:'), 'true');
            }
            
            if (result.metadata.provider) {
              console.log(chalk.yellow('Provider:'), result.metadata.provider);
            }
            
            if (result.metadata.model) {
              console.log(chalk.yellow('Model:'), result.metadata.model);
            }
            
            if (result.metadata.tokenUsage) {
              const { promptTokens, completionTokens, totalTokens } = result.metadata.tokenUsage;
              if (totalTokens) {
                console.log(chalk.yellow('Total Tokens:'), totalTokens);
              }
            }
          }
          
          // Show file path if saved
          if (result.savedToFile) {
            console.log('\n' + chalk.green(`✅ Results saved to: ${result.savedToFile}`));
          }
        }
      } else {
        console.error(chalk.red('Error: Unexpected response format'));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

program.parse(process.argv);

// If no arguments provided, show help
if (process.argv.length <= 2) {
  program.help();
} 