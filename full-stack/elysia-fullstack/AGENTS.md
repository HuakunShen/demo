# AGENTS.md

## Project Overview

Full-stack application using Elysia (Bun) backend with React 19 frontend.
- **Backend**: Elysia server with static plugin, OpenAPI support
- **Frontend**: React 19 + TanStack Router (hash history) + TanStack Query
- **Styling**: Tailwind CSS v4 + shadcn/ui (new-york style)
- **Runtime**: Bun

## Commands

```bash
# Development (watch mode)
bun run dev

# Build (compile to server binary)
bun run build

# No test framework configured yet
# Tests would end with .test.ts
```

## Project Structure

```
src/                    # Backend code
  index.ts              # Elysia server entry point
public/                 # Frontend code
  index.tsx             # React entry point
  router.tsx            # TanStack Router configuration
  pages/                # Page components
  components/           # Shared components
    ui/                 # shadcn/ui components
  layouts/              # Layout components
  libs/                 # Utilities and API client
    api.ts              # Eden treaty client (type-safe API)
    utils.ts            # cn() utility for Tailwind
  styles/
    global.css          # Tailwind + CSS variables
```

## Path Aliases

Configured in `tsconfig.json`:
```json
{
  "@server": ["./src/index.ts"],
  "@server/*": ["./src/*"],
  "@public/*": ["./public/*"]
}
```

Use path aliases for all imports:
```typescript
// Good
import { api } from '@public/libs/api'
import { Button } from '@public/components/ui/button'
import type { app } from '@server'

// Bad
import { api } from '../../libs/api'
```

## Code Style

### Formatting (Prettier)

- **Tabs**: yes (4-space width)
- **Semicolons**: no
- **Quotes**: single
- **Trailing commas**: none

```typescript
// Correct formatting
import { useState } from 'react'

export function MyComponent() {
	const [count, setCount] = useState(0)
	return <div>{count}</div>
}
```

### TypeScript

- **Strict mode**: enabled, avoid `any` types
- **File naming**: kebab-case (`my-component.tsx`, `user-service.ts`)
- **Type imports**: use `import type` for type-only imports

```typescript
// Separate type imports
import type { PropsWithChildren } from 'react'
import { useState } from 'react'
```

### Import Order

1. External packages (react, @tanstack/*, etc.)
2. Internal aliases (@public/*, @server/*)
3. Relative imports (if necessary)

```typescript
// 1. External
import React from 'react'
import { createRouter } from '@tanstack/react-router'

// 2. Internal aliases
import { Button } from '@public/components/ui/button'
import { cn } from '@public/libs/utils'
```

### React Components

- Use `function` declarations for exported components
- Use `PropsWithChildren` or explicit interface for props
- Prefix page components with page name (`HomePage`, `StrategiesPage`)

```typescript
// Page component
export function HomePage() {
	return <div>HomePage</div>
}

// Component with props
interface LayoutProps extends PropsWithChildren {
	className?: string
}

export default function Layout({ children, className }: LayoutProps) {
	return <div className={className}>{children}</div>
}
```

### Error Handling

Frontend:
```typescript
const { data, loading, error } = useMarketData()

if (loading) return <LoadingState />
if (error) return <ErrorState message={error} />
return <Content data={data} />
```

Backend (Elysia):
```typescript
.get('/resource', () => {
	// Return typed response
	return { data: 'value' } as const
})
```

## shadcn/ui Components

Add new components:
```bash
pnpx shadcn@latest add [component-name]
```

Configuration (`components.json`):
- Style: `new-york`
- Components: `@public/components`
- UI: `@public/components/ui`
- Utils: `@public/libs/utils`

Use the `cn()` utility for conditional classes:
```typescript
import { cn } from '@public/libs/utils'

<div className={cn('base-class', condition && 'conditional-class')} />
```

## TanStack Router

Uses **hash history** for client-side routing (SPA served from static files).

Route registration pattern:
```typescript
const route = createRoute({
	getParentRoute: () => rootRoute,
	path: '/my-path',
	component: () => (
		<Layout>
			<MyPage />
		</Layout>
	)
})

// Register types
declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}
```

See `.cursor/rules/tanstack-react-router_*.mdc` for detailed TanStack Router patterns.

## API Client (Eden Treaty)

Type-safe API calls using Eden treaty:
```typescript
import { treaty } from '@elysiajs/eden'
import type { app } from '@server'

export const api = treaty<typeof app>('localhost:3000')

// Usage
const response = await api.message.get()
```

## Key Conventions

1. **No semicolons** - enforced by Prettier
2. **Tabs for indentation** - 4-space width
3. **Single quotes** - for strings
4. **Path aliases** - always use `@public/*` and `@server/*`
5. **Type safety** - no `any`, use proper generics
6. **shadcn/ui** - use existing components, add via CLI when needed
7. **Tailwind** - use CSS variables for theming (see `global.css`)