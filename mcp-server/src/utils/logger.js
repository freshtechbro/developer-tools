import { config } from '../config/index.js';
// Define log levels and their numeric values
const LogLevels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};
class Logger {
    currentLogLevel;
    constructor(logLevel = 'info') {
        this.currentLogLevel = logLevel;
    }
    shouldLog(level) {
        return LogLevels[level] >= LogLevels[this.currentLogLevel];
    }
    formatMessage(level, message, context) {
        return {
            level,
            message,
            timestamp: new Date().toISOString(),
            context
        };
    }
    log(level, message, context) {
        if (!this.shouldLog(level))
            return;
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
    debug(message, context) {
        this.log('debug', message, context);
    }
    info(message, context) {
        this.log('info', message, context);
    }
    warn(message, context) {
        this.log('warn', message, context);
    }
    error(message, context) {
        this.log('error', message, context);
    }
}
// Create and export singleton instance
export const logger = new Logger(config.logLevel);
