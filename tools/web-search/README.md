# Web Search Tool

A powerful web search tool that leverages AI providers to deliver comprehensive search results.

## Features

- Multiple AI provider support with automatic fallback
- Configurable output formats
- Caching for improved performance
- Source attribution
- Metadata tracking
- File saving capabilities
- Pluggable formatter system

## Usage

```bash
dev-tools run web-search --data '{"query": "your search query", "outputFormat": "markdown"}'
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| query | string | (required) | The search query |
| outputFormat | string | "markdown" | Output format (text, markdown, json, html, csv, xml, etc.) |
| saveToFile | boolean | false | Whether to save results to a file |
| maxTokens | number | 150 | Maximum tokens for the response |
| includeSources | boolean | true | Include source information |
| includeMetadata | boolean | false | Include metadata in the output |
| customFileName | string | | Custom filename for saved results |
| provider | string | | Specific provider to use |
| model | string | | Specific model to use |
| temperature | number | 0.7 | Temperature for generation |
| detailed | boolean | false | Get more detailed results |
| noCache | boolean | false | Bypass cache |
| timeout | number | 30000 | Request timeout in ms |
| customCss | string | | Custom CSS for HTML output |
| cssClasses | object | | CSS class overrides for HTML output |

## Formatter System

The web search tool uses a pluggable formatter system that allows for custom output formats. The tool comes with several built-in formatters:

- Text: Plain text output
- Markdown: Formatted markdown
- JSON: Structured JSON data
- HTML: Rich HTML output
- CSV: Comma-separated values (plugin)
- XML: XML formatted data (plugin)

### Creating Custom Formatters

You can create custom formatters by implementing the `ResultFormatter` interface and placing your formatter in the `plugins` directory.

#### Example Custom Formatter

```typescript
import { ResultFormatter, FormatterOptions } from '../services/formatter-service.js';
import { SearchResult } from '../providers/provider-interface.js';

export class MyCustomFormatter implements ResultFormatter {
  // Unique identifier for the format
  format = 'custom';
  
  // Display name
  name = 'My Custom Format';
  
  // Format method implementation
  formatResult(result: SearchResult, options?: FormatterOptions): string {
    const { content, metadata } = result;
    // Your custom formatting logic here
    return `CUSTOM FORMAT: ${content}`;
  }
}

// Export the formatter
export default MyCustomFormatter;
```

### Using Custom Formatters

Once your custom formatter is placed in the `plugins` directory, it will be automatically loaded when the web search tool starts. You can then use your custom format by specifying it in the `outputFormat` option:

```bash
dev-tools run web-search --data '{"query": "your search query", "outputFormat": "custom"}'
```

## Extending the Formatter Service

The formatter service can be extended programmatically:

```typescript
import { formatterService } from './services/formatter-service.js';
import { MyCustomFormatter } from './my-custom-formatter.js';

// Register a custom formatter
formatterService.registerFormatter(new MyCustomFormatter());

// Get all registered formatters
const formatters = formatterService.getFormatters();
console.log(formatters.map(f => f.name)); // ['Plain Text', 'Markdown', 'JSON', 'HTML', 'My Custom Format']
```

## Cache System

The web search tool includes a sophisticated caching system with TTL-based invalidation, cache statistics, and methods to refresh specific items. The cache can be configured through environment variables or programmatically.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 