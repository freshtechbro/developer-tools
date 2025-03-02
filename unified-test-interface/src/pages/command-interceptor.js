import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { CommandForm } from '@/components/tools/command-interceptor/command-form';
import { CommandResults } from '@/components/tools/command-interceptor/command-results';
import { commandInterceptor } from '@/api/adapter';
export default function CommandInterceptorPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const handleSubmit = async (formData) => {
        setIsLoading(true);
        setError(null);
        try {
            // Call the API using our adapter
            const response = await commandInterceptor(formData.command);
            if (response.success) {
                setResult({
                    command: formData.command,
                    output: response.output || `Command executed: ${formData.command}`,
                    exitCode: response.exitCode || 0,
                    executionTime: response.executionTime || 1000
                });
            }
            else {
                setError(response.error || 'Failed to execute command');
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<MainLayout>
      <div className="container mx-auto py-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Command Interceptor</h1>
          <p className="text-muted-foreground">
            Execute terminal commands and view their output in a controlled environment.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CommandForm onSubmit={handleSubmit} isLoading={isLoading}/>
          <CommandResults result={result} isLoading={isLoading} error={error}/>
        </div>
      </div>
    </MainLayout>);
}
