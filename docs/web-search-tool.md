# Web Search Tool Documentation

## Overview
The web search tool provides a way to perform web searches using the Perplexity AI API. It supports both production and test environments, with graceful fallbacks for testing scenarios.

## Configuration

### Environment Variables
- `PERPLEXITY_API_KEY` (optional in test environment): Your Perplexity AI API key
- `NODE_ENV`: The current environment ('development', 'production', or 'test')

### Test Environment
In test environment:
- If `PERPLEXITY_API_KEY` is not provided, the tool returns mock results
- If `PERPLEXITY_API_KEY` is provided, real API calls are made

## Usage

### Basic Search
```typescript
const result = await webSearchTool.execute({
    query: "Your search query"
});
```

### Save Results to File
```typescript
const result = await webSearchTool.execute({
    query: "Your search query",
    saveToFile: true
});
```

## Request Schema
```typescript
{
    query: string;      // Required, non-empty string
    saveToFile: boolean; // Optional, defaults to false
}
```

## Response Schema
```typescript
{
    searchResults: string;
    savedToFile?: string; // Present only when saveToFile is true
}
```

## Error Handling

The tool handles various error scenarios:

1. Configuration Errors:
   - Missing API key (in non-test environment)
   - Invalid API key

2. Request Validation:
   - Empty query
   - Invalid request format

3. API Errors:
   - Rate limiting (429)
   - Authentication errors (401/403)
   - Invalid response format
   - Network timeouts (10s default)

4. File System Errors:
   - Failed to create directory
   - Failed to write file
   - File system permissions

## Testing

The tool includes comprehensive tests covering:
- Mock response behavior
- API integration
- Error handling
- File saving functionality

See `__tests__/web-search.test.ts` for test examples.

## Logging

All operations are logged using the application logger:
- Info: Search operations
- Debug: File operations
- Warn: API response issues
- Error: Failed operations

## Best Practices

1. Always handle potential errors when using the tool
2. Use appropriate timeouts for your use case
3. Monitor rate limiting in production
4. Consider implementing retry logic for transient failures
5. Keep queries focused and specific for better results 