/**
 * Environment detection utilities for the CLI
 */

/**
 * Possible environments in which the CLI can run
 */
export enum Environment {
  CURSOR = 'cursor',
  WINDSURF = 'windsurf',
  VSCODE = 'vscode',
  TERMINAL = 'terminal',
  UNKNOWN = 'unknown'
}

/**
 * Detect the current environment
 * @returns The detected environment
 */
export function detectEnvironment(): Environment {
  // Check for Cursor
  if (process.env.CURSOR_PID || process.env.CURSOR_TERMINAL) {
    return Environment.CURSOR;
  }
  
  // Check for Windsurf
  if (process.env.WINDSURF_PID || process.env.WINDSURF_TERMINAL) {
    return Environment.WINDSURF;
  }
  
  // Check for VS Code
  if (process.env.VSCODE_PID || process.env.TERM_PROGRAM === 'vscode') {
    return Environment.VSCODE;
  }
  
  // Default to terminal
  return Environment.TERMINAL;
}

/**
 * Check if running in an IDE terminal
 * @returns True if running in an IDE terminal
 */
export function isIdeTerminal(): boolean {
  const env = detectEnvironment();
  return env === Environment.CURSOR || 
         env === Environment.WINDSURF || 
         env === Environment.VSCODE;
}

/**
 * Get information about the current environment
 * @returns Object with environment information
 */
export function getEnvironmentInfo(): {
  environment: Environment;
  isIde: boolean;
  details: Record<string, string>;
} {
  const environment = detectEnvironment();
  const isIde = isIdeTerminal();
  
  // Collect relevant environment variables
  const details: Record<string, string> = {};
  
  // Cursor-specific
  if (process.env.CURSOR_PID) details.cursorPid = process.env.CURSOR_PID;
  if (process.env.CURSOR_TERMINAL) details.cursorTerminal = process.env.CURSOR_TERMINAL;
  
  // Windsurf-specific
  if (process.env.WINDSURF_PID) details.windsurfPid = process.env.WINDSURF_PID;
  if (process.env.WINDSURF_TERMINAL) details.windsurfTerminal = process.env.WINDSURF_TERMINAL;
  
  // VS Code-specific
  if (process.env.VSCODE_PID) details.vscodePid = process.env.VSCODE_PID;
  if (process.env.TERM_PROGRAM) details.termProgram = process.env.TERM_PROGRAM;
  
  return {
    environment,
    isIde,
    details
  };
} 