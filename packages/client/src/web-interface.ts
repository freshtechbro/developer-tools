import express from 'express';
import path from 'path';
import { logger } from './utils/logger.js';

/**
 * Creates and configures an Express server to serve the web interface
 * @param port The port to listen on
 * @returns The configured Express app
 */
export function createWebInterface(port: number = 3002): express.Express {
  const app = express();
  
  // Serve static files from the public directory
  app.use(express.static(path.join(process.cwd(), 'public')));
  
  // Start the server
  app.listen(port, () => {
    logger.info(`Web interface server started on port ${port}`);
    logger.info(`Open http://localhost:${port} in your browser to access the web interface`);
  });
  
  return app;
} 