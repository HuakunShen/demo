## Code Style Guidelines

### TypeScript

- Strict mode, avoid `any` type
- Use proper generics and interfaces
- File names: kebab-case, tests end with `.test.ts`
- Imports: organize external vs internal imports
- Error handling: comprehensive with HTTP status codes for APIs

### Python

- All functions need type annotations
- Use Pydantic for external data validation
- TypedDict/dataclass for structured data
- Async/await patterns with httpx

### General

- File-level documentation required for entry points
- Production-ready code by default
- Follow existing patterns within each package
- Use Chinglish for comments/docs, English for terminology

## Shadcn Components (Web App)

- Use latest version: `pnpx shadcn@latest add [component]`
- Example: `pnpx shadcn@latest add button`
