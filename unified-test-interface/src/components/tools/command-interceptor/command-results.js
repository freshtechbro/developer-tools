import React from 'react';
import { CardContainer } from '@/components/layout/card-container';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/utils';
import { ClipboardCopy } from 'lucide-react';
export function CommandResults({ result, isLoading, error }) {
    const handleCopyOutput = async () => {
        if (result) {
            const success = await copyToClipboard(result.output);
            if (success) {
                // You could add a toast notification here
                console.log('Output copied to clipboard');
            }
        }
    };
    if (isLoading) {
        return (<CardContainer title="Command Output" description="Executing command...">
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </CardContainer>);
    }
    if (error) {
        return (<CardContainer title="Command Output" description="An error occurred">
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      </CardContainer>);
    }
    if (!result) {
        return (<CardContainer title="Command Output" description="No command executed yet">
        <div className="text-center text-muted-foreground p-8">
          Enter a command and click "Execute Command" to see results
        </div>
      </CardContainer>);
    }
    const isSuccess = result.exitCode === 0;
    return (<CardContainer title="Command Output">
      <div className="space-y-4">
        {/* Command that was executed */}
        <div className="bg-muted rounded-md p-3">
          <div className="flex items-center justify-between">
            <code className="text-sm font-mono">{result.command}</code>
          </div>
        </div>

        {/* Command output */}
        <div className="relative">
          <div className={`rounded-md p-4 overflow-auto max-h-[400px] font-mono text-sm whitespace-pre-wrap ${isSuccess ? 'bg-muted' : 'bg-destructive/10'}`}>
            {result.output || '(No output)'}
          </div>
          
          <Button variant="outline" size="sm" className="absolute top-2 right-2" onClick={handleCopyOutput} title="Copy to clipboard">
            <ClipboardCopy className="h-4 w-4"/>
          </Button>
        </div>

        {/* Command metadata */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-muted-foreground mr-2">Exit Code:</span>
            <span className={isSuccess ? 'text-green-500' : 'text-destructive'}>
              {result.exitCode}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground mr-2">Execution Time:</span>
            <span>{(result.executionTime / 1000).toFixed(2)}s</span>
          </div>
        </div>
      </div>
    </CardContainer>);
}
