# Changelog

## [Unreleased] - Major Project Reorganization

### Added

- **Monorepo Structure**
  - Reorganized project into a monorepo with `shared`, `server`, and `client` packages
  - Created package.json files for each package with appropriate dependencies
  - Added workspace configuration in root package.json

- **Build System**
  - Added build script that builds packages in the correct order
  - Added build:watch script for development
  - Updated tsconfig.json files to support project references

- **Testing Setup**
  - Configured Jest for monorepo testing
  - Added test scripts for individual packages
  - Set up test coverage reporting
  - Created common test setup in jest.setup.ts

- **Import Path Management**
  - Created script to update import paths between packages
  - Added script to package.json to run the import path updater

- **CI/CD Pipeline**
  - Added GitHub Actions workflow for continuous integration
  - Configured build, test, and lint steps
  - Added deployment step for the main branch

- **Documentation**
  - Added detailed development workflow documentation
  - Updated README.md with references to new documentation
  - Added this CHANGELOG.md file

### Changed

- **Project Structure**
  - Moved utility files to the shared package
  - Moved type definitions to the shared package
  - Moved transport implementations to the server package
  - Moved service implementations to the server package
  - Moved route implementations to the server package
  - Moved test setup to the root test directory

- **Configuration Files**
  - Updated package.json scripts to use the new structure
  - Updated tsconfig.json for the monorepo structure
  - Created package-specific tsconfig.json files
  - Updated jest.config.js for monorepo testing

### Removed

- Old directory structure
- Redundant configuration files

## [1.0.0] - Initial Release

### Added

- Initial project structure
- HTTP and SSE transport servers
- Web interface for testing
- Health check utilities 