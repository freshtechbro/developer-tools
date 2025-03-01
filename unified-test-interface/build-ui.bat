@echo off
echo ===== Building Unified Test Interface =====

echo Installing dependencies...
call npm install

echo Running ESLint Fix...
call npm run lint:fix

echo Building the UI...
call npm run build

echo Build process complete!
echo If successful, the built files are in the dist directory.
echo To serve these files, run the unified backend server.
pause 