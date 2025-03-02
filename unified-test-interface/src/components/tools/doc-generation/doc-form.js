import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CardContainer } from '@/components/layout/card-container';
export function DocForm({ onSubmit, isLoading }) {
    const [formData, setFormData] = useState({
        repoPath: '',
        outputFormat: 'markdown',
        includeReadme: true,
        includeArchitecture: true,
        includeApi: true,
        includeDependencies: true,
        includeSetup: true,
        customInstructions: ''
    });
    const handleInputChange = (e) => {
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
    return (<CardContainer title="Documentation Generator" description="Generate comprehensive documentation for code repositories">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="repoPath">Repository Path</Label>
          <Input id="repoPath" name="repoPath" placeholder="Local path or GitHub URL (e.g., user/repo)" value={formData.repoPath} onChange={handleInputChange} required/>
        </div>

        <div className="space-y-2">
          <Label htmlFor="outputFormat">Output Format</Label>
          <Select value={formData.outputFormat} onValueChange={(value) => handleSelectChange('outputFormat', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select output format"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="markdown">Markdown</SelectItem>
              <SelectItem value="html">HTML</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Documentation Sections</Label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="includeReadme" className="cursor-pointer">README</Label>
              <Switch id="includeReadme" checked={formData.includeReadme} onCheckedChange={(checked) => handleSwitchChange('includeReadme', checked)}/>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="includeArchitecture" className="cursor-pointer">Architecture</Label>
              <Switch id="includeArchitecture" checked={formData.includeArchitecture} onCheckedChange={(checked) => handleSwitchChange('includeArchitecture', checked)}/>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="includeApi" className="cursor-pointer">API Documentation</Label>
              <Switch id="includeApi" checked={formData.includeApi} onCheckedChange={(checked) => handleSwitchChange('includeApi', checked)}/>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="includeDependencies" className="cursor-pointer">Dependencies</Label>
              <Switch id="includeDependencies" checked={formData.includeDependencies} onCheckedChange={(checked) => handleSwitchChange('includeDependencies', checked)}/>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="includeSetup" className="cursor-pointer">Setup Instructions</Label>
              <Switch id="includeSetup" checked={formData.includeSetup} onCheckedChange={(checked) => handleSwitchChange('includeSetup', checked)}/>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customInstructions">Custom Instructions</Label>
          <Textarea id="customInstructions" name="customInstructions" placeholder="Additional instructions or specific areas to focus on (optional)" value={formData.customInstructions} onChange={handleInputChange} rows={3}/>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (<>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
              Generating Documentation...
            </>) : ('Generate Documentation')}
        </Button>
      </form>
    </CardContainer>);
}
