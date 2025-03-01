# Development Workflow

This document describes the development workflow for the Developer Tools monorepo.

## Monorepo Structure

The project is organized as a monorepo with the following packages:

- **shared**: Common utilities and types used across packages
- **server**: Server-side implementations for providing tool functionality
- **client**: Client-side implementations for interacting with the tools

## Development Process

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/developer-tools.git
cd developer-tools
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Update Import Paths

If you've moved files between packages or need to update import paths:

```bash
npm run update-imports
```

### 4. Build

Build all packages in the correct order:

```bash
npm run build
```

For development with watch mode:

```bash
npm run build:watch
```

### 5. Testing

Run all tests:

```bash
npm test
```

Run tests for a specific package:

```bash
npm run test:shared
npm run test:server
npm run test:client
```

Run tests in watch mode:

```bash
npm run test:watch
```

Generate coverage reports:

```bash
npm run test:coverage
```

### 6. Running

Start all servers:

```bash
npm run start:all
```

On Windows:

```bash
npm run start:all:windows
```

Start individual servers:

```bash
npm run start:http  # Start HTTP transport server
npm run start:sse   # Start SSE transport server
npm run start:web   # Start web interface
```

### 7. Making Changes

1. Create a new branch for your changes
2. Make changes to the code
3. Update imports if needed with `npm run update-imports`
4. Build with `npm run build`
5. Test with `npm test`
6. Commit and push your changes
7. Create a pull request

## Package Structure

Each package follows a similar structure:

```
packages/[package-name]/
├── package.json        # Package configuration
├── tsconfig.json       # TypeScript configuration
└── src/                # Source code
    ├── index.ts        # Main entry point
    ├── __tests__/      # Test files
    └── __mocks__/      # Mock files for testing
```

## Dependency Management

- **Root Dependencies**: Dependencies that are used by multiple packages or development tools
- **Package Dependencies**: Dependencies that are specific to a particular package

When adding a new dependency:

1. If it's used by multiple packages, add it to the root `package.json`
2. If it's specific to a package, add it to that package's `package.json`

## CI/CD Pipeline

The CI/CD pipeline is configured in `.github/workflows/ci.yml` and runs:

1. Linting
2. Building
3. Testing
4. Deployment (on push to main branch)

## Best Practices

- Keep packages small and focused
- Share code through the shared package
- Write tests for all new features
- Update documentation when making significant changes
- Use TypeScript for type safety
- Follow the established code style and patterns 