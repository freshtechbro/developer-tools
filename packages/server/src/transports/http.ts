import type { Transport } from '@modelcontextprotocol/sdk/dist/esm/shared/transport.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/dist/esm/types.js';
import express from 'express';
import { logger } from '@developer-tools/shared/logger';

/**
 * Server transport for HTTP: this will send and receive messages over HTTP.
 * 
 * This transport is only available in Node.js environments.
 */
export class HttpServerTransport implements Transport {
    private _app: express.Application;
    private _path: string;
    private _sessionId: string;
    
    onclose?: () => void;
    onerror?: (error: Error) => void;
    onmessage?: (message: JSONRPCMessage) => void;
    
    /**
     * Creates a new HTTP server transport.
     * 
     * @param app Express application instance
     * @param options Configuration options
     */
    constructor(app: express.Application, options: { path?: string } = {}) {
        this._app = app;
        this._path = options.path || '/mcp';
        this._sessionId = Math.random().toString(36).substring(2, 15);
        
        // Set up the endpoint to receive messages
        this._app.post(this._path, express.json(), async (req, res) => {
            try {
                const message = req.body;
                logger.debug('Received message', { message });
                
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
        
        logger.info('HTTP transport initialized', { path: this._path });
    }
    
    /**
     * Starts the transport.
     */
    async start(): Promise<void> {
        logger.info('Starting HTTP transport');
        // HTTP transport is ready as soon as it's created
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
        logger.info('Closing HTTP transport');
        if (this.onclose) {
            this.onclose();
        }
    }
    
    /**
     * Sends a message to the client.
     * 
     * Note: Since HTTP is request/response based, this will log the message
     * but it can't actually send it to the client unless the client is making
     * a request at that moment.
     */
    async send(message: JSONRPCMessage): Promise<void> {
        logger.debug('Sending message', { message });
        // In a real implementation, this might use a queue or WebSocket to send messages
        // For now, we just log it since HTTP is request/response based
    }
    
    /**
     * Returns the session ID for this transport.
     */
    get sessionId(): string {
        return this._sessionId;
    }
} 