import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CardContainer } from '@/components/layout/card-container';
export function WebSearchForm({ onSubmit, isLoading }) {
    const [formData, setFormData] = useState({
        query: '',
        provider: 'perplexity',
        format: 'markdown',
        detailed: true,
        noCache: false,
        includeMetadata: true
    });
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleSwitchChange = (name, checked) => {
        setFormData(prev => ({ ...prev, [name]: checked }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };
    return (<CardContainer title="Web Search" description="Search the web using AI providers and get formatted results">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="query" className="text-sm font-medium">
            Search Query
          </label>
          <Textarea id="query" name="query" placeholder="Enter your search query" value={formData.query} onChange={handleChange} required className="min-h-[100px]"/>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="provider" className="text-sm font-medium">
              Provider
            </label>
            <Select value={formData.provider} onValueChange={(value) => handleSelectChange('provider', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="perplexity">Perplexity</SelectItem>
                <SelectItem value="gemini">Google Gemini</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="format" className="text-sm font-medium">
              Output Format
            </label>
            <Select value={formData.format} onValueChange={(value) => handleSelectChange('format', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select format"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Switch id="detailed" checked={formData.detailed} onCheckedChange={(checked) => handleSwitchChange('detailed', checked)}/>
            <label htmlFor="detailed" className="text-sm font-medium">
              Detailed Results
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="noCache" checked={formData.noCache} onCheckedChange={(checked) => handleSwitchChange('noCache', checked)}/>
            <label htmlFor="noCache" className="text-sm font-medium">
              Bypass Cache
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="includeMetadata" checked={formData.includeMetadata} onCheckedChange={(checked) => handleSwitchChange('includeMetadata', checked)}/>
            <label htmlFor="includeMetadata" className="text-sm font-medium">
              Include Metadata
            </label>
          </div>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
      </form>
    </CardContainer>);
}
