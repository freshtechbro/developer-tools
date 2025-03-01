@echo off
echo Starting UI build process...

cd unified-test-interface

echo Step 1: Checking and installing dependencies...
call check-dependencies.bat

echo Step 2: Running ESLint to fix any issues...
call npx eslint --fix src/**/*.{ts,tsx}

echo Step 3: Building the UI...
call npm run build

echo UI build process completed successfully!
echo You can serve the built files from the 'dist' directory.
echo.

pause 