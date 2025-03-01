@echo off
echo Starting development server...

cd unified-test-interface

echo Checking and installing dependencies...
call check-dependencies.bat

echo Starting the development server...
call npm run dev

pause 