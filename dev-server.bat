@echo off
echo === Starting Vite Development Server ===

REM Change to the project directory
cd unified-test-interface

REM Clear Vite cache if it exists
if exist node_modules\.vite (
  echo Clearing Vite cache...
  rmdir /s /q node_modules\.vite
)

REM Start the development server with specific host
echo Starting the development server...
npm run dev -- --host localhost --port 3000 --strictPort

pause 