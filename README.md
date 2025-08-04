# Typescript boilerplate app

## Tools and Frameworks

### Core Tools
- **TypeScript:** Ensures strict typing and robust code for scalability and reliability.
- **Yarn 4+ with Plug'n'Play (PnP):** Eliminates the need for `node_modules` and provides efficient dependency management.
- **Turborepo:** Optimizes task orchestration across the monorepo for builds, tests, and linting.

### Testing
- **Jest:** Handles unit and integration testing, configured with `ts-jest` for TypeScript support.

### Linting and Formatting
- **ESLint:** Configured with `@typescript-eslint` and several plugins (`prettier`, `jest`, `simple-import-sort`, `unused-imports`) for maintaining clean and consistent code.
- **Prettier:** Enforces code style standards across the project.

### Compilation
- **TypeScript Compiler:** Configured with strict options in a shared `tsconfig.json` to ensure high-quality code.

### Configuration Management
- **Turbo.json:** Orchestrates tasks like build, lint, test, and clean efficiently across the monorepo.

---

---

## Conventions and Practices

To ensure code quality and maintain consistency, the following conventions and practices are followed:

### General Principles

- **Fail Early and Hard:** Throw errors (e.g., `throw new Error('Not yet implemented')`) instead of returning non-standardized responses like `0` or `undefined`.
- **Promise Resolution:** Use `Promise.resolve()` when required due to function signature, but avoid unnecessary `await` calls if no asynchronous operations exist.

### Naming Conventions

- **File Names:** Use `kebab-case` for file names, and the name should generally reflect the primary entity the file exports.
- **Exports:** Always use explicit exports. Use `default` exports only if strictly mandated by the framework.

### TypeScript Practices

- **Strong Typing:** Write strongly typed code, avoiding type circumventions like `any`.
- **Avoid `as`:** Use the `satisfies` operator instead of `as` whenever possible. If `as` is required, validate its correctness using the `typeof` operator.

Example:
```typescript
// Type validation example
function handleValue(value: unknown) {
  if (typeof value === 'string') {
    const stringValue = value as string;
    console.log(`Value is a string: ${stringValue}`);
  } else {
    throw new Error('Invalid type: Expected a string');
  }
}
```
### Logging

Use dedicated logging utilities and avoid direct `console.log` or `console.error` calls in code:

```typescript
// printer.ts
export function printer(...args: unknown[]) {
  console.log(...args); // eslint-disable-line no-console
}

export function printError(...args: unknown[]) {
  console.error(...args); // eslint-disable-line no-console
}
```
### Workflow Practices

- **Merge Strategy:** Use squash merge exclusively for merging changes into the `main` branch.
- **Documentation:** Use `TODO`'s comments where future improvements or decisions are needed and include comments as necessary. Avoid verbosity and refrain from stating the obvious (e.g., "Whenever there is any doubt, there is no doubt").

## Monorepo Structure

The project employs a **monorepo** architecture to centralize dependencies and configurations:

1. **Root Directory:** Contains global configurations (`turbo.json`, `package.json`, `tsconfig.json`).
2. **Modules Directory:** Houses independent components with localized dependencies and configurations.

---

## Getting Started

1. **Install Dependencies:** Use Yarn to install and manage dependencies:
   ```bash
   yarn install
    ```