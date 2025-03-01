@echo off
echo === Starting Unified Test Interface ===
echo Starting unified backend server...

start cmd /k "node unified-backend.js"

echo.
echo The unified backend is now running!
echo.
echo To start the React development server:
echo 1. Open a new terminal
echo 2. Navigate to the unified-test-interface directory
echo 3. Run: npm run dev
echo.
echo Or to use the production build:
echo 1. Run: npm run build:unified
echo 2. The built interface will be automatically served by the backend
echo.
echo Press Ctrl+C in the backend terminal to stop the server 