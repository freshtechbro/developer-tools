import express from 'express';
import cors from 'cors';
import { json, urlencoded } from 'body-parser';
import { createServer } from 'http';
import { toolRouter } from './tool-routes.js';
import { chatRouter } from './chat-routes.js';
import { WsServer } from './websocket-server.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

// Export the WebSocket server instance
export let wsServer: WsServer;

/**
 * Configure and start the HTTP API server
 */
export async function startApiServer() {
  // Create Express app
  const app = express();
  
  // Configure middleware
  app.use(cors());
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ extended: true }));
  
  // Add request logging
  app.use((req, res, next) => {
    logger.debug(`HTTP ${req.method} ${req.url}`);
    next();
  });
  
  // Register routes
  app.use('/api/tools', toolRouter);
  app.use('/api/chat', chatRouter);
  
  // Simple health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  
  // Add error handling middleware
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('API server error:', { error: err });
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Internal server error' 
    });
  });
  
  // Create HTTP server
  const port = config.api?.port || 3001;
  const httpServer = createServer(app);
  
  // Create WebSocket server
  wsServer = new WsServer(httpServer);
  
  // Start the server
  const server = httpServer.listen(port, () => {
    logger.info(`HTTP API server listening on port ${port}`);
    logger.info(`WebSocket server available at ws://localhost:${port}`);
  });
  
  // Handle graceful shutdown
  const shutdown = () => {
    logger.info('Shutting down HTTP API server...');
    wsServer.close();
    server.close(() => {
      logger.info('HTTP API server has closed');
    });
  };
  
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  
  return server;
} 