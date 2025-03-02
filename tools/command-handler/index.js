#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { webSearchTool } from '../web-search/web-search.js';
import { logger } from '@developer-tools/shared/logger';
import path from 'path';
import { fileURLToPath } from 'url';
// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Define command prefix
const COMMAND_PREFIX = 'dt';
// Command definitions
const COMMANDS = {
    WEB: {
        name: 'web',
        description: 'Search the web using Perplexity AI',
        examples: [
            'dt-web "What is the capital of France?"',
            'dt-web "Latest JavaScript framework trends" --save',
            'dt-web "Node.js file system API" --format json'
        ]
    },
    REPO: {
        name: 'repo',
        description: 'Get context-aware answers about this repository',
        examples: [
            'dt-repo "Explain the authentication flow"',
            'dt-repo "How is error handling implemented?"'
        ]
    },
    DOC: {
        name: 'doc',
        description: 'Generate comprehensive documentation',
        examples: [
            'dt-doc',
            'dt-doc --output docs.md'
        ]
    },
    BROWSER: {
        name: 'browser',
        description: 'Browser automation commands',
        subcommands: {
            OPEN: 'open',
            ACT: 'act',
            OBSERVE: 'observe',
            EXTRACT: 'extract'
        },
        examples: [
            'dt-browser open "https://example.com" --html',
            'dt-browser act "Click Login" --url=https://example.com',
            'dt-browser observe "interactive elements" --url=https://example.com',
            'dt-browser extract "product names" --url=https://example.com/products'
        ]
    }
};
// Program version
const VERSION = '0.1.0';
// Create the program
const program = new Command();
/**
 * Initialize the command-line interface
 */
export function initCLI() {
    program
        .name('developer-tools')
        .description('Developer tools for AI-assisted coding')
        .version(VERSION);
    // Web search command
    program
        .command('web')
        .description(COMMANDS.WEB.description)
        .argument('<query>', 'The search query')
        .option('-s, --save', 'Save the search results to a file')
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
                timeout: parseInt(options.timeout, 10)
            });
            // Extract results
            if (result && 'searchResults' in result) {
                // If quiet mode, only show the search results
                if (options.quiet) {
                    console.log(result.searchResults);
                }
                else {
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
            }
            else {
                console.error(chalk.red('Error: Unexpected response format'));
                process.exit(1);
            }
        }
        catch (error) {
            console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
            if (!options.quiet && error instanceof Error && error.stack) {
                console.error(chalk.gray(error.stack));
            }
            process.exit(1);
        }
    });
    // Repository search command - placeholder for future implementation
    program
        .command('repo')
        .description(COMMANDS.REPO.description)
        .argument('<query>', 'The repository query')
        .action((query) => {
        console.log(chalk.yellow('Repository search not implemented yet.'));
        console.log(`Query: ${query}`);
    });
    // Documentation generation command - placeholder for future implementation
    program
        .command('doc')
        .description(COMMANDS.DOC.description)
        .option('-o, --output <filename>', 'Output filename')
        .action((options) => {
        console.log(chalk.yellow('Documentation generation not implemented yet.'));
        if (options.output) {
            console.log(`Output: ${options.output}`);
        }
    });
    // Browser command - placeholder for future implementation
    program
        .command('browser <action>')
        .description(COMMANDS.BROWSER.description)
        .action((action, options) => {
        console.log(chalk.yellow('Browser automation not implemented yet.'));
        console.log(`Action: ${action}`);
    });
    // Help command to show examples
    program
        .command('examples')
        .description('Show example commands for all tools')
        .action(() => {
        console.log(chalk.bold('Developer Tools Example Commands\n'));
        // Web search examples
        console.log(chalk.blue.bold(`${COMMANDS.WEB.name} - ${COMMANDS.WEB.description}`));
        COMMANDS.WEB.examples.forEach(example => {
            console.log(`  ${example}`);
        });
        console.log();
        // Repository search examples
        console.log(chalk.blue.bold(`${COMMANDS.REPO.name} - ${COMMANDS.REPO.description}`));
        COMMANDS.REPO.examples.forEach(example => {
            console.log(`  ${example}`);
        });
        console.log();
        // Documentation generation examples
        console.log(chalk.blue.bold(`${COMMANDS.DOC.name} - ${COMMANDS.DOC.description}`));
        COMMANDS.DOC.examples.forEach(example => {
            console.log(`  ${example}`);
        });
        console.log();
        // Browser automation examples
        console.log(chalk.blue.bold(`${COMMANDS.BROWSER.name} - ${COMMANDS.BROWSER.description}`));
        COMMANDS.BROWSER.examples.forEach(example => {
            console.log(`  ${example}`);
        });
    });
    return program;
}
/**
 * Process a command from chat or IDE
 * @param message The message containing the command
 * @returns Result of the command or null if no command was found
 */
