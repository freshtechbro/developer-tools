/**
 * Type definitions for tool interfaces
 */

// Tool parameter type
export interface ToolParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

// Tool definition type
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameter[];
}

// Tool invocation type
export interface ToolInvocation {
  toolName: string;
  parameters: Record<string, any>;
}

// Tool result type
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
} 