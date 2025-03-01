# PowerShell script to start all servers in separate windows
Write-Host "Starting all servers..."

# Kill any existing processes on our ports
try {
    Write-Host "Killing any existing processes on ports 3001, 3002, 3003..."
    npx kill-port 3001 3002 3003
} catch {
    Write-Host "No processes to kill or kill-port not available."
}

# Function to start a process in a new window
function Start-ServerWindow {
    param (
        [string]$Title,
        [string]$Command
    )
    
    Write-Host "Starting $Title..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting $Title'; $Command"
}

# Start HTTP Transport Server
Start-ServerWindow -Title "HTTP Transport Server (3001)" -Command "cd '$PWD'; node packages/server/src/http-transport.js"

# Wait a moment to ensure the first window is properly started
Start-Sleep -Seconds 2

# Start SSE Transport Server
Start-ServerWindow -Title "SSE Transport Server (3002)" -Command "cd '$PWD'; node packages/server/src/sse-transport.js"

# Wait a moment to ensure the second window is properly started
Start-Sleep -Seconds 2

# Start Web Interface Server
Start-ServerWindow -Title "Web Interface (3003)" -Command "cd '$PWD'; npx http-server public -p 3003 --cors"

# Wait a bit to make sure all servers have started
Start-Sleep -Seconds 5

# Open the web interface in the default browser
Write-Host "Opening web interface in browser..."
Start-Process "http://localhost:3003/"

Write-Host "All servers started!"
Write-Host "HTTP Transport: http://localhost:3001/mcp"
Write-Host "SSE Transport: http://localhost:3002/mcp-sse"
Write-Host "Web Interface: http://localhost:3003/" 