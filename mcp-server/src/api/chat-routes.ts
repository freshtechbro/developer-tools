import express from 'express';
import { executeChatCommand } from '../capabilities/chat-command-parser.js';
import { logger } from '../utils/logger.js';

// Create a router for chat-related endpoints
export const chatRouter = express.Router();

/**
 * POST /chat
 * Process a chat message and execute any commands
 */
chatRouter.post('/', async (req, res) => {
  const { message } = req.body;
  
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: "Missing or invalid 'message' property in request body" 
    });
  }
  
  try {
    logger.info(`Processing chat message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);
    
    // Try to execute as a command
    const result = await executeChatCommand(message);
    
    if (result === null) {
      // Not a command
      return res.json({ 
        success: true, 
        isCommand: false,
        response: "Not a recognized command" 
      });
    }
    
    // Command was executed
    res.json({ 
      success: true, 
      isCommand: true,
      response: result 
    });
  } catch (error) {
    logger.error(`Chat processing failed:`, { error });
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
}); 