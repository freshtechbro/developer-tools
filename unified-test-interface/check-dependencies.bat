@echo off
echo Checking for and installing missing dependencies...

cd unified-test-interface

echo Installing React dependencies...
call npm install react react-dom @types/react @types/react-dom --save

echo Installing Babel dependencies...
call npm install @babel/core @babel/preset-env @babel/preset-react @babel/preset-typescript --save-dev

echo Installing required Vite plugins...
call npm install @vitejs/plugin-react --save-dev

echo Installing ESLint dependencies...
call npm install eslint eslint-plugin-react eslint-plugin-react-hooks @typescript-eslint/eslint-plugin @typescript-eslint/parser --save-dev

echo Installing utility libraries...
call npm install classnames @types/classnames --save

echo All dependencies have been installed!
echo.
pause 