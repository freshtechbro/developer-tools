# Services Directory

## Purpose

The `services` directory is intended to contain service modules that handle business logic and orchestration between data sources and the application. Services act as an abstraction layer that separates the tools (which handle the MCP protocol interfaces) from the underlying implementation details.

## Design Pattern

Services follow these principles:

1. **Single Responsibility**: Each service handles a specific domain or external integration
2. **Abstraction**: Services hide implementation details from tools
3. **Reusability**: Multiple tools can use the same service
4. **Testability**: Services can be mocked for testing tools
5. **Stateless**: Services should be stateless where possible, with state managed by the calling code

## Services

### Implemented

- **PerplexityService**: Handles all Perplexity AI API interactions for web search
- **GeminiService**: Handles all Google Gemini API interactions for repository analysis
- **BrowserService**: Handles browser automation operations
- **FileStorageService**: Handles file system operations for storing results and configurations

### Planned Future Services

- **OpenAIService**: Handle all OpenAI API interactions
- **DocumentationService**: Handle documentation generation operations
- **GitHubService**: Handle GitHub API interactions
- **SearchHistoryService**: Manage search history persistence and retrieval

## Usage Example

```typescript
// Example of how a tool would use a service
import { perplexityService } from '../services/perplexity.service.js';

// In tool's execute method
const searchResults = await perplexityService.search(query, options);
```

## Service Implementation Pattern

Each service follows a consistent implementation pattern:

```typescript
// perplexity.service.ts
import { z } from 'zod';
import { config } from '../config/index.js';
import { PerplexityClient } from '../clients/perplexity.client.js';

// Define schemas for validation
const SearchParamsSchema = z.object({
  query: z.string(),
  model: z.string().optional(),
  maxTokens: z.number().optional(),
  includeMetadata: z.boolean().optional(),
});

export class PerplexityService {
  private client: PerplexityClient;
  
  constructor() {
    this.client = new PerplexityClient(config.perplexity.apiKey);
  }
  
  async search(params: z.infer<typeof SearchParamsSchema>) {
    // Validate input
    const validParams = SearchParamsSchema.parse(params);
    
    // Call API client
    const result = await this.client.search(validParams);
    
    // Process and return results
    return {
      searchResults: result.text,
      metadata: validParams.includeMetadata ? result.metadata : undefined,
    };
  }
}

export const perplexityService = new PerplexityService();
```

## Configuration

Services read their configuration from the central configuration system. See `src/config` for details.

## Testing

Each service has corresponding unit tests in the `tests/services` directory. Mock clients are used to test service logic without making actual API calls. 