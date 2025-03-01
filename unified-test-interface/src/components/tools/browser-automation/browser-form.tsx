import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CardContainer } from '@/components/layout/card-container'

export interface BrowserFormProps {
  onSubmit: (data: BrowserFormData) => void
  isLoading: boolean
}

export interface BrowserFormData {
  url: string
  action: 'open' | 'act' | 'observe' | 'extract'
  instruction: string
  captureHtml: boolean
  captureScreenshot: boolean
  captureNetwork: boolean
  captureConsole: boolean
  headless: boolean
  timeout: number
}

export function BrowserForm({ onSubmit, isLoading }: BrowserFormProps) {
  const [formData, setFormData] = useState<BrowserFormData>({
    url: '',
    action: 'open',
    instruction: '',
    captureHtml: false,
    captureScreenshot: true,
    captureNetwork: true,
    captureConsole: true,
    headless: true,
    timeout: 30000
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const getInstructionPlaceholder = () => {
    switch (formData.action) {
      case 'act':
        return 'Enter instructions for browser actions (e.g., "Click Login | Type user@example.com into email | Click Submit")'
      case 'observe':
        return 'Enter what to observe (e.g., "interactive elements", "form fields")'
      case 'extract':
        return 'Enter what data to extract (e.g., "product names", "article headings")'
      default:
        return 'Optional instructions for opening the page'
    }
  }

  const isInstructionRequired = formData.action !== 'open'

  return (
    <CardContainer 
      title="Browser Automation" 
      description="Automate browser actions and extract data from websites"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            name="url"
            placeholder="Enter website URL (e.g., https://example.com)"
            value={formData.url}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="action">Action</Label>
          <Select 
            value={formData.action} 
            onValueChange={(value) => handleSelectChange('action', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open Page</SelectItem>
              <SelectItem value="act">Perform Actions</SelectItem>
              <SelectItem value="observe">Observe Elements</SelectItem>
              <SelectItem value="extract">Extract Data</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="instruction">Instructions</Label>
          <Textarea
            id="instruction"
            name="instruction"
            placeholder={getInstructionPlaceholder()}
            value={formData.instruction}
            onChange={handleInputChange}
            rows={3}
            required={isInstructionRequired}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="timeout">Timeout (ms)</Label>
            <Input
              id="timeout"
              name="timeout"
              type="number"
              min={1000}
              max={120000}
              step={1000}
              value={formData.timeout}
              onChange={handleNumberChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="captureScreenshot" className="cursor-pointer">Capture Screenshot</Label>
            <Switch
              id="captureScreenshot"
              checked={formData.captureScreenshot}
              onCheckedChange={(checked) => handleSwitchChange('captureScreenshot', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="captureHtml" className="cursor-pointer">Capture HTML</Label>
            <Switch
              id="captureHtml"
              checked={formData.captureHtml}
              onCheckedChange={(checked) => handleSwitchChange('captureHtml', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="captureNetwork" className="cursor-pointer">Capture Network</Label>
            <Switch
              id="captureNetwork"
              checked={formData.captureNetwork}
              onCheckedChange={(checked) => handleSwitchChange('captureNetwork', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="captureConsole" className="cursor-pointer">Capture Console</Label>
            <Switch
              id="captureConsole"
              checked={formData.captureConsole}
              onCheckedChange={(checked) => handleSwitchChange('captureConsole', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="headless" className="cursor-pointer">Headless Mode</Label>
            <Switch
              id="headless"
              checked={formData.headless}
              onCheckedChange={(checked) => handleSwitchChange('headless', checked)}
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
              Running Browser...
            </>
          ) : (
            'Run Browser Task'
          )}
        </Button>
      </form>
    </CardContainer>
  )
} 