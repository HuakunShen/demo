# SvelteKit + Elysia Type-Safe API Demo

This project demonstrates how to embed [Elysia](https://elysiajs.com/) in a SvelteKit application with full end-to-end type safety.

- open http://localhost:5173/api/openapi to see the API documentation with swagger ui

## Features

- ✅ **Type-safe API client** using Elysia's Eden Treaty
- ✅ **End-to-end type safety** from backend to frontend
- ✅ **Zero code generation** - types are inferred automatically
- ✅ **SvelteKit integration** via catch-all API routes
- ✅ **Built-in validation** with Elysia's type system
- ✅ **Full CRUD example** with a Todo List application

## How It Works

### Backend (`src/lib/server.ts`)

The Elysia server defines API routes with validation:

```typescript
export const app = new Elysia({ prefix: "/api" })
  .get("/todos", () => ({ todos }))
  .post("/todos", handler, {
    body: t.Object({
      text: t.String({ minLength: 1 }),
    }),
  })
  // ... more routes
```

### Client (`src/lib/client.ts`)

The Eden Treaty client provides type-safe access to the API:

```typescript
import { treaty } from "@elysiajs/eden";
import type { App } from "./server";

export const client = treaty<App>(origin);
```

### SvelteKit Integration (`src/routes/api/[...slugs]/+server.ts`)

A catch-all route forwards requests to Elysia:

```typescript
export const fallback: RequestHandler = ({ request }) => app.handle(request);
```

### Frontend Usage (`src/routes/+page.svelte`)

The client provides full autocomplete and type checking:

```typescript
const response = await client.api.todos.get();
if (response.data) {
  todos = response.data.todos; // Fully typed!
}
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
│   ├── server.ts    # Elysia API definition
│   └── client.ts    # Type-safe Eden Treaty client
└── routes/
    ├── api/
    │   └── [...slugs]/
    │       └── +server.ts   # SvelteKit → Elysia bridge
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

With Eden Treaty:
```typescript
// Fully typed, autocomplete works!
const response = await client.api.todos.get();
// response.data is automatically typed as { todos: Todo[] }
```

## API Examples

### GET Request
```typescript
const response = await client.api.todos.get();
if (response.data) {
  console.log(response.data.todos); // Type: Todo[]
}
```

### POST Request
```typescript
const response = await client.api.todos.post({
  text: "New todo",
});
if (response.data?.todo) {
  console.log(response.data.todo); // Type: Todo
}
```

### PATCH with Path Parameters
```typescript
const response = await client.api.todos({ id: "1" }).patch({
  completed: true,
});
```

### DELETE with Path Parameters
```typescript
await client.api.todos({ id: "1" }).delete();
```

## Benefits

1. **Full Type Safety**: Catch errors at compile time, not runtime
2. **Autocomplete**: Get suggestions for all API endpoints and their parameters
3. **Refactor Friendly**: Rename endpoints or change types - TypeScript will catch all usages
4. **No Code Generation**: Types are inferred directly from the server definition
5. **Better DX**: Less boilerplate, more productivity

## Learn More

- [Elysia Documentation](https://elysiajs.com/)
- [Eden Treaty Documentation](https://elysiajs.com/eden/treaty/overview.html)
- [SvelteKit Documentation](https://svelte.dev/docs/kit)

