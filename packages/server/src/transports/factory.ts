import type { Transport } from '@modelcontextprotocol/sdk/dist/esm/shared/transport.js';
import express from 'express';
import { HttpServerTransport } from './http.js';
import { SSEServerTransport } from './sse.js';
import { logger } from '@developer-tools/shared/logger';

/**
 * Transport type enum
 */
export enum TransportType {
  HTTP = 'http',
  SSE = 'sse'
}

/**
 * Transport configuration interface
 */
export interface TransportConfig {
  type: TransportType;
  port: number;
  path: string;
  host?: string;
}

/**
 * Factory for creating transport instances
 */
export class TransportFactory {
  /**
   * Create a transport instance based on configuration
   * 
   * @param config Transport configuration
   * @returns Transport instance
   */
  static createTransport(config: TransportConfig): {
    transport: Transport;
    app: express.Application;
    server: any;
  } {
    // Create Express app
    const app = express();
    app.use(express.json());
    
    // Set up CORS
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    });
    
    // Create HTTP server
    const http = require('http');
    const server = http.createServer(app);
    
    // Start server
    const host = config.host || 'localhost';
    server.listen(config.port, host, () => {
      logger.info(`${config.type.toUpperCase()} transport server listening on ${host}:${config.port}`);
    });
    
    // Create transport based on type
    let transport: Transport;
    
    switch (config.type) {
      case TransportType.HTTP:
        transport = new HttpServerTransport(app, { path: config.path });
        logger.info(`HTTP transport enabled on ${config.path}`);
        break;
        
      case TransportType.SSE:
        transport = new SSEServerTransport(app, { path: config.path });
        logger.info(`SSE transport enabled on ${config.path}`);
        break;
        
      default:
        throw new Error(`Unsupported transport type: ${config.type}`);
    }
    
    return { transport, app, server };
  }
} 