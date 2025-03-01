import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '@developer-tools/shared/logger';
import { config } from '@developer-tools/shared/config';
import cors from 'cors';
import { processCommand } from '../../tools/command-handler/index.js';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates and configures an Express server to serve the web interface
 * @param port The port to listen on
 * @returns The configured Express app
 */
export function createWebInterface(port: number = 3002): express.Express {
  const app = express();
  
  // Configure middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../../public')));
  
  // API endpoint for command processing
  app.post('/api/commands', async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      logger.info(`Received command request: ${message}`);
      
      // Process the command
      const result = await processCommand(message);
      
      if (result) {
        logger.info(`Command processed successfully`);
        return res.json({ success: true, result });
      } else {
        logger.info(`No command found in message`);
        return res.json({ success: false, message: 'No command found in message' });
      }
    } catch (error) {
      logger.error(`Error processing command: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({ 
        error: 'Error processing command', 
        message: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Start the server
  app.listen(port, () => {
    logger.info(`Web interface running at http://localhost:${port}`);
  });
  
  return app;
} 