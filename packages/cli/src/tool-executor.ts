import { promises as fs } from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { isIdeTerminal, getEnvironmentInfo } from './environment-detector.js';

/**
 * Options for executing a tool
 */
interface ToolExecutionOptions {
  data?: string;
  file?: string;
  output?: string;
  server?: string;
}

/**
 * Execute a tool through the MCP server
 * @param toolName Name of the tool to execute
 * @param options Tool execution options
 * @returns The tool execution result
 */
export async function execTool(toolName: string, options: ToolExecutionOptions): Promise<any> {
  // Get environment information
  const envInfo = getEnvironmentInfo();
  const isIde = envInfo.isIde;
  
  // Determine the request data
  let requestData: any;
  
  if (options.file) {
    try {
      // Read request data from file
      const filePath = path.resolve(process.cwd(), options.file);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      requestData = JSON.parse(fileContent);
    } catch (error) {
      throw new Error(`Failed to read request data from file: ${options.file}\n${error instanceof Error ? error.message : String(error)}`);
    }
  } else if (options.data) {
    try {
      // Parse inline data
      requestData = JSON.parse(options.data);
    } catch (error) {
      throw new Error(`Failed to parse request data: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    // Empty request data
    requestData = {};
  }
  
  // Add environment information to the request
  requestData._environment = {
    type: envInfo.environment,
    isIde,
    details: envInfo.details
  };
  
  // Determine the server URL
  const serverUrl = options.server || 'http://localhost:3001/api';
  const toolUrl = `${serverUrl}/tools/${toolName}/execute`;
  
  try {
    // Make the request to the server
    if (!isIde) {
      console.log(chalk.blue(`Sending request to: ${toolUrl}`));
    }
    
    const response = await fetch(toolUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    // Check for errors
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server responded with ${response.status}: ${errorText}`);
    }
    
    // Parse the response
    const result = await response.json();
    
    // Write result to output file if specified
    if (options.output) {
      const outputPath = path.resolve(process.cwd(), options.output);
      
      try {
        // Create directory if it doesn't exist
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        
        // Write the result to file
        await fs.writeFile(
          outputPath, 
          typeof result === 'string' ? result : JSON.stringify(result, null, 2)
        );
      } catch (error) {
        throw new Error(`Failed to write result to file: ${options.output}\n${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    return result;
  } catch (error) {
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      throw new Error(`Could not connect to MCP server at ${serverUrl}. Make sure the server is running.`);
    }
    throw error;
  }
} 