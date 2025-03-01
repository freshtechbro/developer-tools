#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

// Create Express app
const app = express();
const PORT = 3003;

// Configure middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Log requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime()
  });
});

// Main API endpoint
app.post('/api/command', async (req, res) => {
  try {
    const { command, query } = req.body;
    console.log('Received command request:', { command, query });
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (command === 'web-search') {
      // Simulate a web search response
      res.json({
        success: true,
        results: `Search results for: ${query}`,
        metadata: {
          provider: 'test',
          cached: false,
          timestamp: new Date().toISOString()
        }
      });
    } else if (command === 'command-interceptor') {
      // Simulate a command interceptor response
      res.json({
        success: true,
        message: 'Command processed',
        command: req.body.message,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Unknown command',
        message: `Command '${command}' is not supported`
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Static content endpoint
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Developer Tools Test Interface</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .input-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; }
        input[type="text"] { width: 100%; padding: 8px; font-size: 16px; }
        button { padding: 10px 15px; background: #4CAF50; color: white; border: none; cursor: pointer; }
        .result { margin-top: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        pre { background-color: #f5f5f5; padding: 10px; overflow: auto; }
      </style>
    </head>
    <body>
      <h1>Developer Tools Test Interface</h1>
      
      <div class="input-group">
        <label for="command">Command:</label>
        <select id="command">
          <option value="web-search">Web Search</option>
          <option value="command-interceptor">Command Interceptor</option>
        </select>
      </div>
      
      <div class="input-group">
        <label for="query">Query:</label>
        <input type="text" id="query" placeholder="Enter your query">
      </div>
      
      <button id="submit">Submit</button>
      
      <div class="result">
        <h3>Results:</h3>
        <pre id="results">Results will appear here...</pre>
      </div>
      
      <script>
        document.getElementById('submit').addEventListener('click', async () => {
          const command = document.getElementById('command').value;
          const query = document.getElementById('query').value;
          const resultsElement = document.getElementById('results');
          
          if (!query) {
            resultsElement.textContent = 'Please enter a query';
            return;
          }
          
          resultsElement.textContent = 'Loading...';
          
          try {
            const response = await fetch('/api/command', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ command, query })
            });
            
            const data = await response.json();
            resultsElement.textContent = JSON.stringify(data, null, 2);
          } catch (error) {
            resultsElement.textContent = 'Error: ' + error.message;
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/command`);
  console.log(`Health check: http://localhost:${PORT}/health`);
}); 