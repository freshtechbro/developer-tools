export declare const ServerConfigSchema: any;
export declare const config: {
    name: string;
    version: string;
    description: string;
    logLevel: any;
    env: any;
    port: number | undefined;
    host: any;
    perplexityApiKey: any;
    googleApiKey: any;
    restApi: {
        enabled: boolean;
        port: number;
        host: any;
    };
    httpTransport: {
        enabled: boolean;
        port: number;
        host: any;
        path: any;
    };
    sseTransport: {
        enabled: boolean;
        port: number;
        host: any;
        path: any;
    };
    https: {
        enabled: boolean;
        keyPath: any;
        certPath: any;
    };
    webInterface: {
        enabled: boolean;
        port: number;
    };
    features: {
        webSearch: boolean;
        repoAnalysis: boolean;
        browserAutomation: boolean;
        webInterface: boolean;
    };
};
export declare const environment: any;
