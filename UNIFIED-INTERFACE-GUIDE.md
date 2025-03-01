# Unified Test Interface Quick Start Guide

This guide will walk you through getting the unified test interface up and running.

## Running the Backend Server

The unified test interface consists of a backend server and a frontend React application. You can run them in different ways depending on your needs.

### Method 1: Run the Backend Server Only (Recommended)

If you just want to start the backend server:

```bash
npm run start:unified-backend
```

This will start the backend server at http://localhost:3003.

### Method 2: Use the Windows Batch File

On Windows, you can use the batch file:

```bash
start-unified.bat
```

This will open a new command window running the backend server.

## Running the Frontend Development Server

To run the React development server (with hot reloading):

1. Open a new terminal window
2. Navigate to the unified-test-interface directory:

```bash
cd unified-test-interface
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser to http://localhost:5173 (or the URL shown in the console)

## Building for Production

To build the React application and use it with the backend:

```bash
npm run build:unified
```

This will:
1. Install dependencies for the React application (if needed)
2. Build the React application
3. Put the build files in the right place for the backend to serve

After building, you can start the server which will serve the built files:

```bash
npm run start:unified-backend
```

Then open your browser to http://localhost:3003

## All-in-One Production Command

To build and start in one command:

```bash
npm run start:unified-complete
```

## Troubleshooting

### If concurrently is not found:

The `dev:unified` script uses concurrently which might not be installed. You can install it globally:

```bash
npm install -g concurrently
```

Or just use the separate commands as described above.

### If you get module not found errors:

Make sure all dependencies are installed:

```bash
npm install
cd unified-test-interface
npm install
cd ..
```

### If the backend server has issues:

Check that the port 3003 is not already in use:

```bash
npx kill-port 3003
```

Then try starting the server again. 