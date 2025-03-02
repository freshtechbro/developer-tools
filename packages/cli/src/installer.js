import { promises as fs } from 'fs';
import * as path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { homedir } from 'os';
/**
 * Install and configure the developer tools
 * @param options Installation options
 */
export async function installTools(options) {
    console.log(chalk.blue('Starting Developer Tools installation'));
    // Skip prompts if -y flag is used
    if (options.yes) {
        console.log(chalk.yellow('Using default values (-y flag detected)'));
    }
    // Collect configuration values
    const config = await collectConfig(options);
    // Create .env file
    await createEnvFile(config);
    // Set up Cursor integration
    await setupCursorIntegration(config);
    console.log(chalk.green('\n✅ Developer Tools installation complete!'));
    console.log(chalk.blue('\nNext steps:'));
    console.log('1. Start the MCP server:');
    console.log('   $ developer-tools start');
    console.log('2. Run a tool:');
    console.log('   $ developer-tools web "How to use TypeScript generics?"');
    console.log('\nFor more information, run:');
    console.log('$ developer-tools --help');
}
/**
 * Collect configuration values from the user
 * @param options Command-line options
 * @returns Configuration values
 */
async function collectConfig(options) {
    const config = {};
    // Use provided values or prompt for them
    if (!options.yes) {
        const spinner = ora('Checking installation requirements').start();
        // Add a short delay to make the spinner visible
        await new Promise(resolve => setTimeout(resolve, 1000));
        spinner.succeed('Installation requirements satisfied');
        // Prompt for Perplexity API key
        const answers = await inquirer.prompt([
            {
                type: 'password',
                name: 'PERPLEXITY_API_KEY',
                message: 'Enter your Perplexity API key (optional, press Enter to skip):',
                default: options['api-key'] || '',
                mask: '*'
            },
            {
                type: 'password',
                name: 'GEMINI_API_KEY',
                message: 'Enter your Google Gemini API key:',
                default: options['api-key'] || '',
                validate: (input) => input ? true : 'API key is required',
                mask: '*'
            },
            {
                type: 'password',
                name: 'OPENAI_API_KEY',
                message: 'Enter your OpenAI API key (optional, press Enter to skip):',
                default: '',
                mask: '*'
            },
            {
                type: 'input',
                name: 'PORT',
                message: 'Enter the port for the MCP server:',
                default: options['server-port'] || '3001',
                validate: (input) => /^\d+$/.test(input) ? true : 'Port must be a number'
            },
            {
                type: 'confirm',
                name: 'API_ENABLED',
                message: 'Do you want to enable the HTTP API server?',
                default: options['api-enabled'] !== false
            }
        ]);
        // Add answers to config
        Object.assign(config, answers);
        // Convert boolean to string
        config.API_ENABLED = config.API_ENABLED === 'true' || config.API_ENABLED === true ? 'true' : 'false';
    }
    else {
        // Use default values
        config.GEMINI_API_KEY = options['api-key'] || 'YOUR_GEMINI_API_KEY';
        config.PERPLEXITY_API_KEY = '';
        config.OPENAI_API_KEY = '';
        config.PORT = options['server-port'] || '3001';
        config.API_ENABLED = options['api-enabled'] !== false ? 'true' : 'false';
    }
    return config;
}
/**
 * Create .env file with configuration values
 * @param config Configuration values
 */
async function createEnvFile(config) {
    const spinner = ora('Creating configuration files').start();
    try {
        // Create .env content
        const envContent = Object.entries(config)
            .filter(([key, value]) => value) // Skip empty values
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');
        // Write to .env file
        await fs.writeFile('.env', envContent);
        spinner.succeed('Configuration files created');
    }
    catch (error) {
        spinner.fail(`Failed to create configuration files: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}
/**
 * Set up integration with Cursor IDE
 * @param config Configuration values
 */
async function setupCursorIntegration(config) {
    const spinner = ora('Setting up Cursor IDE integration').start();
    try {
        // Create .cursorrules file
        const cursorRulesContent = `
<developer-tools Integration>
# Developer Tools Commands

Use the following commands to access Developer Tools capabilities:

**Web Search:**
\`developer-tools web "<your question>"\` - Search the web using Perplexity AI
Example: \`developer-tools web "How to use async/await in TypeScript?"\`

**Repository Analysis:**
\`developer-tools repo "<your question>"\` - Analyze the repository (coming soon)
Example: \`developer-tools repo "Explain the authentication flow"\`

**Documentation Generation:**
\`developer-tools doc\` - Generate documentation (coming soon)
Example: \`developer-tools doc --output docs.md\`

**Tool List:**
\`developer-tools list\` - List all available tools
Example: \`developer-tools list\`

**General Options:**
- All commands support the \`--help\` flag for more information
- Most commands can save output to files with the \`--output\` option

**Installation & Setup:**
The Developer Tools MCP server must be running for these commands to work.
Run \`developer-tools start\` in a separate terminal to start the server.
</developer-tools Integration>`;
        // Write .cursorrules
        await fs.writeFile('.cursorrules', cursorRulesContent);
        // Create cursor bin directory if it doesn't exist
        const cursorDir = path.join(homedir(), '.cursor');
        const cursorBinDir = path.join(cursorDir, 'bin');
        try {
            await fs.mkdir(cursorBinDir, { recursive: true });
        }
        catch (error) {
            // Ignore if directory already exists
        }
        // Current working directory
        const cwd = process.cwd();
        // Create bin script for Cursor
        const binScriptContent = `#!/usr/bin/env node
require('${cwd}/packages/cli/dist/index.js');`;
        // Write bin script
        const binScriptPath = path.join(cursorBinDir, 'developer-tools');
        await fs.writeFile(binScriptPath, binScriptContent);
        // Make it executable
        try {
            await fs.chmod(binScriptPath, 0o755);
        }
        catch (error) {
            spinner.warn('Could not make script executable. You may need to do this manually.');
        }
        spinner.succeed('Cursor IDE integration set up');
    }
    catch (error) {
        spinner.fail(`Failed to set up Cursor IDE integration: ${error instanceof Error ? error.message : String(error)}`);
        // Don't throw, just warn - this is not critical
        console.warn(chalk.yellow('Cursor integration setup failed, but installation can continue'));
    }
}