export async function processCommand(message) {
    // Define command prefix patterns
    const COMMAND_PATTERNS = {
        WEB_SEARCH: new RegExp(`^${COMMAND_PREFIX}-${COMMANDS.WEB.name}\\s+(.+)$`, 'i'),
        REPO_SEARCH: new RegExp(`^${COMMAND_PREFIX}-${COMMANDS.REPO.name}\\s+(.+)$`, 'i'),
        DOC_GENERATION: new RegExp(`^${COMMAND_PREFIX}-${COMMANDS.DOC.name}(?:\\s+(.+))?$`, 'i'),
        BROWSER: new RegExp(`^${COMMAND_PREFIX}-${COMMANDS.BROWSER.name}\\s+(\\w+)\\s+(.+)$`, 'i')
    };
    // Check for web search command
    const webSearchMatch = message.match(COMMAND_PATTERNS.WEB_SEARCH);
    if (webSearchMatch && webSearchMatch[1]) {
        logger.info(`Processing web search command: "${webSearchMatch[1]}"`);
        // Parse options from the query
        const { query, options } = parseOptions(webSearchMatch[1]);
        // Execute web search tool
        return await webSearchTool.execute({
            query,
            saveToFile: options.save || false,
            outputFormat: options.format || 'markdown',
            maxTokens: options.maxTokens ? parseInt(options.maxTokens, 10) : 150,
            includeSources: options.sources !== false,
            includeMetadata: options.includeMetadata || false,
            customFileName: options.output,
            provider: options.provider,
            model: options.model,
            temperature: options.temperature ? parseFloat(options.temperature) : 0.7,
            detailed: options.detailed || false,
            noCache: options.noCache || false,
            timeout: options.timeout ? parseInt(options.timeout, 10) : 30000
        });
    }
    // Check for repo search command (not implemented yet)
    const repoSearchMatch = message.match(COMMAND_PATTERNS.REPO_SEARCH);
    if (repoSearchMatch && repoSearchMatch[1]) {
        logger.info(`Processing repository search command: "${repoSearchMatch[1]}"`);
        // This will be implemented in future
        return {
            searchResults: `Repository search for "${repoSearchMatch[1]}" is not implemented yet. Please use the web search command instead.`
        };
    }
    // Check for doc generation command (not implemented yet)
    const docGenMatch = message.match(COMMAND_PATTERNS.DOC_GENERATION);
    if (docGenMatch) {
        const docPath = docGenMatch[1]?.trim() || null;
        logger.info(`Processing documentation generation command${docPath ? ` for "${docPath}"` : ''}`);
        // This will be implemented in future
        return {
            searchResults: `Documentation generation${docPath ? ` for "${docPath}"` : ''} is not implemented yet.`
        };
    }
    // Check for browser command (not implemented yet)
    const browserMatch = message.match(COMMAND_PATTERNS.BROWSER);
    if (browserMatch && browserMatch[1] && browserMatch[2]) {
        const action = browserMatch[1];
        const args = browserMatch[2];
        logger.info(`Processing browser ${action} command with args: "${args}"`);
        // This will be implemented in future
        return {
            searchResults: `Browser ${action} command with args "${args}" is not implemented yet.`
        };
    }
    // If no command pattern matches, return null
    return null;
}
/**
 * Parse options from a command string
 */
