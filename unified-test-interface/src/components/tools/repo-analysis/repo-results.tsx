import React from 'react'
import { CardContainer } from '@/components/layout/card-container'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { copyToClipboard } from '@/lib/utils'
import { ClipboardCopy, Download } from 'lucide-react'

export interface RepoResultsProps {
  results: RepoAnalysisResult | null
  isLoading: boolean
  error: string | null
}

export interface RepoAnalysisResult {
  repoPath: string
  analysisType: string
  summary: string
  details: string
  recommendations?: string
  codeSnippets?: Array<{
    path: string
    code: string
    comments?: string
  }>
  timestamp: string
}

export function RepoResults({ results, isLoading, error }: RepoResultsProps) {
  const handleCopyContent = async (content: string) => {
    const success = await copyToClipboard(content)
    if (success) {
      // You could add a toast notification here
      console.log('Content copied to clipboard')
    }
  }

  const handleDownloadResults = () => {
    if (!results) return

    const content = JSON.stringify(results, null, 2)
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `repo-analysis-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    
    // Cleanup
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <CardContainer title="Analysis Results" description="Analyzing repository...">
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </CardContainer>
    )
  }

  if (error) {
    return (
      <CardContainer title="Analysis Results" description="An error occurred">
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      </CardContainer>
    )
  }

  if (!results) {
    return (
      <CardContainer title="Analysis Results" description="No analysis performed yet">
        <div className="text-center text-muted-foreground p-8">
          Enter repository details and click "Analyze Repository" to see results
        </div>
      </CardContainer>
    )
  }

  return (
    <CardContainer title="Analysis Results">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-medium">{results.repoPath}</h3>
            <p className="text-xs text-muted-foreground">
              {results.analysisType.charAt(0).toUpperCase() + results.analysisType.slice(1)} Analysis • {results.timestamp}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopyContent(results.summary + '\n\n' + results.details)}
              title="Copy to clipboard"
            >
              <ClipboardCopy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadResults}
              title="Download results"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            {results.codeSnippets && results.codeSnippets.length > 0 && (
              <TabsTrigger value="code">Code Snippets</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4">
            <div className="rounded-md bg-muted p-4 whitespace-pre-wrap">
              {results.summary}
            </div>
            
            {results.recommendations && (
              <div>
                <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                <div className="rounded-md bg-muted p-4 whitespace-pre-wrap">
                  {results.recommendations}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="details">
            <div className="rounded-md bg-muted p-4 overflow-auto max-h-[500px] whitespace-pre-wrap">
              {results.details}
            </div>
          </TabsContent>
          
          {results.codeSnippets && results.codeSnippets.length > 0 && (
            <TabsContent value="code" className="space-y-4">
              {results.codeSnippets.map((snippet, index) => (
                <div key={index} className="space-y-2">
                  <h4 className="text-sm font-medium">{snippet.path}</h4>
                  <div className="rounded-md bg-muted p-4 overflow-auto">
                    <pre className="text-sm">{snippet.code}</pre>
                  </div>
                  {snippet.comments && (
                    <div className="text-sm text-muted-foreground pl-4 border-l-2 border-muted">
                      {snippet.comments}
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </CardContainer>
  )
} 