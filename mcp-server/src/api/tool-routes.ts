import express from 'express';
import { toolRegistry } from '../tools/registry.js';
import { logger } from '../utils/logger.js';

// Create a router for tool-related endpoints
export const toolRouter = express.Router();

/**
 * GET /tools
 * List all available tools
 */
toolRouter.get('/', (req, res) => {
  const tools = toolRegistry.getAllTools();
  const toolList = Object.entries(tools).map(([name, tool]) => ({
    name,
    version: tool.version,
    description: tool.description
  }));
  
  res.json({ tools: toolList });
});

/**
 * GET /tools/:name
 * Get information about a specific tool
 */
toolRouter.get('/:name', (req, res) => {
  const { name } = req.params;
  const tool = toolRegistry.getTool(name);
  
  if (!tool) {
    return res.status(404).json({ 
      success: false, 
      error: `Tool '${name}' not found` 
    });
  }
  
  res.json({
    name: tool.name,
    version: tool.version,
    description: tool.description,
    // Optionally include schema information if available
    requestSchema: tool.requestSchema,
    responseSchema: tool.responseSchema
  });
});

/**
 * POST /tools/:name/execute
 * Execute a specific tool
 */
toolRouter.post('/:name/execute', async (req, res) => {
  const { name } = req.params;
  const request = req.body;
  
  try {
    logger.info(`Executing tool via HTTP API: ${name}`);
    const result = await toolRegistry.executeTool(name, request);
    res.json({ success: true, result });
  } catch (error) {
    logger.error(`Tool execution failed via HTTP API: ${name}`, { error });
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

/**
 * POST /tools/execute
 * Alternative endpoint for executing a tool by specifying the tool in the request body
 */
toolRouter.post('/execute', async (req, res) => {
  const { tool, request } = req.body;
  
  if (!tool || typeof tool !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: "Missing or invalid 'tool' property in request body" 
    });
  }
  
  try {
    logger.info(`Executing tool via HTTP API: ${tool}`);
    const result = await toolRegistry.executeTool(tool, request);
    res.json({ success: true, result });
  } catch (error) {
    logger.error(`Tool execution failed via HTTP API: ${tool}`, { error });
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
}); 