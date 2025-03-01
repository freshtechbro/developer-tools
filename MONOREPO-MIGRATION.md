# Monorepo Migration Guide

This document provides guidance on the recent migration to a monorepo architecture and identifies files that may be redundant after the migration.

## Architecture Changes

The project has been reorganized into a monorepo structure with the following components:

### New Structure

- **packages/**: Core packages used throughout the project
  - **server/**: Server-side code including services, transports, and routes
  - **shared/**: Shared utilities, types, and configurations
  - **client/**: Client-side code for web interfaces

- **tools/**: Individual command-line tools
  - **web-search/**: Web search tool using Perplexity AI
  - **command-handler/**: Command handler for CLI and chat integrations
  - **repo-analysis/**: Repository analysis tool using Google Gemini
  - **doc-generation/**: Documentation generation tool
  - **browser-automation/**: Browser automation tool

- **unified-test-interface/**: Web interface for interacting with all tools
- **mcp-server/**: Model Context Protocol server for AI integration

## Potentially Redundant Files

The following files in the root directory may be redundant after the migration to the monorepo architecture. Review each file before removing to ensure functionality is preserved in the new architecture.

### Test and Development Files

These files have likely been replaced by the monorepo's test infrastructure:

- `test-server.js` - Replaced by test infrastructure in packages/server
- `test-transport.js` - Replaced by transport testing in packages/server
- `simple-web-search-test.js` - Replaced by tests in tools/web-search
- `comprehensive-web-search-test.js` - Replaced by tests in tools/web-search
- `real-web-search-test.js` - Replaced by tests in tools/web-search
- `command-interceptor-test.js` - Replaced by tests in tools/command-handler
- `test.html` - Replaced by the unified-test-interface
- `sse-tester.html` - Replaced by the unified-test-interface
- `web-search-ui.html` - Replaced by the unified-test-interface

### Server and Build Files

These server and build scripts have been integrated into the monorepo structure:

- `start-http-server.js` - Replaced by scripts in packages/server
- `unified-backend.js` - Functionality moved to packages/server
- `stop-servers.js` - Functionality moved to packages/server

### Batch Files

Some batch files may be redundant or need to be updated to work with the new architecture:

- `dev-server.bat` - May need to be updated to point to new locations
- `dev-server-all-interfaces.bat` - May need to be updated to point to new locations
- `start-backend.bat` - May need to be updated to point to new locations
- `start-ui.bat` - May need to be updated to point to new locations
- `build-ui.bat` - May need to be updated to point to new locations
- `start-unified.bat` - May need to be updated to point to new locations

## Migration Steps

1. **Update Dependencies**: Ensure all packages have their dependencies properly defined in their respective package.json files.

2. **Update Import Paths**: All import paths need to be updated to reflect the new structure:
   ```javascript
   // Old import
   import { webSearchTool } from '../../tools/web-search/web-search.js';
   
   // New import
   import { webSearch } from '@developer-tools/web-search';
   ```

3. **Update Configuration**: Ensure configuration is properly set up in packages/server/src/config.

4. **Update Scripts**: Update npm scripts in the root package.json to work with the monorepo structure.

5. **Test Coverage**: Ensure test coverage is maintained after the migration.

6. **Documentation**: Update all documentation to reflect the new structure (README files, etc.).

7. **Clean Up**: Remove redundant files after ensuring their functionality is preserved in the new structure.

## Benefits of the Monorepo

- **Improved Code Organization**: Clear separation of concerns with dedicated packages
- **Better Dependency Management**: Dependencies are clearly defined for each package
- **Simplified Versioning**: Coordinated versioning of related packages
- **Streamlined Development**: Changes across related packages can be made in a single commit
- **Consistent Tooling**: Shared configuration for linting, testing, and building
- **Improved Documentation**: Clear documentation structure for each package

## Next Steps

1. Review all potentially redundant files and confirm whether they can be removed
2. Update all batch and script files to work with the new architecture
3. Update documentation to reflect the new structure
4. Complete any remaining migration tasks 