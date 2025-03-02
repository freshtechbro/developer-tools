import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

// Define the Tool interface
export interface Tool {
  name: string;
  version: string;
  description: string;
  execute: (request: unknown) => Promise<unknown>;
  requestSchema?: unknown;
  responseSchema?: unknown;
}

// Tool registry to hold all loaded tools
export class ToolRegistry {
  private tools: Record<string, Tool> = {};
  
  /**
   * Register a tool with the registry
   * @param tool The tool to register
   */
  register(tool: Tool): void {
    if (this.tools[tool.name]) {
      logger.warn(`Tool '${tool.name}' is already registered. Overwriting.`);
    }
    
    this.tools[tool.name] = tool;
    logger.info(`Registered tool: ${tool.name} (v${tool.version})`);
  }
  
  /**
   * Get a tool by name
   * @param name The name of the tool to get
   * @returns The tool, or undefined if not found
   */
  getTool(name: string): Tool | undefined {
    return this.tools[name];
  }
  
  /**
   * Get all registered tools
   * @returns All registered tools
   */
  getAllTools(): Record<string, Tool> {
    return { ...this.tools };
  }
  
  /**
   * Load tools from a directory
   * @param toolsDir The directory to load tools from
   */
  async loadToolsFromDirectory(toolsDir: string): Promise<void> {
    try {
      logger.info(`Loading tools from directory: ${toolsDir}`);
      const toolFolders = await fs.readdir(toolsDir);
      
      for (const folder of toolFolders) {
        try {
          const toolPath = path.join(toolsDir, folder);
          const stat = await fs.stat(toolPath);
          
          if (stat.isDirectory()) {
            // Check if there's a main.js or index.js file
            const possibleEntrypoints = ['main.js', 'index.js', `${folder}.js`];
            
            for (const entrypoint of possibleEntrypoints) {
              const entrypointPath = path.join(toolPath, entrypoint);
              try {
                await fs.access(entrypointPath);
                // Found an entrypoint, attempt to load the tool
                const toolModule = await import(`file://${entrypointPath}`);
                
                if (toolModule.default && typeof toolModule.default.execute === 'function') {
                  this.register(toolModule.default);
                  break; // Stop after finding the first valid entrypoint
                } else {
                  logger.warn(`Tool in ${folder} doesn't export a valid tool object`);
                }
              } catch (error) {
                // Entry point doesn't exist, try the next one
              }
            }
          }
        } catch (error) {
          logger.error(`Failed to load tool from ${folder}:`, { error });
        }
      }
      
      logger.info(`Loaded ${Object.keys(this.tools).length} tools`);
    } catch (error) {
      logger.error('Failed to load tools from directory:', { error, directory: toolsDir });
    }
  }
  
  /**
   * Execute a tool
   * @param name The name of the tool to execute
   * @param request The request to pass to the tool
   * @returns The result of the tool execution
   */
  async executeTool(name: string, request: unknown): Promise<unknown> {
    const tool = this.getTool(name);
    
    if (!tool) {
      throw new Error(`Tool '${name}' not found`);
    }
    
    try {
      logger.info(`Executing tool: ${name}`, { request });
      const result = await tool.execute(request);
      logger.info(`Tool execution completed: ${name}`);
      return result;
    } catch (error) {
      logger.error(`Tool execution failed: ${name}`, { error, request });
      throw error;
    }
  }
}

// Create and export a singleton instance
export const toolRegistry = new ToolRegistry(); 