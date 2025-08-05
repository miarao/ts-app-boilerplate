# TypeScript Production Boilerplate

A "production-ready" TypeScript monorepo boilerplate with service-oriented architecture, comprehensive tooling, and modern development practices. 

why double quoting? 
1. some aspects of the services are not battle tested on a load expected for production env.
2. production readiness depends on numerous aspects, that not all can be generalized.
3. logging, storage, etc. are local.

## 🚀 Quick Start

```bash
# Install dependencies and build
yarn prepare

# Start local services
yarn start-local-services

# Start UI application (in another terminal)
yarn start-app
```

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Development Tools](#development-tools)
- [Available Commands](#available-commands)
- [Core Modules](#core-modules)
- [Services](#services)
- [Development Best Practices](#development-best-practices)
- [Creating New Services](#creating-new-services)
- [Connecting Services](#connecting-services)
- [UI Integration](#ui-integration)
- [Environment Setup](#environment-setup)
- [Troubleshooting](#troubleshooting)

## 🏗️ Architecture Overview

This is a monorepo with a service-oriented architecture:

```
ts-app-boilerplate/
├── modules/
│   ├── app-ui/            # React frontend application
│   ├── services-local/    # Local services runner & registry
│   ├── service-boilerplate/ # Base service framework
│   ├── hello-service/     # Example service
│   ├── model-hub-service/ # AI/ML service
│   ├── logger/            # Centralized logging
│   ├── client/            # HTTP client utilities
│   ├── misc/              # Common utilities
│   └── cli/               # Command-line interface tools
└── ...
```
---

#### note that the application and backend(s) are all packed together for ease of development, but are compiled for deployment separately.

---
**Key Concepts:**
- **Services**: Self-contained business logic modules composed of <service-name>-api and <service-name>-service
- **Services Local**: Express server that acts as a service registry and router.
- **Service Boilerplate**: Framework for creating type-safe, validated services
- **Monorepo**: All modules share dependencies and tooling

## 🛠️ Development Tools

### Core Tools
- **TypeScript**: Strict typing for reliability and scalability
- **Yarn 4+ with PnP**: Efficient dependency management without `node_modules`
- **Turborepo**: Optimized task orchestration across the monorepo
- **Jest**: Unit and integration testing with TypeScript support

### Code Quality
- **ESLint**: Comprehensive linting with plugins.
- **Prettier**: Enforces consistent code style

### Build & Compilation
- **TypeScript Compiler**: Strict configuration for type safety (tsc -b, see tsconfig(-base).json)
- **Vite**: Fast development server and build tool for UI (vite.config.json)
- **Turborepo**: Parallel builds with intelligent caching (turbo.json)

### Agents; remote servers
- **.jules.setup**: a minimal 

## 📜 Available Commands

### Root Level Commands

```bash
# Development
yarn prepare              # Full setup: install, build, test, lint
yarn build               # Build all modules
yarn build-clean         # Build without cache
yarn test                # Run all tests
yarn test-clean          # Run tests without cache

# Code Quality
yarn lint                # Lint all files
yarn maintain            # Format, clean, sort, and generate tree
yarn typecheck           # Type check without compilation

# Application
yarn start-app           # Start React UI (port 3000)
yarn start-local-services # Start services server (port 7077)
yarn start-interactive-session # Start model hub CLI

# Utilities
yarn tree                # Generate project structure
yarn clean               # Clean all build artifacts
```

### Module-Specific Commands

```bash
# UI Development
yarn workspace app-ui start     # Development server
yarn workspace app-ui build     # Production build
yarn workspace app-ui preview   # Preview production build

# Service Management
yarn workspace services-local start:local  # Start services
yarn workspace services-cli run:cli        # Service CLI tools
```

## 🧩 Core Modules

### Utility Modules

**`logger`** - Centralized logging system
- Configurable log levels (debug, info, warn, error)
- Structured logging with context
- File and console output

**`misc`** - Common utilities
- ID generation (`makeId()`)
- Time utilities (`Moment`)
- Type helpers and validators

**`client`** - HTTP client abstractions
- Internal service communication
- External API clients
- Request/response type safety

**`cli`** - Command-line interface framework
- Yargs-based command registration
- Type-safe argument parsing
- Interactive and batch modes

### Data & Storage

**`thing-store`** - Generic data persistence
- Abstract storage interface
- Local and remote implementations
- Type-safe data operations

### Service Framework

**`service-boilerplate`** - Base service framework
- Request/response validation with Zod
- Standardized error handling
- Context propagation
- Handler registration

## 🔧 Services

### Services Architecture

Services are self-contained modules that expose HTTP endpoints through the services-local registry.

### Running Services

```bash
# Start the services server
yarn start-local-services

# Health check
curl http://localhost:7077/health

# Service invocation
curl -X POST http://localhost:7077/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "hello",
    "request": {"message": "Hello World"},
    "context": {"requestId": "123"}
  }'
```

### Available Services

**`hello-service`** - Example service
- Demonstrates basic service structure
- Request/response validation
- Error handling patterns

**`model-hub-service`** - AI/ML service
- Google AI API integration
- Text generation and processing
- Configurable model parameters

## 💡 Development Best Practices

### Code Conventions

**File Naming**: Use `kebab-case` for all files
```
user-service.ts          ✅
UserService.ts           ❌
```

**Exports**: Prefer explicit exports over default
```typescript
export { UserService }   ✅
export default UserService ❌
```

**Type Safety**: Avoid type circumvention

prefer 'satisfies' over 'as' when possible, otherwise, use 'as' alongside proper validation
```typescript
// ✅ Proper validation
if (typeof value === 'string') {
  const stringValue = value as string
}

// ❌ Avoid unchecked assertions
const stringValue = value as string
```

### Error Handling

**Fail Fast**: Throw errors instead of silent failures
```typescript
// ✅
if (!config.apiKey) {
  throw new Error('API key is required')
}

// ❌  
if (!config.apiKey) {
  return undefined
}
```

### Logging

Use centralized logging utilities:
```typescript
import { createDefaultLogger } from 'logger'

const logger = createDefaultLogger('info')
logger.info('Operation completed', { userId, result })

// Avoid direct console usage
console.log('test') // ❌
```

### Git Workflow

- **Merge Strategy**: Use squash merge for `main` branch
- **Documentation**: Add TODO comments for future improvements
- **Testing**: Write tests for new functionality

## 🆕 Creating New Services

### 1. Generate Service Module

```bash
# Create new module directory
mkdir modules/my-service
cd modules/my-service

# Copy service boilerplate
cp -r ../service-boilerplate/* .
```

### 2. Implement Service Logic

```typescript
// src/my-service.ts
import { ServiceBoilerplate } from 'service-boilerplate'
import { z } from 'zod'

const RequestSchema = z.object({
  input: z.string()
})

const ResponseSchema = z.object({
  output: z.string()
})

export class MyService extends ServiceBoilerplate<
  typeof RequestSchema,
  typeof ResponseSchema
> {
  constructor() {
    super(RequestSchema, ResponseSchema)
  }

  protected async handleRequest(request: z.infer<typeof RequestSchema>) {
    return {
      output: `Processed: ${request.input}`
    }
  }
}
```

### 3. Update Package Configuration

```json
// package.json
{
  "name": "my-service",
  "main": "dist/src/index.js",
  "dependencies": {
    "service-boilerplate": "1.0.0",
    "logger": "1.0.0",
    "zod": "^3.25.0"
  }
}
```

### 4. Add to TypeScript Configuration

```json
// tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src/**/*"],
  "references": [
    {"path": "../service-boilerplate"},
    {"path": "../logger"}
  ]
}
```

## 🔌 Connecting Services

### 1. Register with Services Local

```typescript
// modules/services-local/src/start.ts
import { MyService } from 'my-service'

async function start() {
  const servicesLocal = new ServicesLocal(7077, logger)
  
  // Create service instance
  const myService = new MyService()
  
  // Register service
  servicesLocal.registerService('my-service', myService)
  
  await servicesLocal.start()
}
```

### 2. Add Environment Variables

```typescript
// .env
MY_SERVICE_API_KEY=your_api_key_here
```

```typescript
// Handle environment in start.ts
const apiKey = process.env.MY_SERVICE_API_KEY || 
  failMe('MY_SERVICE_API_KEY environment variable is required')

const myService = new MyService(apiKey)
```

### 3. Update Service Dependencies

```bash
# Add to workspace root
yarn add my-service

# Update services-local package.json
{
  "dependencies": {
    "my-service": "1.0.0"
  }
}
```

## 🖥️ UI Integration

### 1. Using Services in React

```typescript
// app-ui/src/hooks/use-my-service.ts
import { useEndpointClient } from './context/EndpointClientProvider'

export function useMyService() {
  const client = useEndpointClient()
  
  return async (input: string) => {
    return await client.invokeService('my-service', { input })
  }
}
```

### 2. Service Client Integration

```typescript
// app-ui/src/context/EndpointClientProvider.tsx
import { InternalClient } from 'client'

const client = new InternalClient('http://localhost:7077')

export function EndpointClientProvider({ children }) {
  return (
    <EndpointClientContext.Provider value={client}>
      {children}
    </EndpointClientContext.Provider>
  )
}
```

### 3. Component Usage

```typescript
// app-ui/src/components/MyComponent.tsx
import { useMyService } from '../hooks/use-my-service'

export function MyComponent() {
  const myService = useMyService()
  
  const handleSubmit = async (input: string) => {
    try {
      const result = await myService(input)
      console.log('Service response:', result)
    } catch (error) {
      console.error('Service error:', error)
    }
  }
  
  return (
    // Component JSX
  )
}
```

## 🌍 Environment Setup

### Required Environment Variables

```bash
# .env
LOG_LEVEL=info                    # Optional: debug, info, warn, error
GOOGLE_AI_API_KEY=your_key_here   # Required for model-hub-service
```

### Development Environment

```bash
# Node.js version
node --version  # Should be >= 22

# Yarn version  
yarn --version  # Should be 4.5.2+

# Install dependencies
yarn install
```

### Production Environment

```bash
# Build for production
yarn build

# Run services in production mode
NODE_ENV=production yarn start-local-services

# Serve UI static files
yarn workspace app-ui build
# Serve dist/ directory with your preferred static server
```

## 🔍 Troubleshooting

### Common Issues

**Build Failures**
```bash
# Clear all caches and rebuild
yarn clean
yarn build-clean
```

**Service Registration Errors**
- Verify service name is unique
- Check service implements ServiceBoilerplate correctly
- Ensure all dependencies are installed

**Port Conflicts**
- Services Local: Default port 7077
- App UI: Default port 3000
- Change ports in respective configurations if needed

**Type Errors**
```bash
# Run type checking
yarn typecheck

# Common fixes
yarn build  # Ensure dependencies are built
```

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug yarn start-local-services

# Run single service test
yarn workspace my-service test
```

### Getting Help

- Check existing services for implementation patterns
- Review service-boilerplate documentation
- Examine test files for usage examples
- Use TypeScript compiler for type checking guidance