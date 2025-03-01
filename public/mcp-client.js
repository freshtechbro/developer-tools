/**
 * MCP Client - A simple client for the Model Context Protocol
 */
class MCPClient {
    /**
     * Create a new MCP client
     * @param {Object} options - Configuration options
     * @param {string} options.transportType - 'http' or 'sse'
     * @param {string} options.serverUrl - Base URL of the MCP server
     * @param {string} options.endpointPath - Path to the MCP endpoint
     * @param {Function} options.onMessage - Callback for received messages
     * @param {Function} options.onError - Callback for errors
     * @param {Function} options.onStatusChange - Callback for connection status changes
     */
    constructor(options) {
        this.transportType = options.transportType || 'http';
        this.serverUrl = options.serverUrl || 'http://localhost:3001';
        this.endpointPath = options.endpointPath || '/mcp';
        this.onMessage = options.onMessage || (() => {});
        this.onError = options.onError || (() => {});
        this.onStatusChange = options.onStatusChange || (() => {});
        
        this.connected = false;
        this.sseSource = null;
        this.requestId = 1;
    }
    
    /**
     * Connect to the MCP server
     * @returns {Promise<boolean>} - True if connection successful
     */
    async connect() {
        if (this.connected) {
            return true;
        }
        
        try {
            if (this.transportType === 'sse') {
                // For SSE, establish EventSource connection
                const clientId = Date.now();
                const sseUrl = `${this.serverUrl}${this.endpointPath}?clientId=${clientId}`;
                
                return new Promise((resolve, reject) => {
                    try {
                        this.sseSource = new EventSource(sseUrl);
                        
                        this.sseSource.onopen = () => {
                            this.connected = true;
                            this.onStatusChange({ connected: true, transportType: 'sse' });
                            resolve(true);
                        };
                        
                        this.sseSource.onmessage = (event) => {
                            try {
                                const data = JSON.parse(event.data);
                                this.onMessage(data);
                            } catch (error) {
                                this.onError(new Error(`Error parsing SSE message: ${error.message}`));
                            }
                        };
                        
                        this.sseSource.onerror = (error) => {
                            const errorMsg = error.message || 'Unknown SSE connection error';
                            this.onError(new Error(errorMsg));
                            
                            if (this.connected) {
                                this.disconnect();
                            }
                            
                            reject(new Error(errorMsg));
                        };
                        
                        // Set a connection timeout
                        setTimeout(() => {
                            if (!this.connected) {
                                this.sseSource.close();
                                this.sseSource = null;
                                reject(new Error('Connection timeout'));
                            }
                        }, 10000);
                    } catch (error) {
                        reject(new Error(`Failed to create SSE connection: ${error.message}`));
                    }
                });
            } else {
                // For HTTP, just mark as connected since there's no persistent connection
                this.connected = true;
                this.onStatusChange({ connected: true, transportType: 'http' });
                return true;
            }
        } catch (error) {
            this.onError(error);
            return false;
        }
    }
    
    /**
     * Disconnect from the MCP server
     */
    disconnect() {
        if (this.sseSource) {
            this.sseSource.close();
            this.sseSource = null;
        }
        
        this.connected = false;
        this.onStatusChange({ connected: false });
    }
    
    /**
     * Send a request to the MCP server
     * @param {Object} request - The request object to send
     * @returns {Promise<Object>} - The response from the server
     */
    async sendRequest(request) {
        if (!this.connected) {
            throw new Error('Not connected to MCP server');
        }
        
        // Add id if not present
        if (!request.id) {
            request.id = this.requestId++;
        }
        
        try {
            if (this.transportType === 'sse') {
                // For SSE, send via POST to the message endpoint
                const response = await fetch(`${this.serverUrl}${this.endpointPath}/message`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(request)
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
                }
                
                // For SSE, the actual result will come through the SSE connection
                // But we still return the immediate response
                return await response.json();
            } else {
                // For HTTP, send directly to the endpoint
                const response = await fetch(`${this.serverUrl}${this.endpointPath}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(request)
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
                }
                
                return await response.json();
            }
        } catch (error) {
            this.onError(error);
            throw error;
        }
    }
    
    /**
     * Execute a tool
     * @param {string} toolName - Name of the tool to execute
     * @param {string} version - Version of the tool
     * @param {Object} args - Arguments for the tool
     * @returns {Promise<Object>} - The response from the server
     */
    async executeTool(toolName, version, args) {
        const request = {
            method: 'tool/execute',
            params: {
                toolName,
                version: version || '0.1.0',
                arguments: args
            }
        };
        
        return this.sendRequest(request);
    }
    
    /**
     * Execute a web search
     * @param {string} query - The search query
     * @returns {Promise<Object>} - The search results
     */
    async webSearch(query) {
        return this.executeTool('web-search', '0.1.0', { query });
    }
    
    /**
     * Execute a repository analysis
     * @param {string} query - The analysis query
     * @returns {Promise<Object>} - The analysis results
     */
    async repoAnalysis(query) {
        return this.executeTool('repo-analysis', '0.1.0', { query });
    }
    
    /**
     * Execute a browser automation action
     * @param {string} url - The URL to open
     * @param {string} action - The action to perform
     * @returns {Promise<Object>} - The automation results
     */
    async browserAutomation(url, action) {
        return this.executeTool('browser-automation', '0.1.0', { url, action });
    }
}

// Export the client
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MCPClient;
} else {
    window.MCPClient = MCPClient;
} 