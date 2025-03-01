import type { Transport } from '@modelcontextprotocol/sdk/dist/esm/shared/transport.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/dist/esm/types.js';
import express from 'express';
import { logger } from '@developer-tools/shared/logger';

/**
 * Server transport for SSE: this will send messages over an SSE connection and receive messages from HTTP POST requests.
 * 
 * This transport is only available in Node.js environments.
 */
export class SSEServerTransport implements Transport {
    private _app: express.Application;
    private _path: string;
    private _sessionId: string;
    private _clients: Map<string, express.Response>;
    private _messageQueue: Map<string, JSONRPCMessage[]>;
    
    onclose?: () => void;
    onerror?: (error: Error) => void;
    onmessage?: (message: JSONRPCMessage) => void;
    
    /**
     * Creates a new SSE server transport.
     * 
     * @param app Express application instance
     * @param options Configuration options
     */
    constructor(app: express.Application, options: { path?: string } = {}) {
        this._app = app;
        this._path = options.path || '/mcp-sse';
        this._sessionId = Math.random().toString(36).substring(2, 15);
        this._clients = new Map();
        this._messageQueue = new Map();
        
        // Set up the SSE endpoint
        this._app.get(this._path, (req, res) => {
            const clientId = req.query.clientId as string || Math.random().toString(36).substring(2, 15);
            
            // Set headers for SSE
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
            
            // Send initial connection message
            res.write(`data: ${JSON.stringify({ type: 'connection', clientId })}\n\n`);
            
            // Store the client connection
            this._clients.set(clientId, res);
            logger.info('SSE client connected', { clientId, path: this._path });
            
            // Send any queued messages
            const queuedMessages = this._messageQueue.get(clientId) || [];
            if (queuedMessages.length > 0) {
                logger.debug('Sending queued messages', { count: queuedMessages.length });
                queuedMessages.forEach(message => {
                    res.write(`data: ${JSON.stringify(message)}\n\n`);
                });
                this._messageQueue.delete(clientId);
            }
            
            // Handle client disconnect
            req.on('close', () => {
                logger.info('SSE client disconnected', { clientId });
                this._clients.delete(clientId);
            });
        });
        
        // Set up the endpoint to receive messages
        this._app.post(`${this._path}/message`, express.json(), async (req, res) => {
            try {
                const message = req.body;
                const clientId = req.query.clientId as string;
                
                logger.debug('Received message', { message, clientId });
                
                if (this.onmessage) {
                    // Handle the message
                    await this.handleMessage(message);
                    
                    // Send a success response
                    res.status(200).json({ success: true });
                } else {
                    logger.warn('No message handler registered');
                    res.status(500).json({ error: 'No message handler registered' });
                }
            } catch (error) {
                logger.error('Error handling message', { 
                    error: error instanceof Error ? error.message : String(error) 
                });
                res.status(500).json({ 
                    error: error instanceof Error ? error.message : 'Unknown error' 
                });
                
                if (this.onerror && error instanceof Error) {
                    this.onerror(error);
                }
            }
        });
        
        // Send keep-alive messages every 30 seconds
        setInterval(() => {
            this._clients.forEach((client, clientId) => {
                try {
                    client.write(': keep-alive\n\n');
                } catch (error) {
                    logger.error('Error sending keep-alive', { 
                        clientId,
                        error: error instanceof Error ? error.message : String(error) 
                    });
                    this._clients.delete(clientId);
                }
            });
        }, 30000);
        
        logger.info('SSE transport initialized', { path: this._path });
    }
    
    /**
     * Starts the transport.
     */
    async start(): Promise<void> {
        logger.info('Starting SSE transport');
        // SSE transport is ready as soon as it's created
        // No additional setup needed
    }
    
    /**
     * Handles a client message.
     */
    async handleMessage(message: unknown): Promise<void> {
        if (this.onmessage) {
            this.onmessage(message as JSONRPCMessage);
        }
    }
    
    /**
     * Closes the transport.
     */
    async close(): Promise<void> {
        logger.info('Closing SSE transport');
        
        // Send close message to all clients
        this._clients.forEach((client, clientId) => {
            try {
                client.write(`data: ${JSON.stringify({ type: 'close' })}\n\n`);
                client.end();
            } catch (error) {
                logger.error('Error closing client connection', { 
                    clientId,
                    error: error instanceof Error ? error.message : String(error) 
                });
            }
        });
        
        this._clients.clear();
        this._messageQueue.clear();
        
        if (this.onclose) {
            this.onclose();
        }
    }
    
    /**
     * Sends a message to all connected clients.
     */
    async send(message: JSONRPCMessage): Promise<void> {
        logger.debug('Sending message to all clients', { 
            clientCount: this._clients.size,
            message 
        });
        
        this._clients.forEach((client, clientId) => {
            try {
                client.write(`data: ${JSON.stringify(message)}\n\n`);
            } catch (error) {
                logger.error('Error sending message to client', { 
                    clientId,
                    error: error instanceof Error ? error.message : String(error) 
                });
                
                // Queue the message for when the client reconnects
                const queuedMessages = this._messageQueue.get(clientId) || [];
                queuedMessages.push(message);
                this._messageQueue.set(clientId, queuedMessages);
                
                // Remove the client
                this._clients.delete(clientId);
            }
        });
    }
    
    /**
     * Returns the session ID for this transport.
     */
    get sessionId(): string {
        return this._sessionId;
    }
} 