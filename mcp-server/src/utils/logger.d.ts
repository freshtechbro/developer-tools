declare const LogLevels: {
    readonly debug: 0;
    readonly info: 1;
    readonly warn: 2;
    readonly error: 3;
};
type LogLevel = keyof typeof LogLevels;
declare class Logger {
    private currentLogLevel;
    constructor(logLevel?: LogLevel);
    private shouldLog;
    private formatMessage;
    private log;
    debug(message: string, context?: Record<string, unknown>): void;
    info(message: string, context?: Record<string, unknown>): void;
    warn(message: string, context?: Record<string, unknown>): void;
    error(message: string, context?: Record<string, unknown>): void;
}
export declare const logger: Logger;
export {};
