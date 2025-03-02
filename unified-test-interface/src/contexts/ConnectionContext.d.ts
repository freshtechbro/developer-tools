import React from 'react';
export type ConnectionType = 'http' | 'sse' | 'websocket';
export interface ConnectionStatus {
    isConnected: boolean;
    connectionType: ConnectionType;
    serverUrl: string;
    lastConnected: Date | null;
}
interface ConnectionContextType {
    connectionStatus: ConnectionStatus;
    connect: (type: ConnectionType, url: string) => Promise<boolean>;
    disconnect: () => void;
    testConnection: (type: ConnectionType, url: string) => Promise<boolean>;
}
export declare const ConnectionProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare const useConnection: () => ConnectionContextType;
export {};
