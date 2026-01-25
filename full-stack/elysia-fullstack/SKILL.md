---
name: elysia-fullstack
description: Setup a full-stack Elysia + React 19 application with Bun, TanStack Router, Tailwind CSS v4, and shadcn/ui. Use when creating a new full-stack project, setting up Elysia with React frontend, or bootstrapping a Bun-based web application.
argument-hint: [project-name]
disable-model-invocation: true
---

# Elysia Full-Stack Setup

Create a production-ready full-stack application with:
- **Backend**: Elysia (Bun) with static plugin + OpenAPI
- **Frontend**: React 19 + TanStack Router (hash history) + TanStack Query
- **Styling**: Tailwind CSS v4 + shadcn/ui (new-york style)
- **Tooling**: bun-plugin-tailwind, Eden treaty for type-safe API

## Step 1: Initialize Project

```bash
mkdir $ARGUMENTS && cd $ARGUMENTS
bun init -y
```

## Step 2: Install Dependencies

```bash
# Core dependencies
bun add elysia @elysiajs/static @elysiajs/eden @elysiajs/openapi

# React 19 + TanStack
bun add react react-dom @tanstack/react-router @tanstack/react-query

# Tailwind v4 + shadcn utilities
bun add tailwindcss tailwind-merge clsx class-variance-authority

# shadcn/ui peer deps
bun add @radix-ui/react-slot lucide-react

# Dev dependencies
bun add -d bun-types @types/react @types/react-dom bun-plugin-tailwind
```

## Step 3: Create Project Structure

```
$ARGUMENTS/
├── src/
│   └── index.ts           # Elysia server
├── public/
│   ├── index.html         # HTML entry
│   ├── index.tsx          # React entry
│   ├── router.tsx         # TanStack Router
│   ├── pages/
│   │   └── home-page.tsx
│   ├── components/
│   │   └── ui/            # shadcn components
│   ├── layouts/
│   │   └── index.tsx
│   ├── libs/
│   │   ├── api.ts         # Eden treaty client
│   │   └── utils.ts       # cn() utility
│   └── styles/
│       └── global.css     # Tailwind + CSS variables
├── package.json
├── tsconfig.json
├── bunfig.toml
├── components.json        # shadcn config
└── .prettierrc
```

## Step 4: Configuration Files

### package.json
```json
{
  "name": "$ARGUMENTS",
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "build": "bun build --compile --target bun --outfile server src/index.ts"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ES2022",
    "moduleResolution": "node",
    "jsx": "preserve",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["bun-types"],
    "baseUrl": ".",
    "paths": {
      "@server": ["./src/index.ts"],
      "@server/*": ["./src/*"],
      "@public/*": ["./public/*"]
    }
  }
}
```

### bunfig.toml
```toml
[serve.static]
plugins = ["bun-plugin-tailwind"]
```

### .prettierrc
```json
{
  "useTabs": true,
  "tabWidth": 4,
  "semi": false,
  "singleQuote": true,
  "trailingComma": "none"
}
```

### components.json (shadcn config)
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "public/styles/global.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@public/components",
    "utils": "@public/libs/utils",
    "ui": "@public/components/ui",
    "lib": "@public/libs",
    "hooks": "@public/libs/hooks"
  },
  "iconLibrary": "lucide"
}
```

## Step 5: Source Files

### src/index.ts (Elysia Server)
```typescript
import { Elysia } from 'elysia'
import { staticPlugin } from '@elysiajs/static'

export const app = new Elysia()
	.use(
		await staticPlugin({
			prefix: '/'
		})
	)
	.get('/api/message', { message: 'Hello from Elysia!' } as const)
	.listen(3000)

console.log(`🦊 Elysia running at http://localhost:${app.server?.port}`)
```

### public/index.html
```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>$ARGUMENTS</title>
	</head>
	<body>
		<div id="root"></div>
		<script type="module" src="./index.tsx"></script>
	</body>
</html>
```

### public/index.tsx (React Entry)
```typescript
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { router } from '@public/router'

const root = createRoot(document.getElementById('root')!)
root.render(<RouterProvider router={router} />)
```

### public/router.tsx (TanStack Router)
```typescript
import { createRouter, createRoute, createHashHistory, createRootRoute, Outlet } from '@tanstack/react-router'
import Layout from '@public/layouts'
import { HomePage } from '@public/pages/home-page'

const rootRoute = createRootRoute({
	component: () => <Outlet />
})

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/',
	component: () => (
		<Layout>
			<HomePage />
		</Layout>
	)
})

const routeTree = rootRoute.addChildren([indexRoute])
const hashHistory = createHashHistory()

export const router = createRouter({
	routeTree,
	history: hashHistory
})

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}
```

### public/layouts/index.tsx
```typescript
import type { PropsWithChildren } from 'react'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { cn } from '@public/libs/utils'
import '@public/styles/global.css'

const client = new QueryClient()

interface LayoutProps extends PropsWithChildren {
	className?: string
}

