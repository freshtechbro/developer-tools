import React from 'react'
import { CardContainer } from '@/components/layout/card-container'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { copyToClipboard } from '@/lib/utils'
import { ClipboardCopy, Download } from 'lucide-react'

export interface BrowserResultsProps {
  results: BrowserResult | null
  isLoading: boolean
  error: string | null
}

export interface NetworkRequest {
  url: string
  method: string
  status?: number
  contentType?: string
  size?: number
}

export interface ConsoleMessage {
  type: 'log' | 'info' | 'warning' | 'error'
  text: string
  timestamp: string
}

export interface BrowserResult {
  url: string
  action: string
  instruction?: string
  screenshot?: string // base64 encoded image
  html?: string
  networkRequests?: NetworkRequest[]
  consoleMessages?: ConsoleMessage[]
  extractedData?: string
  executionTime: number // in milliseconds
}

export function BrowserResults({ results, isLoading, error }: BrowserResultsProps) {
  const handleCopyContent = async (content: string) => {
    const success = await copyToClipboard(content)
    if (success) {
      // You could add a toast notification here
      console.log('Content copied to clipboard')
    }
  }

  const handleDownloadScreenshot = () => {
    if (!results?.screenshot) return

    const link = document.createElement('a')
    link.href = results.screenshot
    link.download = `screenshot-${new Date().toISOString().slice(0, 10)}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadHtml = () => {
    if (!results?.html) return

    const blob = new Blob([results.html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `page-${new Date().toISOString().slice(0, 10)}.html`
    document.body.appendChild(a)
    a.click()
    
    // Cleanup
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <CardContainer title="Browser Results" description="Running browser task...">
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </CardContainer>
    )
  }

  if (error) {
    return (
      <CardContainer title="Browser Results" description="An error occurred">
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      </CardContainer>
    )
  }

  if (!results) {
    return (
      <CardContainer title="Browser Results" description="No browser task executed yet">
        <div className="text-center text-muted-foreground p-8">
          Configure and run a browser task to see results
        </div>
      </CardContainer>
    )
  }

  return (
    <CardContainer title="Browser Results">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-medium">{results.url}</h3>
            <p className="text-xs text-muted-foreground">
              {results.action.charAt(0).toUpperCase() + results.action.slice(1)} • 
              {(results.executionTime / 1000).toFixed(2)}s
            </p>
          </div>
        </div>

        <Tabs defaultValue="screenshot" className="w-full">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="screenshot">Screenshot</TabsTrigger>
            {results.html && <TabsTrigger value="html">HTML</TabsTrigger>}
            {results.networkRequests && <TabsTrigger value="network">Network</TabsTrigger>}
            {results.consoleMessages && <TabsTrigger value="console">Console</TabsTrigger>}
            {results.extractedData && <TabsTrigger value="data">Data</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="screenshot" className="space-y-4">
            {results.screenshot ? (
              <div className="space-y-2">
                <div className="relative">
                  <img 
                    src={results.screenshot} 
                    alt="Page screenshot" 
                    className="w-full border rounded-md"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleDownloadScreenshot}
                    title="Download screenshot"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground p-4">
                No screenshot captured
              </div>
            )}
          </TabsContent>
          
          {results.html && (
            <TabsContent value="html">
              <div className="space-y-2">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadHtml}
                    className="mb-2"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download HTML
                  </Button>
                </div>
                <div className="rounded-md bg-muted p-4 overflow-auto max-h-[400px]">
                  <pre className="text-xs whitespace-pre-wrap">{results.html}</pre>
                </div>
              </div>
            </TabsContent>
          )}
          
          {results.networkRequests && (
            <TabsContent value="network">
              <div className="rounded-md border overflow-hidden">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">URL</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Method</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Size</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {results.networkRequests.map((request, index) => (
                      <tr key={index} className="hover:bg-muted/50">
                        <td className="px-4 py-2 text-xs truncate max-w-[200px]">{request.url}</td>
                        <td className="px-4 py-2 text-xs">{request.method}</td>
                        <td className="px-4 py-2 text-xs">{request.status || '-'}</td>
                        <td className="px-4 py-2 text-xs">{request.contentType || '-'}</td>
                        <td className="px-4 py-2 text-xs">{request.size ? `${(request.size / 1024).toFixed(1)} KB` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          )}
          
          {results.consoleMessages && (
            <TabsContent value="console">
              <div className="rounded-md border overflow-hidden">
                <div className="overflow-auto max-h-[400px]">
                  {results.consoleMessages.map((message, index) => (
                    <div 
                      key={index} 
                      className={`px-4 py-2 border-b text-xs ${
                        message.type === 'error' ? 'bg-destructive/10 text-destructive' :
                        message.type === 'warning' ? 'bg-warning/10 text-warning' : ''
                      }`}
                    >
                      <div className="flex items-start">
                        <span className="text-muted-foreground mr-2">[{message.timestamp}]</span>
                        <span className="font-mono whitespace-pre-wrap">{message.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          )}
          
          {results.extractedData && (
            <TabsContent value="data">
              <div className="space-y-2">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyContent(results.extractedData || '')}
                    className="mb-2"
                  >
                    <ClipboardCopy className="h-4 w-4 mr-2" />
                    Copy Data
                  </Button>
                </div>
                <div className="rounded-md bg-muted p-4 overflow-auto max-h-[400px]">
                  <pre className="text-sm whitespace-pre-wrap">{results.extractedData}</pre>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </CardContainer>
  )
} 