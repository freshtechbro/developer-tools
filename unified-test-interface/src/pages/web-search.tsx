import React, { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { WebSearchForm } from '@/components/tools/web-search/web-search-form'
import { WebSearchResults, type WebSearchResults as WebSearchResultsType } from '@/components/tools/web-search/web-search-results'
import { webSearch } from '@/api/adapter'
import { WebSearchResponse } from '@/types/api'

export interface WebSearchFormData {
  query: string
  provider: string
  format: string
  detailed: boolean
  noCache: boolean
  includeMetadata: boolean
}

export default function WebSearchPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<WebSearchResultsType | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: WebSearchFormData) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Call the API using our adapter
      const response = await webSearch(formData.query, {
        provider: formData.provider,
        format: formData.format,
        detailed: formData.detailed,
        noCache: formData.noCache,
        includeMetadata: formData.includeMetadata
      }) as WebSearchResponse;
      
      if (response.success) {
        setResults({
          searchResults: response.results,
          metadata: response.metadata
        });
      } else {
        setError(response.error || 'Failed to perform web search');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Web Search</h1>
          <p className="text-muted-foreground">
            Search the web using various AI providers and customize your search experience.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <WebSearchForm onSubmit={handleSubmit} isLoading={isLoading} />
          <WebSearchResults results={results} isLoading={isLoading} error={error} />
        </div>
      </div>
    </MainLayout>
  )
}
 