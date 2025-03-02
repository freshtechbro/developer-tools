import { z } from 'zod';
import { logger } from '../../utils/logger.js';
import { webSearchTool } from './web-search.js';
// Schema for intercepting commands
const CommandInterceptorSchema = z.object({
    message: z.string().min(1, "Message cannot be empty")
});
// Define command prefix patterns
const COMMAND_PATTERNS = {
    WEB_SEARCH: /^dt-web\s+(.+)$/i,
    REPO_SEARCH: /^dt-repo\s+(.+)$/i,
    DOC_GENERATION: /^dt-doc(?:\s+(.+))?$/i,
    BROWSER: /^dt-browser\s+(\w+)\s+(.+)$/i,
};
/**
 * Command interceptor tool for MCP server
 * This tool intercepts special commands in chat messages and routes them to appropriate tools
 */
export const commandInterceptorTool = {
    name: 'command-interceptor',
    version: '0.1.0',
    description: 'Intercepts special commands in chat messages and routes them to appropriate tools.',
    execute: async (request) => {
        try {
            // Validate request
            const { message } = CommandInterceptorSchema.parse(request);
            // Check for web search command
            const webSearchMatch = message.match(COMMAND_PATTERNS.WEB_SEARCH);
            if (webSearchMatch && webSearchMatch[1]) {
                logger.info(`Intercepted web search command: "${webSearchMatch[1]}"`);
                // Parse the command to extract options
                const cmdText = webSearchMatch[1].trim();
                // Extract options from the command
                const options = {};
                // Simple option parser for command-line style arguments
                let query = '';
                if (cmdText.includes(' --') || cmdText.includes(' -')) {
                    // Get the query part (everything before the first option flag)
                    const firstFlagIndex = Math.min(cmdText.indexOf(' --') === -1 ? Infinity : cmdText.indexOf(' --'), cmdText.indexOf(' -') === -1 ? Infinity : cmdText.indexOf(' -'));
                    query = cmdText.substring(0, firstFlagIndex).trim();
                    // Extract all flags
                    const flagsText = cmdText.substring(firstFlagIndex);
                    const flagMatches = [...flagsText.matchAll(/\s+(-{1,2}[a-z0-9-]+)(?:=|\s+)?([^\s-][^\s]*)?/gi)];
                    for (const flagMatch of flagMatches) {
                        const [, flag, value] = flagMatch;
                        if (flag === '--save' || flag === '-s') {
                            options.saveToFile = true;
                        }
                        else if (flag === '--format' || flag === '-f') {
                            options.outputFormat = value;
                        }
                        else if (flag === '--max-tokens' || flag === '-m') {
                            options.maxTokens = parseInt(value, 10);
                        }
                        else if (flag === '--output' || flag === '-o') {
                            options.customFileName = value;
                        }
                        else if (flag === '--provider') {
                            options.provider = value;
                        }
                        else if (flag === '--model') {
                            options.model = value;
                        }
                        else if (flag === '--detailed' || flag === '-d') {
                            options.detailed = true;
                        }
                        else if (flag === '--temperature' || flag === '-t') {
                            options.temperature = parseFloat(value);
                        }
                        else if (flag === '--no-sources') {
                            options.includeSources = false;
                        }
                        else if (flag === '--include-metadata') {
                            options.includeMetadata = true;
                        }
                        else if (flag === '--no-cache') {
                            options.noCache = true;
                        }
                        else if (flag === '--timeout') {
                            options.timeout = parseInt(value, 10);
                        }
                    }
                }
                else {
                    // No options, just a query
                    query = cmdText;
                }
                // Default parameters
                const searchParams = {
                    query,
                    outputFormat: 'markdown',
                    includeSources: true,
                    ...options
                };
                logger.debug('Executing web search with params', searchParams);
                // Execute web search tool
                return await webSearchTool.execute(searchParams);
            }
            // Check for repo search command (not implemented yet)
            const repoSearchMatch = message.match(COMMAND_PATTERNS.REPO_SEARCH);
            if (repoSearchMatch && repoSearchMatch[1]) {
                logger.info(`Intercepted repo search command: "${repoSearchMatch[1]}"`);
                // This will be implemented in future
                return {
                    searchResults: `Repository search for "${repoSearchMatch[1]}" is not implemented yet. Please use the web search command instead.`
                };
            }
            // Check for doc generation command (not implemented yet)
            const docGenMatch = message.match(COMMAND_PATTERNS.DOC_GENERATION);
            if (docGenMatch) {
                const docPath = docGenMatch[1]?.trim() || null;
                logger.info(`Intercepted doc generation command${docPath ? ` for "${docPath}"` : ''}`);
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
                logger.info(`Intercepted browser ${action} command with args: "${args}"`);
                // This will be implemented in future
                return {
                    searchResults: `Browser ${action} command with args "${args}" is not implemented yet.`
                };
            }
            // If no command pattern matches, return null
            return null;
        }
        catch (error) {
            logger.error(`Command interception failed: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    },
    requestSchema: {
        type: 'object',
        properties: {
            message: {
                type: 'string',
                description: 'The message to check for commands.'
            }
        },
        required: ['message']
    },
    responseSchema: {
        oneOf: [
            {
                type: 'object',
                properties: {
                    searchResults: {
                        type: 'string',
                        description: 'Results from the executed command.'
                    },
                    savedToFile: {
                        type: 'string',
                        description: 'Path to the file where results were saved, if applicable.'
                    },
                    metadata: {
                        type: 'object',
                        description: 'Additional metadata about the executed command.'
                    }
                },
                required: ['searchResults']
            },
            {
                type: 'null',
                description: 'Returned when no command was found in the message.'
            }
        ]
    }
};
