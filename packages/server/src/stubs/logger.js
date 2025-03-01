// This is a stub implementation of the logger
// It will be used by the transport servers for testing

// Define the logger
export const logger = {
  // Log an info message
  info: (message, meta = {}) => {
    console.log(`[INFO] ${message}`, meta);
  },
  
  // Log a warning message
  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${message}`, meta);
  },
  
  // Log an error message
  error: (message, meta = {}) => {
    console.error(`[ERROR] ${message}`, meta);
  },
  
  // Log a debug message
  debug: (message, meta = {}) => {
    console.debug(`[DEBUG] ${message}`, meta);
  }
}; 