function parseOptions(commandString) {
    const options = {};
    // Extract quoted parts first (to handle spaces within quotes)
    const quotedRegex = /"([^"]*)"/g;
    const quotes = [];
    let match;
    while ((match = quotedRegex.exec(commandString)) !== null) {
        quotes.push(match[1]);
    }
    // Replace quoted parts with placeholders
    let processedCommand = commandString;
    quotes.forEach((quote, index) => {
        processedCommand = processedCommand.replace(`"${quote}"`, `__QUOTE${index}__`);
    });
    // Split by spaces
    const parts = processedCommand.split(/\s+/);
    // Extract options
    const queryParts = [];
    let i = 0;
    while (i < parts.length) {
        const part = parts[i];
        if (part.startsWith('--')) {
            // Handle --option=value format
            if (part.includes('=')) {
                const [key, value] = part.substring(2).split('=');
                options[key] = value.startsWith('__QUOTE') ?
                    quotes[parseInt(value.replace('__QUOTE', '').replace('__', ''))] :
                    value;
            }
            // Handle --option format (boolean flag)
            else if (parts[i + 1] && !parts[i + 1].startsWith('-')) {
                const key = part.substring(2);
                const value = parts[i + 1].startsWith('__QUOTE') ?
                    quotes[parseInt(parts[i + 1].replace('__QUOTE', '').replace('__', ''))] :
                    parts[i + 1];
                options[key] = value;
                i++; // Skip the value
            }
            // Handle --no-option format (negated boolean flag)
            else if (part.startsWith('--no-')) {
                const key = part.substring(5);
                options[key] = false;
            }
            // Handle --option without value (boolean flag)
            else {
                const key = part.substring(2);
                options[key] = true;
            }
        }
        // Handle -o format (short option)
        else if (part.startsWith('-') && part.length === 2) {
            const key = part.substring(1);
            // If next part is a value (not an option)
            if (parts[i + 1] && !parts[i + 1].startsWith('-')) {
                const value = parts[i + 1].startsWith('__QUOTE') ?
                    quotes[parseInt(parts[i + 1].replace('__QUOTE', '').replace('__', ''))] :
                    parts[i + 1];
                // Map short options to long options
                switch (key) {
                    case 's':
                        options.save = true;
                        break;
                    case 'f':
                        options.format = value;
                        i++;
                        break;
                    case 'm':
                        options.maxTokens = value;
                        i++;
                        break;
                    case 'o':
                        options.output = value;
                        i++;
                        break;
                    case 'd':
                        options.detailed = true;
                        break;
                    case 't':
                        options.temperature = value;
                        i++;
                        break;
                    case 'q':
                        options.quiet = true;
                        break;
                    default:
                        options[key] = value;
                        i++; // Skip the value
                }
            }
            // Boolean flag (no value)
            else {
                // Map short options to long options
                switch (key) {
                    case 's':
                        options.save = true;
                        break;
                    case 'q':
                        options.quiet = true;
                        break;
                    default:
                        options[key] = true;
                }
            }
        }
        // Non-option part (part of the query)
        else {
            // Replace quote placeholders with actual quotes
            if (part.startsWith('__QUOTE')) {
                const quoteIndex = parseInt(part.replace('__QUOTE', '').replace('__', ''));
                queryParts.push(quotes[quoteIndex]);
            }
            else {
                queryParts.push(part);
            }
        }
        i++;
    }
    // Reconstruct the query, replacing quote placeholders
    let query = queryParts.join(' ');
    quotes.forEach((quote, index) => {
        query = query.replace(`__QUOTE${index}__`, quote);
    });
    return { query, options };
}
/**
 * Export as module for programmatic usage
 */
export const devTools = {
    web: async (query, options = {}) => {
        return await webSearchTool.execute({
            query,
            saveToFile: options.save || false,
            outputFormat: options.format || 'markdown',
            maxTokens: options.maxTokens ? parseInt(options.maxTokens, 10) : 150,
            includeSources: options.sources !== false,
            includeMetadata: options.includeMetadata || false,
            customFileName: options.output,
            provider: options.provider,
            model: options.model,
            temperature: options.temperature ? parseFloat(options.temperature) : 0.7,
            detailed: options.detailed || false,
            noCache: options.noCache || false,
            timeout: options.timeout ? parseInt(options.timeout, 10) : 30000
        });
    },
    processCommand
};
/**
 * If the file is run directly from the command line
 */
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const cli = initCLI();
    cli.parse(process.argv);
}
