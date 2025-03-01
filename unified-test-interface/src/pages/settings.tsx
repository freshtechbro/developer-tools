import React, { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { CardContainer } from '@/components/layout/card-container'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useConnection, ConnectionType } from '@/contexts/ConnectionContext'
import { toast } from '@/components/ui/use-toast'

export default function SettingsPage() {
  const { connectionStatus, connect, disconnect, testConnection } = useConnection();
  
  const [apiKeys, setApiKeys] = useState({
    perplexity: '',
    gemini: '',
    openai: ''
  })

  const [preferences, setPreferences] = useState({
    theme: 'system',
    defaultProvider: 'perplexity',
    saveHistory: true,
    telemetry: true,
    autoUpdate: true
  })

  const [connections, setConnections] = useState({
    serverUrl: connectionStatus.serverUrl,
    connectionType: connectionStatus.connectionType,
    autoConnect: true
  })
  
  // Load settings when component mounts
  useEffect(() => {
    // Load auto-connect setting from localStorage
    const savedAutoConnect = localStorage.getItem('autoConnect');
    if (savedAutoConnect !== null) {
      setConnections(prev => ({
        ...prev,
        autoConnect: savedAutoConnect !== 'false'
      }));
    }
    
    // Update connection settings from context
    setConnections(prev => ({
      ...prev,
      serverUrl: connectionStatus.serverUrl,
      connectionType: connectionStatus.connectionType
    }));
  }, [connectionStatus]);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setApiKeys(prev => ({ ...prev, [name]: value }))
  }

  const handlePreferenceChange = (name: string, value: any) => {
    setPreferences(prev => ({ ...prev, [name]: value }))
  }

  const handleConnectionChange = (name: string, value: any) => {
    setConnections(prev => ({ ...prev, [name]: value }))
    
    // Save auto-connect preference immediately
    if (name === 'autoConnect') {
      localStorage.setItem('autoConnect', value.toString());
    }
  }
  
  const handleTestConnection = async () => {
    try {
      // Test the connection with the currently selected type and URL
      const success = await testConnection(
        connections.connectionType as ConnectionType, 
        connections.serverUrl
      );
      
      if (success) {
        toast({
          title: 'Connection Successful',
          description: `Successfully connected using ${connections.connectionType.toUpperCase()}`,
        });
      } else {
        toast({
          title: 'Connection Failed',
          description: 'Unable to establish connection. Please check your settings.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Connection Error',
        description: 'An error occurred while testing the connection.',
        variant: 'destructive',
      });
    }
  };
  
  const handleDisconnect = () => {
    disconnect();
    toast({
      title: 'Disconnected',
      description: 'Successfully disconnected from the server.',
    });
  };

  const handleSaveSettings = () => {
    // Save connection settings
    if (connectionStatus.connectionType !== connections.connectionType || 
        connectionStatus.serverUrl !== connections.serverUrl) {
      connect(connections.connectionType as ConnectionType, connections.serverUrl);
    }
    
    // Save other settings to localStorage
    localStorage.setItem('theme', preferences.theme);
    localStorage.setItem('defaultProvider', preferences.defaultProvider);
    localStorage.setItem('saveHistory', preferences.saveHistory.toString());
    localStorage.setItem('telemetry', preferences.telemetry.toString());
    localStorage.setItem('autoUpdate', preferences.autoUpdate.toString());
    
    toast({
      title: 'Settings Saved',
      description: 'Your settings have been saved successfully.',
    });
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Configure application settings and preferences
          </p>
        </div>
        
        <Tabs defaultValue="api-keys" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
          </TabsList>
          
          <TabsContent value="api-keys" className="space-y-6">
            <CardContainer title="API Keys" description="Configure API keys for various providers">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="perplexity">Perplexity API Key</Label>
                  <Input
                    id="perplexity"
                    name="perplexity"
                    type="password"
                    placeholder="Enter Perplexity API key"
                    value={apiKeys.perplexity}
                    onChange={handleApiKeyChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your API key from the <a href="https://www.perplexity.ai/settings" className="text-primary hover:underline" target="_blank" rel="noreferrer">Perplexity dashboard</a>
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gemini">Google Gemini API Key</Label>
                  <Input
                    id="gemini"
                    name="gemini"
                    type="password"
                    placeholder="Enter Google Gemini API key"
                    value={apiKeys.gemini}
                    onChange={handleApiKeyChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your API key from the <a href="https://ai.google.dev/" className="text-primary hover:underline" target="_blank" rel="noreferrer">Google AI Studio</a>
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="openai">OpenAI API Key</Label>
                  <Input
                    id="openai"
                    name="openai"
                    type="password"
                    placeholder="Enter OpenAI API key"
                    value={apiKeys.openai}
                    onChange={handleApiKeyChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your API key from the <a href="https://platform.openai.com/api-keys" className="text-primary hover:underline" target="_blank" rel="noreferrer">OpenAI dashboard</a>
                  </p>
                </div>
              </div>
            </CardContainer>
          </TabsContent>
          
          <TabsContent value="preferences" className="space-y-6">
            <CardContainer title="Appearance" description="Customize the application appearance">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select 
                    value={preferences.theme} 
                    onValueChange={(value) => handlePreferenceChange('theme', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContainer>
            
            <CardContainer title="Default Settings" description="Configure default behavior">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultProvider">Default Provider</Label>
                  <Select 
                    value={preferences.defaultProvider} 
                    onValueChange={(value) => handlePreferenceChange('defaultProvider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select default provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="perplexity">Perplexity</SelectItem>
                      <SelectItem value="gemini">Google Gemini</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="saveHistory" className="cursor-pointer">Save Search History</Label>
                  <Switch
                    id="saveHistory"
                    checked={preferences.saveHistory}
                    onCheckedChange={(checked) => handlePreferenceChange('saveHistory', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="telemetry" className="cursor-pointer">Allow Anonymous Telemetry</Label>
                  <Switch
                    id="telemetry"
                    checked={preferences.telemetry}
                    onCheckedChange={(checked) => handlePreferenceChange('telemetry', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoUpdate" className="cursor-pointer">Auto-update Application</Label>
                  <Switch
                    id="autoUpdate"
                    checked={preferences.autoUpdate}
                    onCheckedChange={(checked) => handlePreferenceChange('autoUpdate', checked)}
                  />
                </div>
              </div>
            </CardContainer>
          </TabsContent>
          
          <TabsContent value="connections" className="space-y-6">
            <CardContainer title="Server Connection" description="Configure connection to the MCP server">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="serverUrl">Server URL</Label>
                  <Input
                    id="serverUrl"
                    name="serverUrl"
                    placeholder="Enter server URL"
                    value={connections.serverUrl}
                    onChange={(e) => handleConnectionChange('serverUrl', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="connectionType">Connection Type</Label>
                  <Select 
                    value={connections.connectionType} 
                    onValueChange={(value) => handleConnectionChange('connectionType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select connection type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="http">HTTP</SelectItem>
                      <SelectItem value="sse">Server-Sent Events (SSE)</SelectItem>
                      <SelectItem value="websocket">WebSocket</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoConnect" className="cursor-pointer">Auto-connect on Startup</Label>
                  <Switch
                    id="autoConnect"
                    checked={connections.autoConnect}
                    onCheckedChange={(checked) => handleConnectionChange('autoConnect', checked)}
                  />
                </div>
              </div>
            </CardContainer>
            
            <CardContainer title="Connection Status" description="Current connection information">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className={`h-3 w-3 rounded-full ${connectionStatus.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>
                    {connectionStatus.isConnected 
                      ? `Connected to ${connectionStatus.serverUrl}` 
                      : 'Disconnected'}
                  </span>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>Connection Type: {connectionStatus.connectionType.toUpperCase()}</p>
                  <p>Last Connected: {connectionStatus.lastConnected 
                    ? connectionStatus.lastConnected.toLocaleString() 
                    : 'Never'}</p>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDisconnect}
                    disabled={!connectionStatus.isConnected}
                  >
                    Disconnect
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleTestConnection}
                  >
                    Test Connection
                  </Button>
                </div>
              </div>
            </CardContainer>
          </TabsContent>
        </Tabs>
        
        <Separator className="my-6" />
        
        <div className="flex justify-end space-x-4">
          <Button variant="outline">Reset to Defaults</Button>
          <Button onClick={handleSaveSettings}>Save Settings</Button>
        </div>
      </div>
    </MainLayout>
  )
} 