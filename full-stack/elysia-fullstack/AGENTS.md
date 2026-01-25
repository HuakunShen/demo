# AGENTS.md

## Commands

- **Development**: `bun run dev` (watch mode)
- **Build**: `bun run build` (compile to server binary)
- **Test**: No test framework configured (package.json shows placeholder)

## Code Style Guidelines

### TypeScript/React
- Strict mode enabled, avoid `any` types
- File names: kebab-case for components, tests end with `.test.ts`
- Imports: organize external vs internal, use path aliases (`@server/*`, `@public/*`)
- Formatting: tabs (4 spaces), single quotes, no trailing commas, no semicolons
- Error handling: comprehensive with HTTP status codes for APIs

### Component Guidelines
- Use shadcn/ui components: `pnpx shadcn@latest add [component]`
- Follow existing patterns in `/public/components/ui/`
- React 19 with TypeScript strict mode
- Use Tailwind CSS for styling

### General
- File-level documentation for entry points
- Production-ready code by default
- Follow existing patterns within each package