import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { CardContainer } from '@/components/layout/card-container'

export interface CommandFormProps {
  onSubmit: (data: CommandFormData) => void
  isLoading: boolean
}

export interface CommandFormData {
  command: string
  description: string
  autoApprove: boolean
  runInBackground: boolean
}

export function CommandForm({ onSubmit, isLoading }: CommandFormProps) {
  const [formData, setFormData] = useState<CommandFormData>({
    command: '',
    description: '',
    autoApprove: false,
    runInBackground: false
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <CardContainer 
      title="Command Interceptor" 
      description="Execute and intercept terminal commands"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="command">Command</Label>
          <Input
            id="command"
            name="command"
            placeholder="Enter command to execute (e.g., ls -la)"
            value={formData.command}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Describe what this command does"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="autoApprove" className="cursor-pointer">Auto-approve command</Label>
            <Switch
              id="autoApprove"
              checked={formData.autoApprove}
              onCheckedChange={(checked) => handleSwitchChange('autoApprove', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="runInBackground" className="cursor-pointer">Run in background</Label>
            <Switch
              id="runInBackground"
              checked={formData.runInBackground}
              onCheckedChange={(checked) => handleSwitchChange('runInBackground', checked)}
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
              Executing...
            </>
          ) : (
            'Execute Command'
          )}
        </Button>
      </form>
    </CardContainer>
  )
} 