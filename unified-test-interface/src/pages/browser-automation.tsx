import React, { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { BrowserForm, type BrowserFormData } from '@/components/tools/browser-automation/browser-form'
import { BrowserResults, type BrowserResult, type NetworkRequest, type ConsoleMessage } from '@/components/tools/browser-automation/browser-results'

export default function BrowserAutomationPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<BrowserResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: BrowserFormData) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll simulate a response after a delay
      await new Promise(resolve => setTimeout(resolve, 2500))
      
      // Simulate a browser automation result
      const mockResult: BrowserResult = {
        url: formData.url,
        action: formData.action,
        instruction: formData.instruction,
        screenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', // 1x1 pixel placeholder
        html: formData.captureHtml ? generateMockHtml(formData.url) : undefined,
        networkRequests: formData.captureNetwork ? generateMockNetworkRequests(formData.url) : undefined,
        consoleMessages: formData.captureConsole ? generateMockConsoleMessages() : undefined,
        extractedData: formData.action === 'extract' ? generateMockExtractedData(formData.instruction) : undefined,
        executionTime: Math.floor(Math.random() * 2000) + 500 // Random time between 500-2500ms
      }
      
      setResults(mockResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockHtml = (url: string): string => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Example Page</title>
</head>
<body>
  <header>
    <h1>Welcome to ${url}</h1>
    <nav>
      <ul>
        <li><a href="#">Home</a></li>
        <li><a href="#">About</a></li>
        <li><a href="#">Contact</a></li>
      </ul>
    </nav>
  </header>
  <main>
    <section>
      <h2>Main Content</h2>
      <p>This is a sample page for demonstration purposes.</p>
      <button id="login-button">Login</button>
    </section>
  </main>
  <footer>
    <p>&copy; 2023 Example Website</p>
  </footer>
</body>
</html>`
  }

  const generateMockNetworkRequests = (url: string): NetworkRequest[] => {
    const domain = new URL(url).hostname
    
    return [
      {
        url: url,
        method: 'GET',
        status: 200,
        contentType: 'text/html',
        size: 1256
      },
      {
        url: `https://${domain}/styles.css`,
        method: 'GET',
        status: 200,
        contentType: 'text/css',
        size: 4328
      },
      {
        url: `https://${domain}/main.js`,
        method: 'GET',
        status: 200,
        contentType: 'application/javascript',
        size: 2156
      },
      {
        url: `https://${domain}/api/user`,
        method: 'GET',
        status: 401,
        contentType: 'application/json',
        size: 42
      },
      {
        url: `https://${domain}/images/logo.png`,
        method: 'GET',
        status: 200,
        contentType: 'image/png',
        size: 15678
      }
    ]
  }

  const generateMockConsoleMessages = (): ConsoleMessage[] => {
    return [
      {
        type: 'log',
        text: 'Page loaded successfully',
        timestamp: new Date().toISOString()
      },
      {
        type: 'info',
        text: 'User session initialized',
        timestamp: new Date().toISOString()
      },
      {
        type: 'warning',
        text: 'Resource loading slow: main.js',
        timestamp: new Date().toISOString()
      },
      {
        type: 'error',
        text: 'Failed to load resource: api/user (401 Unauthorized)',
        timestamp: new Date().toISOString()
      },
      {
        type: 'log',
        text: 'Event listeners attached',
        timestamp: new Date().toISOString()
      }
    ]
  }

  const generateMockExtractedData = (instruction: string): string => {
    if (instruction.toLowerCase().includes('product')) {
      return JSON.stringify({
        products: [
          { name: 'Product 1', price: '$19.99', rating: 4.5 },
          { name: 'Product 2', price: '$29.99', rating: 3.8 },
          { name: 'Product 3', price: '$39.99', rating: 4.2 },
          { name: 'Product 4', price: '$49.99', rating: 4.7 },
          { name: 'Product 5', price: '$59.99', rating: 3.5 }
        ]
      }, null, 2)
    }
    
    if (instruction.toLowerCase().includes('article') || instruction.toLowerCase().includes('heading')) {
      return JSON.stringify({
        articles: [
          { title: 'Getting Started with Browser Automation', date: '2023-01-15', author: 'John Doe' },
          { title: 'Advanced Web Scraping Techniques', date: '2023-02-22', author: 'Jane Smith' },
          { title: 'The Future of AI in Web Testing', date: '2023-03-10', author: 'Bob Johnson' },
          { title: 'Ethical Considerations in Data Extraction', date: '2023-04-05', author: 'Alice Brown' }
        ]
      }, null, 2)
    }
    
    return JSON.stringify({
      data: [
        { id: 1, name: 'Item 1', value: 'Value 1' },
        { id: 2, name: 'Item 2', value: 'Value 2' },
        { id: 3, name: 'Item 3', value: 'Value 3' }
      ]
    }, null, 2)
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Browser Automation</h1>
          <p className="text-muted-foreground">
            Automate browser actions, extract data from websites, and capture page information.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <BrowserForm onSubmit={handleSubmit} isLoading={isLoading} />
          <BrowserResults results={results} isLoading={isLoading} error={error} />
        </div>
      </div>
    </MainLayout>
  )
} 