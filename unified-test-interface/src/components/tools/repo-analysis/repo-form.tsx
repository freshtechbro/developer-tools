import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CardContainer } from '@/components/layout/card-container'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface RepoFormProps {
  onSubmit: (data: RepoFormData) => void
  isLoading: boolean
}

export interface RepoFormData {
  repoPath: string
  query: string
  analysisType: 'general' | 'code-review' | 'architecture' | 'dependencies' | 'custom'
}

export function RepoForm({ onSubmit, isLoading }: RepoFormProps) {
  const [formData, setFormData] = useState<RepoFormData>({
    repoPath: '',
    query: '',
    analysisType: 'general'
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <CardContainer 
      title="Repository Analysis" 
      description="Analyze code repositories and get AI-powered insights"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="repoPath">Repository Path</Label>
          <Input
            id="repoPath"
            name="repoPath"
            placeholder="Local path or GitHub URL (e.g., user/repo)"
            value={formData.repoPath}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="analysisType">Analysis Type</Label>
          <Select 
            value={formData.analysisType} 
            onValueChange={(value) => handleSelectChange('analysisType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select analysis type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General Overview</SelectItem>
              <SelectItem value="code-review">Code Review</SelectItem>
              <SelectItem value="architecture">Architecture Analysis</SelectItem>
              <SelectItem value="dependencies">Dependency Analysis</SelectItem>
              <SelectItem value="custom">Custom Query</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="query">Query or Instructions</Label>
          <Textarea
            id="query"
            name="query"
            placeholder={
              formData.analysisType === 'custom' 
                ? "Enter your custom analysis query" 
                : "Additional instructions or specific areas to focus on (optional)"
            }
            value={formData.query}
            onChange={handleInputChange}
            rows={4}
            required={formData.analysisType === 'custom'}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
              Analyzing...
            </>
          ) : (
            'Analyze Repository'
          )}
        </Button>
      </form>
    </CardContainer>
  )
} 