@echo off
echo === Starting Vite Development Server (All Interfaces) ===

REM Kill any existing process on port 3000
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') DO (
  echo Killing process %%P on port 3000...
  taskkill /F /PID %%P
)

REM Change to the project directory
cd unified-test-interface

REM Clear Vite cache if it exists
if exist node_modules\.vite (
  echo Clearing Vite cache...
  rmdir /s /q node_modules\.vite
)

REM Start the development server with specific host
echo Starting the development server on all interfaces...
npm run dev -- --host 0.0.0.0 --port 3000 --strictPort=false

pause 