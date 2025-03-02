import { logger } from '../utils/logger.js';
import { toolRegistry } from '../tools/registry.js';

/**
 * Interface for a parsed chat command
 */
export interface ParsedCommand {
  tool: string;
  args: string;
  originalMessage: string;
}

/**
 * Parse a chat message for commands
 * @param message The chat message to parse
 * @returns The parsed command, or null if not a command
 */
export function parseChatCommand(message: string): ParsedCommand | null {
  // Check if the message starts with the command prefix
  if (!message.startsWith('!dt ') && !message.startsWith('dev-tools ')) {
    return null;
  }
  
  // Extract the command parts
  const parts = message.split(' ');
  const prefix = parts[0]; // !dt or dev-tools
  
  if (parts.length < 2) {
    logger.warn(`Invalid command format: ${message}`);
    return null;
  }
  
  const tool = parts[1];
  const args = parts.slice(2).join(' ');
  
  logger.info(`Parsed chat command: ${tool} with args: ${args}`);
  
  return {
    tool,
    args,
    originalMessage: message
  };
}

/**
 * Execute a command from a chat message
 * @param message The chat message
 * @returns The result of the command execution, or null if not a command
 */
export async function executeChatCommand(message: string): Promise<any> {
  const parsedCommand = parseChatCommand(message);
  
  if (!parsedCommand) {
    return null;
  }
  
  const { tool, args } = parsedCommand;
  
  // Check if the tool exists
  if (!toolRegistry.getTool(tool)) {
    logger.warn(`Tool not found: ${tool}`);
    return {
      error: `Tool '${tool}' not found. Available tools: ${Object.keys(toolRegistry.getAllTools()).join(', ')}`
    };
  }
  
  try {
    // Parse args as JSON if possible, otherwise use as string
    let parsedArgs: any;
    try {
      parsedArgs = JSON.parse(args);
    } catch {
      // If not valid JSON, use as a simple string query
      parsedArgs = { query: args };
    }
    
    // Execute the tool
    logger.info(`Executing tool from chat command: ${tool}`);
    const result = await toolRegistry.executeTool(tool, parsedArgs);
    return result;
  } catch (error) {
    logger.error(`Failed to execute chat command: ${tool}`, { error });
    return {
      error: `Failed to execute tool '${tool}': ${error instanceof Error ? error.message : String(error)}`
    };
  }
} 