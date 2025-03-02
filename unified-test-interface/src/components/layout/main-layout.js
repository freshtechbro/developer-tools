import React from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useLocation } from 'react-router-dom';
import { useConnection } from '@/contexts/ConnectionContext';
export function MainLayout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname.split('/')[1] || 'web-search';
    const handleTabChange = (value) => {
        navigate(`/${value}`);
    };
    return (<div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <a href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold text-xl">Developer Tools</span>
            </a>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Tabs value={currentPath} onValueChange={handleTabChange} className="w-full">
                <TabsList>
                  <TabsTrigger value="web-search">Web Search</TabsTrigger>
                  <TabsTrigger value="command-interceptor">Command Interceptor</TabsTrigger>
                  <TabsTrigger value="repo-analysis">Repository Analysis</TabsTrigger>
                  <TabsTrigger value="browser-automation">Browser Automation</TabsTrigger>
                  <TabsTrigger value="doc-generation">Documentation</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
              </Tabs>
            </nav>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <ConnectionStatusIndicator />
          </div>
        </div>
      </header>
      <main className="flex-1 bg-muted/40">
        <div className="container py-6">
          {children}
        </div>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} Developer Tools. All rights reserved.
          </p>
        </div>
      </footer>
    </div>);
}
function ConnectionStatusIndicator() {
    const { connectionStatus } = useConnection();
    return (<div className="flex items-center space-x-2">
      <div className={`h-2 w-2 rounded-full ${connectionStatus.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <span className="text-xs text-muted-foreground">
        {connectionStatus.isConnected
            ? `${connectionStatus.connectionType.toUpperCase()} Connected`
            : 'Disconnected'}
      </span>
    </div>);
}
