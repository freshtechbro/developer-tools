# Restart Development Server PowerShell Script
Write-Host "Restarting Vite Development Server..." -ForegroundColor Green

# Function to find and kill processes on a specific port
function Stop-ProcessOnPort {
    param (
        [int]$Port
    )
    
    Write-Host "Checking for processes on port $Port..." -ForegroundColor Yellow
    $processInfo = netstat -ano | findstr ":$Port"
    
    if ($processInfo) {
        $processInfo -match "\s+(\d+)$" | Out-Null
        $processId = $matches[1]
        
        if ($processId) {
            Write-Host "Killing process ID $processId on port $Port..." -ForegroundColor Red
            Stop-Process -Id $processId -Force
            Write-Host "Process killed." -ForegroundColor Green
        }
    } else {
        Write-Host "No process found on port $Port." -ForegroundColor Green
    }
}

# Kill any process on port 3000
Stop-ProcessOnPort -Port 3000

# Navigate to the unified-test-interface directory
Write-Host "Changing to unified-test-interface directory..." -ForegroundColor Cyan
Set-Location -Path .\unified-test-interface

# Delete node_modules/.vite if it exists (to clear cache)
if (Test-Path -Path "node_modules\.vite") {
    Write-Host "Clearing Vite cache..." -ForegroundColor Yellow
    Remove-Item -Path "node_modules\.vite" -Recurse -Force
}

# Start the development server
Write-Host "Starting the server with 'npm run dev'..." -ForegroundColor Cyan
npm run dev 