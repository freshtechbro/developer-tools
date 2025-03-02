/**
 * Developer Tools API client for the web interface
 */

// Default API URL
const DEFAULT_API_URL = 'http://localhost:3001/api';

/**
 * Developer Tools API client
 */
export class DeveloperToolsApi {
  /**
   * Create a new API client
   * @param {string} apiUrl API URL
   */
  constructor(apiUrl = DEFAULT_API_URL) {
    this.apiUrl = apiUrl;
    this.websocket = null;
    this.websocketCallbacks = {
      onOpen: () => {},
      onMessage: () => {},
      onClose: () => {},
      onError: () => {}
    };
  }
  
  /**
   * Set the API URL
   * @param {string} apiUrl API URL
   */
  setApiUrl(apiUrl) {
    this.apiUrl = apiUrl;
  }
  
  /**
   * Get all available tools
   * @returns {Promise<Array>} List of tools
   */
  async getTools() {
    try {
      const response = await fetch(`${this.apiUrl}/tools`);
      const data = await response.json();
      return data.tools || [];
    } catch (error) {
      console.error('Failed to fetch tools:', error);
      return [];
    }
  }
  
  /**
   * Get information about a specific tool
   * @param {string} toolName Tool name
   * @returns {Promise<Object>} Tool information
   */
  async getToolInfo(toolName) {
    try {
      const response = await fetch(`${this.apiUrl}/tools/${toolName}`);
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch tool info for ${toolName}:`, error);
      throw error;
    }
  }
  
  /**
   * Execute a tool
   * @param {string} toolName Tool name
   * @param {Object} request Request data
   * @returns {Promise<Object>} Tool execution result
   */
  async executeTool(toolName, request = {}) {
    try {
      const response = await fetch(`${this.apiUrl}/tools/${toolName}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });
      
      return await response.json();
    } catch (error) {
      console.error(`Failed to execute tool ${toolName}:`, error);
      throw error;
    }
  }
  
  /**
   * Process a chat message
   * @param {string} message Chat message
   * @returns {Promise<Object>} Chat processing result
   */
  async processChat(message) {
    try {
      const response = await fetch(`${this.apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Failed to process chat message:', error);
      throw error;
    }
  }
  
  /**
   * Connect to the WebSocket server
   * @param {Object} callbacks Callbacks for WebSocket events
   */
  connectWebSocket(callbacks = {}) {
    // Close existing connection
    if (this.websocket) {
      this.websocket.close();
    }
    
    // Extract the base URL from the API URL
    const wsUrl = this.apiUrl.replace(/^http/, 'ws').replace(/\/api$/, '');
    
    // Create new connection
    this.websocket = new WebSocket(wsUrl);
    
    // Set callbacks
    this.websocketCallbacks = {
      ...this.websocketCallbacks,
      ...callbacks
    };
    
    // Set up event handlers
    this.websocket.onopen = (event) => {
      console.log('WebSocket connection established');
      
      // Register as a web client
      this.websocket.send(JSON.stringify({
        type: 'register',
        clientType: 'web'
      }));
      
      this.websocketCallbacks.onOpen(event);
    };
    
    this.websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.websocketCallbacks.onMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    this.websocket.onclose = (event) => {
      console.log('WebSocket connection closed');
      this.websocketCallbacks.onClose(event);
    };
    
    this.websocket.onerror = (event) => {
      console.error('WebSocket error:', event);
      this.websocketCallbacks.onError(event);
    };
  }
  
  /**
   * Send a message via WebSocket
   * @param {Object} data Message data
   */
  sendWebSocketMessage(data) {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }
    
    this.websocket.send(JSON.stringify(data));
  }
  
  /**
   * Execute a tool via WebSocket
   * @param {string} toolName Tool name
   * @param {Object} request Request data
   */
  executeToolViaWebSocket(toolName, request = {}) {
    this.sendWebSocketMessage({
      type: 'execute_tool',
      tool: toolName,
      request
    });
  }
  
  /**
   * Send a chat message via WebSocket
   * @param {string} message Chat message
   */
  sendChatViaWebSocket(message) {
    this.sendWebSocketMessage({
      type: 'chat',
      message
    });
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  disconnectWebSocket() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }
} 