#!/usr/bin/env node
/**
 * Initialize the command-line interface
 */
export declare function initCLI(): any;
/**
 * Process a command from chat or IDE
 * @param message The message containing the command
 * @returns Result of the command or null if no command was found
 */
export declare function processCommand(message: string): Promise<any | null>;
/**
 * Export as module for programmatic usage
 */
export declare const devTools: {
    web: (query: string, options?: Record<string, any>) => Promise<any>;
    processCommand: typeof processCommand;
};
