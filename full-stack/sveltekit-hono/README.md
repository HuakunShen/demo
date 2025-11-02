# SvelteKit + Hono Type-Safe API Demo

This project demonstrates how to embed [Hono](https://hono.dev/) in a SvelteKit application with full end-to-end type safety.

## OpenAPI UI

- http://localhost:5173/api/scalar
- http://localhost:5173/api/swagger

## Features

- ✅ **Type-safe API client** using Hono's RPC client
- ✅ **End-to-end type safety** from backend to frontend
- ✅ **Zero code generation** - types are inferred automatically
- ✅ **SvelteKit integration** via catch-all API routes
- ✅ **Zod validation** for request/response schemas
- ✅ **Full CRUD example** with a Todo List application

## How It Works

### Backend (`src/lib/server.ts`)

The Hono server defines API routes with validation:

```typescript
export const app = new Hono()
  .basePath("/api")
  .get("/todos", (c) => c.json({ todos }))
  .post("/todos", zValidator("json", schema), handler)
  // ... more routes
```

### Client (`src/lib/client.ts`)

The RPC client provides type-safe access to the API:

```typescript
import { hc } from "hono/client";
import type { AppType } from "./server";

export const client = hc<AppType>(origin);
```

### SvelteKit Integration (`src/routes/api/[...slugs]/+server.ts`)

A catch-all route forwards requests to Hono:

```typescript
export const fallback: RequestHandler = ({ request }) => app.fetch(request);
```

### Frontend Usage (`src/routes/+page.svelte`)

The client provides full autocomplete and type checking:

```typescript
const response = await client.api.todos.$get();
const data = await response.json(); // Fully typed!
```

## Getting Started

```bash
pnpm install
pnpm dev
```

## Project Structure

```
src/
├── lib/
│   ├── server.ts    # Hono API definition
│   └── client.ts    # Type-safe RPC client
└── routes/
    ├── api/
    │   └── [...slugs]/
    │       └── +server.ts   # SvelteKit → Hono bridge
    ├── +page.svelte         # Todo app UI
    └── +page.ts             # Page load function
```

## Key Differences from REST APIs

Traditional REST:
```typescript
// No type safety, manual typing required
const response = await fetch('/api/todos');
const data: { todos: Todo[] } = await response.json();
```

With Hono RPC:
```typescript
// Fully typed, autocomplete works!
const response = await client.api.todos.$get();
const data = await response.json(); // Type: { todos: Todo[] }
```

## Learn More

- [Hono Documentation](https://hono.dev/)
- [SvelteKit Documentation](https://svelte.dev/docs/kit)
- [Hono RPC](https://hono.dev/docs/guides/rpc)
