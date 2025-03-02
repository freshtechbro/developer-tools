/**
 * Installation options
 */
interface InstallOptions {
    yes?: boolean;
    'api-key'?: string;
    'server-port'?: string;
    'api-enabled'?: boolean;
}
/**
 * Install and configure the developer tools
 * @param options Installation options
 */
export declare function installTools(options: InstallOptions): Promise<void>;
export {};
