# Start Development Server PowerShell Script
Write-Host "Starting Vite Development Server..." -ForegroundColor Green

# Navigate to the unified-test-interface directory
Set-Location -Path .\unified-test-interface

# Start the development server
Write-Host "Starting the server with 'npm run dev'..." -ForegroundColor Cyan
npm run dev 