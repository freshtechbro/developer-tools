import { Command } from 'commander';
import chalk from 'chalk';
import { execTool } from './tool-executor.js';
import { installTools } from './installer.js';
import { startMcpServer } from './server-manager.js';
// Define the program
const program = new Command();
program
    .name('developer-tools')
    .description('Developer tools CLI for AI-assisted coding')
    .version('0.1.0');
// Run a tool
program
    .command('run <tool>')
    .description('Run a specific tool')
    .option('-d, --data <json>', 'JSON data to pass to the tool')
    .option('-f, --file <path>', 'File containing JSON data to pass to the tool')
    .option('-o, --output <path>', 'Output file for tool results')
    .option('-s, --server <url>', 'MCP server URL', 'http://localhost:3001/api')
    .action(async (tool, options) => {
    try {
        console.log(chalk.blue(`Executing tool: ${tool}`));
        const result = await execTool(tool, options);
        if (options.output) {
            console.log(chalk.green(`Results saved to: ${options.output}`));
        }
        else {
            // Pretty print the result
            if (typeof result === 'object') {
                console.log(JSON.stringify(result, null, 2));
            }
            else {
                console.log(result);
            }
        }
    }
    catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
    }
});
// Install the tools
program
    .command('install')
    .description('Install and configure the developer tools')
    .option('-y, --yes', 'Skip prompts and use default values')
    .option('--api-key <key>', 'API key for search providers')
    .option('--server-port <port>', 'Port for the MCP server', '3001')
    .option('--api-enabled', 'Enable the HTTP API server', true)
    .action(async (options) => {
    try {
        await installTools(options);
    }
    catch (error) {
        console.error(chalk.red(`Installation failed: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
    }
});
// Start the MCP server
program
    .command('start')
    .description('Start the MCP server')
    .option('-p, --port <port>', 'Port for the MCP server', '3001')
    .option('--stdio', 'Use stdio transport instead of HTTP')
    .option('--no-api', 'Disable the HTTP API server')
    .action(async (options) => {
    try {
        await startMcpServer(options);
    }
    catch (error) {
        console.error(chalk.red(`Server failed to start: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
    }
});
// Web search command (shortcut for run web-search)
program
    .command('web <query>')
    .description('Search the web using Perplexity AI')
    .option('-s, --save', 'Save the search results to a file')
    .option('-f, --format <format>', 'Output format (text, markdown, json, html)', 'markdown')
    .option('-p, --provider <provider>', 'Provider to use (perplexity, gemini, openai)')
    .option('-d, --detailed', 'Get a more detailed answer')
    .action(async (query, options) => {
    try {
        console.log(chalk.blue(`🔍 Searching for: "${query}"...`));
        const toolOptions = {
            data: JSON.stringify({
                query,
                saveToFile: options.save,
                outputFormat: options.format,
                provider: options.provider,
                detailed: options.detailed
            }),
            server: 'http://localhost:3001/api'
        };
        const result = await execTool('web-search', toolOptions);
        if (typeof result === 'object' && 'searchResults' in result) {
            console.log(result.searchResults);
            if ('savedToFile' in result && result.savedToFile) {
                console.log(chalk.green(`\nResults saved to: ${result.savedToFile}`));
            }
        }
        else {
            console.log(result);
        }
    }
    catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
    }
});
// List available tools
program
    .command('list')
    .description('List all available tools')
    .option('-s, --server <url>', 'MCP server URL', 'http://localhost:3001/api')
    .action(async (options) => {
    try {
        console.log(chalk.blue('Fetching available tools...'));
        // Implement tool listing logic here
        const result = await fetch(`${options.server}/tools`);
        const data = await result.json();
        console.log(chalk.green('Available tools:'));
        if (data.tools && Array.isArray(data.tools)) {
            data.tools.forEach((tool) => {
                console.log(`- ${chalk.bold(tool.name)} (v${tool.version}): ${tool.description}`);
            });
        }
        else {
            console.log(chalk.yellow('No tools available or server not responding correctly'));
        }
    }
    catch (error) {
        console.error(chalk.red(`Failed to list tools: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
    }
});
// Parse the command line arguments
export function run() {
    program.parse(process.argv);
    // If no command is provided, show help
    if (process.argv.length <= 2) {
        program.help();
    }
}
// Allow direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
    run();
}
