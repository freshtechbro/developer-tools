import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the ConnectionStatus type
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

// Default connection values
const defaultConnectionStatus: ConnectionStatus = {
  isConnected: false,
  connectionType: 'http',
  serverUrl: 'http://localhost:3000',
  lastConnected: null,
};

// Create the context
const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

// Provider component
export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    ...defaultConnectionStatus,
  });

  // Check for saved connection preferences on mount
  useEffect(() => {
    const savedConnectionType = localStorage.getItem('connectionType') as ConnectionType || 'http';
    const savedServerUrl = localStorage.getItem('serverUrl') || 'http://localhost:3000';
    const autoConnect = localStorage.getItem('autoConnect') !== 'false'; // Default to true
    
    // Save auto-connect preference if not already set
    if (localStorage.getItem('autoConnect') === null) {
      localStorage.setItem('autoConnect', 'true');
    }
    
    if (autoConnect) {
      connect(savedConnectionType, savedServerUrl);
    } else {
      setConnectionStatus({
        ...connectionStatus,
        connectionType: savedConnectionType,
        serverUrl: savedServerUrl,
      });
    }
  }, []);

  // Connect to the specified endpoint
  const connect = async (type: ConnectionType, url: string): Promise<boolean> => {
    try {
      console.log(`Connecting with ${type} to ${url}...`);
      
      // In a real implementation, this would handle different connection types
      // For now, we'll simulate a successful connection
      
      // For HTTP, just mark as connected since there's no persistent connection
      if (type === 'http') {
        setConnectionStatus({
          isConnected: true,
          connectionType: type,
          serverUrl: url,
          lastConnected: new Date(),
        });
        
        // Save preferences
        localStorage.setItem('connectionType', type);
        localStorage.setItem('serverUrl', url);
        
        return true;
      } 
      // For SSE, we would establish an EventSource connection in a real implementation
      else if (type === 'sse') {
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setConnectionStatus({
          isConnected: true,
          connectionType: type,
          serverUrl: url,
          lastConnected: new Date(),
        });
        
        // Save preferences
        localStorage.setItem('connectionType', type);
        localStorage.setItem('serverUrl', url);
        
        return true;
      }
      // For WebSocket, we would establish a WebSocket connection in a real implementation
      else if (type === 'websocket') {
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setConnectionStatus({
          isConnected: true,
          connectionType: type,
          serverUrl: url,
          lastConnected: new Date(),
        });
        
        // Save preferences
        localStorage.setItem('connectionType', type);
        localStorage.setItem('serverUrl', url);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Connection error:', error);
      return false;
    }
  };

  // Disconnect from the current connection
  const disconnect = () => {
    // In a real implementation, this would close the connection
    setConnectionStatus({
      ...connectionStatus,
      isConnected: false,
      lastConnected: connectionStatus.lastConnected, // Keep the last connected time
    });
  };

  // Test a connection without changing the current connection
  const testConnection = async (type: ConnectionType, url: string): Promise<boolean> => {
    try {
      console.log(`Testing ${type} connection to ${url}...`);
      
      // Simulate a connection test
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // If successful, we would change the actual connection in the UI
      await connect(type, url);
      
      return true;
    } catch (error) {
      console.error('Test connection error:', error);
      return false;
    }
  };

  return (
    <ConnectionContext.Provider value={{ 
      connectionStatus, 
      connect, 
      disconnect, 
      testConnection 
    }}>
      {children}
    </ConnectionContext.Provider>
  );
};

// Custom hook for using the connection context
export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
}; 