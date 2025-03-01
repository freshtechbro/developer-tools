// Global variables
let eventSource = null;
let httpSessionId = null;
let sseSessionId = null;

// DOM Elements
const httpUrlInput = document.getElementById('http-url');
const sseUrlInput = document.getElementById('sse-url');
const clientIdInput = document.getElementById('client-id');

const httpStatusEl = document.getElementById('http-status');
const sseStatusEl = document.getElementById('sse-status');
const sseConnectionDetails = document.getElementById('sse-connection-details');

const initializeHttpBtn = document.getElementById('initialize-http');
const connectSseBtn = document.getElementById('connect-sse');
const sendHttpBtn = document.getElementById('send-http');
const sendSseBtn = document.getElementById('send-sse');
const clearLogsBtn = document.getElementById('clear-logs');

const httpMethodSelect = document.getElementById('http-method');
const httpPayloadInput = document.getElementById('http-payload');
const sseMethodSelect = document.getElementById('sse-method');
const ssePayloadInput = document.getElementById('sse-payload');

const connectionEventsEl = document.getElementById('connection-events');
const receivedMessagesEl = document.getElementById('received-messages');
const sentMessagesEl = document.getElementById('sent-messages');

// Tab functionality
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.getAttribute('data-tab');
        
        // Update active tab button
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Show selected tab content
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === tabName) {
                content.classList.add('active');
            }
        });
    });
});

// Logging functions
function logConnectionEvent(message) {
    const timestamp = new Date().toLocaleTimeString();
    connectionEventsEl.textContent = `[${timestamp}] ${message}\n` + connectionEventsEl.textContent;
}

function logReceivedMessage(message) {
    const timestamp = new Date().toLocaleTimeString();
    let messageText = typeof message === 'string' ? message : JSON.stringify(message, null, 2);
    receivedMessagesEl.textContent = `[${timestamp}] ${messageText}\n` + receivedMessagesEl.textContent;
}

function logSentMessage(message) {
    const timestamp = new Date().toLocaleTimeString();
    sentMessagesEl.textContent = `[${timestamp}] ${JSON.stringify(message, null, 2)}\n` + sentMessagesEl.textContent;
}

function updateHttpStatus(status, isError = false) {
    httpStatusEl.textContent = status;
    httpStatusEl.className = 'status ' + (isError ? 'error' : 'success');
}

function updateSseStatus(status, isError = false) {
    sseStatusEl.textContent = status;
    sseStatusEl.className = 'status ' + (isError ? 'error' : 'success');
}

// HTTP Transport Functions
function initializeHttp() {
    const httpUrl = httpUrlInput.value;
    const clientId = clientIdInput.value || generateClientId();
    
    logConnectionEvent(`Initializing HTTP connection to ${httpUrl}`);
    
    const message = {
        jsonrpc: '2.0',
        id: Date.now().toString(),
        method: 'initialize',
        params: {
            clientId
        }
    };
    
    sendHttpRequest(message)
        .then(response => {
            if (response && response.result) {
                httpSessionId = response.result.sessionId || clientId;
                updateHttpStatus(`Connected (ID: ${httpSessionId})`, false);
                logConnectionEvent(`HTTP initialized with session ID: ${httpSessionId}`);
                sendHttpBtn.disabled = false;
            } else {
                updateHttpStatus('Error initializing', true);
                logConnectionEvent(`Error initializing HTTP: Invalid response`);
            }
        })
        .catch(error => {
            updateHttpStatus('Connection error', true);
            logConnectionEvent(`HTTP connection error: ${error.message}`);
        });
}

async function sendHttpRequest(message, customUrl = null) {
    try {
        const url = customUrl || httpUrlInput.value;
        logSentMessage(message);
        
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (httpSessionId) {
            headers['X-Session-ID'] = httpSessionId;
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(message)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        
        const data = await response.json();
        logReceivedMessage(data);
        return data;
    } catch (error) {
        logConnectionEvent(`Error sending HTTP request: ${error.message}`);
        throw error;
    }
}

// SSE Transport Functions
function connectToSSE() {
    const sseUrl = sseUrlInput.value;
    const clientId = clientIdInput.value || generateClientId();
    
    // Close existing connection if any
    if (eventSource) {
        eventSource.close();
    }
    
    logConnectionEvent(`Connecting to SSE: ${sseUrl}`);
    
    // Add clientId as query parameter if provided
    let url = new URL(sseUrl);
    if (clientId) {
        url.searchParams.append('clientId', clientId);
    }
    
    try {
        // Create new EventSource connection
        eventSource = new EventSource(url.toString());
        
        // Connection opened event
        eventSource.onopen = function() {
            logConnectionEvent('SSE connection opened');
            updateSseStatus('Connected', false);
            sendSseBtn.disabled = false;
        };
        
        // Message received event
        eventSource.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                logReceivedMessage(data);
                
                // Check for session ID in connection message
                if (data.method === 'connection' && data.params?.sessionId) {
                    sseSessionId = data.params.sessionId;
                    updateSseStatus(`Connected (ID: ${sseSessionId})`, false);
                    logConnectionEvent(`SSE assigned session ID: ${sseSessionId}`);
                }
                
                // Update connection details
                updateConnectionDetails();
            } catch (e) {
                logReceivedMessage(`Raw data: ${event.data}`);
            }
        };
        
        // Error event
        eventSource.onerror = function(error) {
            logConnectionEvent(`SSE connection error: ${error.type}`);
            updateSseStatus('Connection error', true);
            
            // Clean up on error
            // Don't disconnect here to allow auto-reconnect
        };
        
        // Monitor connection state
        monitorSseConnection();
    } catch (error) {
        logConnectionEvent(`Error creating SSE connection: ${error.message}`);
        updateSseStatus(`Error: ${error.message}`, true);
    }
}

