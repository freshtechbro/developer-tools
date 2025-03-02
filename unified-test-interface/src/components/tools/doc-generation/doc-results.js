import React from 'react';
import { CardContainer } from '@/components/layout/card-container';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { copyToClipboard } from '@/lib/utils';
import { ClipboardCopy, Download, FileText } from 'lucide-react';
export function DocResults({ results, isLoading, error }) {
    const handleCopyContent = async (content) => {
        const success = await copyToClipboard(content);
        if (success) {
            // You could add a toast notification here
            console.log('Content copied to clipboard');
        }
    };
    const handleDownloadDoc = () => {
        if (!results)
            return;
        // Combine all sections into a single document
        const fullContent = results.sections.map(section => {
            return `# ${section.title}\n\n${section.content}`;
        }).join('\n\n');
        // Determine file extension based on format
        const fileExtension = results.outputFormat === 'html' ? 'html' :
            results.outputFormat === 'json' ? 'json' : 'md';
        // Create file content based on format
        let fileContent = fullContent;
        if (results.outputFormat === 'html') {
            fileContent = `<!DOCTYPE html>
<html>
<head>
  <title>Documentation for ${results.repoPath}</title>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { border-bottom: 1px solid #eee; padding-bottom: 10px; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
  </style>
</head>
<body>
  ${results.sections.map(section => {
                return `<h1>${section.title}</h1>\n${section.content.replace(/\n/g, '<br>')}`;
            }).join('\n\n')}
</body>
</html>`;
        }
        else if (results.outputFormat === 'json') {
            fileContent = JSON.stringify({
                repoPath: results.repoPath,
                timestamp: results.timestamp,
                sections: results.sections
            }, null, 2);
        }
        const blob = new Blob([fileContent], {
            type: results.outputFormat === 'html' ? 'text/html' :
                results.outputFormat === 'json' ? 'application/json' : 'text/markdown'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `documentation-${results.repoPath.replace(/\//g, '-')}.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    if (isLoading) {
        return (<CardContainer title="Documentation" description="Generating documentation...">
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </CardContainer>);
    }
    if (error) {
        return (<CardContainer title="Documentation" description="An error occurred">
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      </CardContainer>);
    }
    if (!results) {
        return (<CardContainer title="Documentation" description="No documentation generated yet">
        <div className="text-center text-muted-foreground p-8">
          Configure and generate documentation to see results
        </div>
      </CardContainer>);
    }
    return (<CardContainer title="Documentation">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-medium">{results.repoPath}</h3>
            <p className="text-xs text-muted-foreground">
              {results.outputFormat.toUpperCase()} • Generated in {(results.generationTime / 1000).toFixed(1)}s
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleCopyContent(results.sections.map(s => `# ${s.title}\n\n${s.content}`).join('\n\n'))} title="Copy to clipboard">
              <ClipboardCopy className="h-4 w-4 mr-2"/>
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadDoc} title="Download documentation">
              <Download className="h-4 w-4 mr-2"/>
              Download
            </Button>
          </div>
        </div>

        <Tabs defaultValue={results.sections[0]?.title || 'section-0'} className="w-full">
          <TabsList className="flex flex-wrap mb-4">
            {results.sections.map((section, index) => (<TabsTrigger key={index} value={section.title || `section-${index}`} className="flex items-center">
                <FileText className="h-4 w-4 mr-2"/>
                {section.title}
              </TabsTrigger>))}
          </TabsList>
          
          {results.sections.map((section, index) => (<TabsContent key={index} value={section.title || `section-${index}`} className="space-y-4">
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => handleCopyContent(section.content)} className="mb-2">
                  <ClipboardCopy className="h-4 w-4 mr-2"/>
                  Copy Section
                </Button>
              </div>
              <div className="rounded-md bg-muted p-4 overflow-auto max-h-[500px]">
                <pre className="text-sm whitespace-pre-wrap">{section.content}</pre>
              </div>
            </TabsContent>))}
        </Tabs>
      </div>
    </CardContainer>);
}