export default function Layout({ children, className }: LayoutProps) {
	return (
		<QueryClientProvider client={client}>
			<div className={cn('flex flex-col min-h-screen', className)}>
				{children}
			</div>
		</QueryClientProvider>
	)
}
```

### public/pages/home-page.tsx
```typescript
export function HomePage() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen gap-4">
			<h1 className="text-4xl font-bold">$ARGUMENTS</h1>
			<p className="text-muted-foreground">Elysia + React 19 Full-Stack</p>
		</div>
	)
}
```

### public/libs/utils.ts
```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}
```

### public/libs/api.ts
```typescript
import { treaty } from '@elysiajs/eden'
import type { app } from '@server'

export const api = treaty<typeof app>('localhost:3000')
```

### public/styles/global.css
```css
@import 'tailwindcss';

@custom-variant dark (&:is(.dark *));

:root {
	--background: oklch(1 0 0);
	--foreground: oklch(0.145 0 0);
	--card: oklch(1 0 0);
	--card-foreground: oklch(0.145 0 0);
	--popover: oklch(1 0 0);
	--popover-foreground: oklch(0.145 0 0);
	--primary: oklch(0.205 0 0);
	--primary-foreground: oklch(0.985 0 0);
	--secondary: oklch(0.97 0 0);
	--secondary-foreground: oklch(0.205 0 0);
	--muted: oklch(0.97 0 0);
	--muted-foreground: oklch(0.556 0 0);
	--accent: oklch(0.97 0 0);
	--accent-foreground: oklch(0.205 0 0);
	--destructive: oklch(0.577 0.245 27.325);
	--border: oklch(0.922 0 0);
	--input: oklch(0.922 0 0);
	--ring: oklch(0.708 0 0);
	--radius: 0.625rem;
}

.dark {
	--background: oklch(0.145 0 0);
	--foreground: oklch(0.985 0 0);
	--card: oklch(0.145 0 0);
	--card-foreground: oklch(0.985 0 0);
	--popover: oklch(0.145 0 0);
	--popover-foreground: oklch(0.985 0 0);
	--primary: oklch(0.985 0 0);
	--primary-foreground: oklch(0.205 0 0);
	--secondary: oklch(0.269 0 0);
	--secondary-foreground: oklch(0.985 0 0);
	--muted: oklch(0.269 0 0);
	--muted-foreground: oklch(0.708 0 0);
	--accent: oklch(0.269 0 0);
	--accent-foreground: oklch(0.985 0 0);
	--destructive: oklch(0.396 0.141 25.723);
	--border: oklch(0.269 0 0);
	--input: oklch(0.269 0 0);
	--ring: oklch(0.439 0 0);
}

@theme inline {
	--color-background: var(--background);
	--color-foreground: var(--foreground);
	--color-card: var(--card);
	--color-card-foreground: var(--card-foreground);
	--color-popover: var(--popover);
	--color-popover-foreground: var(--popover-foreground);
	--color-primary: var(--primary);
	--color-primary-foreground: var(--primary-foreground);
	--color-secondary: var(--secondary);
	--color-secondary-foreground: var(--secondary-foreground);
	--color-muted: var(--muted);
	--color-muted-foreground: var(--muted-foreground);
	--color-accent: var(--accent);
	--color-accent-foreground: var(--accent-foreground);
	--color-destructive: var(--destructive);
	--color-border: var(--border);
	--color-input: var(--input);
	--color-ring: var(--ring);
	--radius-sm: calc(var(--radius) - 4px);
	--radius-md: calc(var(--radius) - 2px);
	--radius-lg: var(--radius);
	--radius-xl: calc(var(--radius) + 4px);
}

@layer base {
	* {
		@apply border-border;
	}
	body {
		@apply bg-background text-foreground;
	}
}
```

## Step 6: Add shadcn/ui Components

After setup, add components as needed:
```bash
pnpx shadcn@latest add button
pnpx shadcn@latest add card
pnpx shadcn@latest add input
```

## Step 7: Run the App

```bash
bun run dev
```

Open http://localhost:3000 in your browser.

## Code Style Conventions

- **Tabs** for indentation (4-space width)
- **No semicolons**
- **Single quotes** for strings
- **No trailing commas**
- Use `function` declarations for exported components
- Use path aliases: `@public/*`, `@server/*`
- Use `cn()` utility for conditional Tailwind classes

## Adding New Routes

```typescript
// public/pages/about-page.tsx
export function AboutPage() {
	return <div>About</div>
}

// Add to router.tsx
const aboutRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/about',
	component: () => (
		<Layout>
			<AboutPage />
		</Layout>
	)
})

const routeTree = rootRoute.addChildren([indexRoute, aboutRoute])
```

## API Usage with Eden

```typescript
import { api } from '@public/libs/api'

// Type-safe API call
const response = await api.api.message.get()
console.log(response.data?.message) // "Hello from Elysia!"
```