function disconnectSSE() {
    if (eventSource) {
        logConnectionEvent('Disconnecting from SSE');
        eventSource.close();
        eventSource = null;
        updateSseStatus('Disconnected');
        sendSseBtn.disabled = true;
    }
}

function monitorSseConnection() {
    if (!eventSource) return;
    
    const checkInterval = setInterval(() => {
        if (!eventSource) {
            clearInterval(checkInterval);
            return;
        }
        
        const states = ['CONNECTING', 'OPEN', 'CLOSED'];
        const stateText = states[eventSource.readyState] || 'UNKNOWN';
        
        logConnectionEvent(`SSE state: ${stateText} (${eventSource.readyState})`);
        updateConnectionDetails();
        
        if (eventSource.readyState === 2) { // CLOSED
            clearInterval(checkInterval);
            updateSseStatus('Disconnected', true);
            sendSseBtn.disabled = true;
            logConnectionEvent('SSE connection closed');
        }
    }, 5000); // Check every 5 seconds
}

function updateConnectionDetails() {
    if (!eventSource) {
        sseConnectionDetails.textContent = 'No active connection';
        return;
    }
    
    const states = ['CONNECTING', 'OPEN', 'CLOSED'];
    const stateText = states[eventSource.readyState] || 'UNKNOWN';
    
    sseConnectionDetails.textContent = `
Session ID: ${sseSessionId || 'Not assigned'}
URL: ${sseUrlInput.value}
State: ${stateText}
ReadyState: ${eventSource.readyState}
    `;
}

// Utility functions
function generateClientId() {
    return `client-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// Event listeners
initializeHttpBtn.addEventListener('click', initializeHttp);
connectSseBtn.addEventListener('click', connectToSSE);
clearLogsBtn.addEventListener('click', () => {
    connectionEventsEl.textContent = '';
    receivedMessagesEl.textContent = '';
    sentMessagesEl.textContent = '';
});

sendHttpBtn.addEventListener('click', () => {
    const method = httpMethodSelect.value;
    let payload = {};
    
    try {
        payload = httpPayloadInput.value ? JSON.parse(httpPayloadInput.value) : {};
    } catch (error) {
        logConnectionEvent(`Error parsing HTTP payload JSON: ${error.message}`);
        return;
    }
    
    const message = {
        jsonrpc: '2.0',
        id: Date.now().toString(),
        method,
        params: {
            ...payload,
            sessionId: httpSessionId
        }
    };
    
    // Add method-specific params if needed
    if (method === 'web-search' && !message.params.query) {
        message.params.query = 'test search';
    } else if (method === 'repo-analysis' && !message.params.repository) {
        message.params.repository = 'test-repo';
    }
    
    sendHttpRequest(message);
});

sendSseBtn.addEventListener('click', () => {
    const method = sseMethodSelect.value;
    let payload = {};
    
    try {
        payload = ssePayloadInput.value ? JSON.parse(ssePayloadInput.value) : {};
    } catch (error) {
        logConnectionEvent(`Error parsing SSE payload JSON: ${error.message}`);
        return;
    }
    
    const message = {
        jsonrpc: '2.0',
        id: Date.now().toString(),
        method,
        params: {
            ...payload,
            sessionId: sseSessionId
        }
    };
    
    // Add method-specific params if needed
    if (method === 'web-search' && !message.params.query) {
        message.params.query = 'test search';
    } else if (method === 'repo-analysis' && !message.params.repository) {
        message.params.repository = 'test-repo';
    }
    
    // Send message via HTTP POST to SSE endpoint
    sendHttpRequest(message, sseUrlInput.value);
});

// Initialize
logConnectionEvent('Client initialized');
updateConnectionDetails(); 