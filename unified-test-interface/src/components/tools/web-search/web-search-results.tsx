import React from 'react'
import { CardContainer } from '@/components/layout/card-container'
import { formatTime } from '@/lib/utils'

interface WebSearchResultsProps {
  results: WebSearchResults | null
  isLoading: boolean
  error: string | null
}

export interface WebSearchResults {
  searchResults: string
  metadata?: {
    provider?: string
    cached?: boolean
    timestamp?: string
    requestId?: string
    tokenUsage?: {
      promptTokens?: number
      completionTokens?: number
      totalTokens?: number
    }
  }
}

export function WebSearchResults({ results, isLoading, error }: WebSearchResultsProps) {
  if (isLoading) {
    return (
      <CardContainer title="Search Results" description="Loading results...">
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </CardContainer>
    )
  }

  if (error) {
    return (
      <CardContainer title="Search Results" description="An error occurred">
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      </CardContainer>
    )
  }

  if (!results) {
    return (
      <CardContainer title="Search Results" description="No results yet">
        <div className="text-center text-muted-foreground p-8">
          Enter a search query and click "Search" to see results
        </div>
      </CardContainer>
    )
  }

  return (
    <CardContainer title="Search Results">
      <div className="space-y-6">
        {/* Results content */}
        <div className="rounded-md bg-muted p-4 overflow-auto max-h-[500px]">
          <pre className="whitespace-pre-wrap text-sm">{results.searchResults}</pre>
        </div>

        {/* Metadata */}
        {results.metadata && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Metadata</h4>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {results.metadata.provider && (
                <>
                  <dt className="text-muted-foreground">Provider:</dt>
                  <dd>{results.metadata.provider}</dd>
                </>
              )}
              
              {results.metadata.cached !== undefined && (
                <>
                  <dt className="text-muted-foreground">Cached:</dt>
                  <dd>{results.metadata.cached ? 'Yes' : 'No'}</dd>
                </>
              )}
              
              {results.metadata.timestamp && (
                <>
                  <dt className="text-muted-foreground">Timestamp:</dt>
                  <dd>{formatTime(results.metadata.timestamp)}</dd>
                </>
              )}
              
              {results.metadata.requestId && (
                <>
                  <dt className="text-muted-foreground">Request ID:</dt>
                  <dd className="truncate">{results.metadata.requestId}</dd>
                </>
              )}
              
              {results.metadata.tokenUsage && (
                <>
                  <dt className="text-muted-foreground">Token Usage:</dt>
                  <dd>
                    {results.metadata.tokenUsage.totalTokens !== undefined && (
                      <span>Total: {results.metadata.tokenUsage.totalTokens}</span>
                    )}
                    {results.metadata.tokenUsage.promptTokens !== undefined && (
                      <span className="ml-2">(Prompt: {results.metadata.tokenUsage.promptTokens})</span>
                    )}
                    {results.metadata.tokenUsage.completionTokens !== undefined && (
                      <span className="ml-2">(Completion: {results.metadata.tokenUsage.completionTokens})</span>
                    )}
                  </dd>
                </>
              )}
            </dl>
          </div>
        )}
      </div>
    </CardContainer>
  )
} 