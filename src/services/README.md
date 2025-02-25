# Services Directory

## Purpose

The `services` directory is intended to contain service modules that handle business logic and orchestration between data sources and the application. Services act as an abstraction layer that separates the tools (which handle the MCP protocol interfaces) from the underlying implementation details.

## Design Pattern

Services follow these principles:

1. **Single Responsibility**: Each service handles a specific domain or external integration
2. **Abstraction**: Services hide implementation details from tools
3. **Reusability**: Multiple tools can use the same service
4. **Testability**: Services can be mocked for testing tools

## Planned Services

- **PerplexityService**: Handle all Perplexity AI API interactions
- **GeminiService**: Handle all Google Gemini API interactions
- **FileStorageService**: Handle file system operations
- **BrowserService**: Handle browser automation operations

## Implementation Status

- [ ] PerplexityService (To be migrated from web-search tool)
- [ ] GeminiService (To be migrated from repo-analysis tool)
- [ ] FileStorageService (To be implemented)
- [ ] BrowserService (To be implemented)

## Usage Example

```typescript
// Example of how a tool would use a service
import { perplexityService } from '../services/perplexity.service.js';

// In tool's execute method
const searchResults = await perplexityService.search(query);
``` 