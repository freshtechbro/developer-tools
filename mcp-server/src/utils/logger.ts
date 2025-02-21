import { config } from '../config/index.js';

// Define log levels and their numeric values
const LogLevels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
} as const;

type LogLevel = keyof typeof LogLevels;

interface LogMessage {
    level: LogLevel;
    message: string;
    timestamp: string;
    context?: Record<string, unknown>;
}

class Logger {
    private currentLogLevel: LogLevel;

    constructor(logLevel: LogLevel = 'info') {
        this.currentLogLevel = logLevel;
    }

    private shouldLog(level: LogLevel): boolean {
        return LogLevels[level] >= LogLevels[this.currentLogLevel];
    }

    private formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): LogMessage {
        return {
            level,
            message,
            timestamp: new Date().toISOString(),
            context
        };
    }

    private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
        if (!this.shouldLog(level)) return;

        const logMessage = this.formatMessage(level, message, context);
        const output = JSON.stringify(logMessage);

        switch (level) {
            case 'error':
                console.error(output);
                break;
            case 'warn':
                console.warn(output);
                break;
            default:
                console.log(output);
        }
    }

    debug(message: string, context?: Record<string, unknown>) {
        this.log('debug', message, context);
    }

    info(message: string, context?: Record<string, unknown>) {
        this.log('info', message, context);
    }

    warn(message: string, context?: Record<string, unknown>) {
        this.log('warn', message, context);
    }

    error(message: string, context?: Record<string, unknown>) {
        this.log('error', message, context);
    }
}

// Create and export singleton instance
export const logger = new Logger(config.logLevel); 