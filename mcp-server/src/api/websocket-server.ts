import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '../utils/logger.js';
import { executeChatCommand } from '../capabilities/chat-command-parser.js';

// Client connection tracking
interface Client {
  id: string;
  ws: WebSocket;
  isAlive: boolean;
  type: 'ide' | 'web' | 'unknown';
}

/**
 * WebSocket server for real-time communication
 */
export class WsServer {
  private wss: WebSocketServer;
  private clients: Map<string, Client> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;
  
  /**
   * Create a new WebSocket server
   * @param server HTTP server to attach to
   */
  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ server });
    this.setupWebSocketServer();
    logger.info('WebSocket server initialized');
  }
  
  /**
   * Set up the WebSocket server
   */
  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = this.generateClientId();
      
      // Initialize client
      const client: Client = {
        id: clientId,
        ws,
        isAlive: true,
        type: 'unknown'
      };
      
      this.clients.set(clientId, client);
      logger.info(`WebSocket client connected: ${clientId}`);
      
      // Send welcome message
      this.sendToClient(clientId, {
        type: 'connection',
        clientId,
        message: 'Connected to Developer Tools WebSocket server'
      });
      
      // Handle messages
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(clientId, data);
        } catch (error) {
          logger.error(`Failed to parse WebSocket message: ${error instanceof Error ? error.message : String(error)}`);
          this.sendToClient(clientId, {
            type: 'error',
            error: 'Invalid message format'
          });
        }
      });
      
      // Handle pings
      ws.on('pong', () => {
        if (this.clients.has(clientId)) {
          this.clients.get(clientId)!.isAlive = true;
        }
      });
      
      // Handle disconnection
      ws.on('close', () => {
        logger.info(`WebSocket client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });
    });
    
    // Set up ping interval to keep connections alive and detect dead connections
    this.pingInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const client = Array.from(this.clients.values()).find(c => c.ws === ws);
        if (client) {
          if (client.isAlive === false) {
            logger.info(`Terminating inactive WebSocket client: ${client.id}`);
            client.ws.terminate();
            this.clients.delete(client.id);
            return;
          }
          
          client.isAlive = false;
          client.ws.ping();
        }
      });
    }, 30000);
  }
  
  /**
   * Handle incoming messages
   * @param clientId Client ID
   * @param data Message data
   */
  private async handleMessage(clientId: string, data: any) {
    logger.debug(`WebSocket message from ${clientId}:`, { data });
    
    // Handle client registration
    if (data.type === 'register') {
      if (this.clients.has(clientId)) {
        const client = this.clients.get(clientId)!;
        client.type = data.clientType || 'unknown';
        logger.info(`Client ${clientId} registered as ${client.type}`);
        
        this.sendToClient(clientId, {
          type: 'registered',
          clientType: client.type
        });
      }
      return;
    }
    
    // Handle chat messages
    if (data.type === 'chat' && data.message) {
      const result = await executeChatCommand(data.message);
      
      if (result === null) {
        // Not a command
        this.sendToClient(clientId, {
          type: 'chat_response',
          isCommand: false,
          message: 'Not a recognized command'
        });
      } else {
        // Command was executed
        this.sendToClient(clientId, {
          type: 'chat_response',
          isCommand: true,
          result
        });
      }
      return;
    }
    
    // Handle tool execution
    if (data.type === 'execute_tool' && data.tool) {
      // This would be handled by the tool registry
      // For now, just acknowledge
      this.sendToClient(clientId, {
        type: 'tool_execution_started',
        tool: data.tool
      });
      return;
    }
    
    // Unknown message type
    this.sendToClient(clientId, {
      type: 'error',
      error: 'Unknown message type'
    });
  }
  
  /**
   * Send a message to a specific client
   * @param clientId Client ID
   * @param data Message data
   */
  public sendToClient(clientId: string, data: any) {
    if (this.clients.has(clientId)) {
      const client = this.clients.get(clientId)!;
      client.ws.send(JSON.stringify(data));
    }
  }
  
  /**
   * Broadcast a message to all clients
   * @param data Message data
   * @param filter Optional filter function to select clients
   */
  public broadcast(data: any, filter?: (client: Client) => boolean) {
    this.clients.forEach((client) => {
      if (!filter || filter(client)) {
        client.ws.send(JSON.stringify(data));
      }
    });
  }
  
  /**
   * Generate a unique client ID
   * @returns A unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Close the WebSocket server
   */
  public close() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    this.wss.close();
    logger.info('WebSocket server closed');
  }
} 