import { Elysia, t } from "elysia";
import { openapi } from "@elysiajs/openapi";

// In-memory todo store
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

const todos: Todo[] = [];
let nextId = 1;

export const app = new Elysia({ prefix: "/api" })
  .use(openapi()) // open http://localhost:5173/api/openapi to see the API documentation with swagger ui
  // Get all todos
  .get("/todos", () => {
    return { todos };
  })
  // Create a new todo
  .post(
    "/todos",
    ({ body }) => {
      const todo: Todo = {
        id: String(nextId++),
        text: body.text,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      todos.push(todo);
      return { todo };
    },
    {
      body: t.Object({
        text: t.String({ minLength: 1 }),
      }),
    }
  )
  // Update a todo
  .patch(
    "/todos/:id",
    ({ params: { id }, body }) => {
      const todo = todos.find((t) => t.id === id);
      if (!todo) {
        throw new Error("Todo not found");
      }
      if (body.text !== undefined) {
        todo.text = body.text;
      }
      if (body.completed !== undefined) {
        todo.completed = body.completed;
      }
      return { todo };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        text: t.Optional(t.String({ minLength: 1 })),
        completed: t.Optional(t.Boolean()),
      }),
    }
  )
  // Delete a todo
  .delete(
    "/todos/:id",
    ({ params: { id } }) => {
      const index = todos.findIndex((t) => t.id === id);
      if (index === -1) {
        throw new Error("Todo not found");
      }
      todos.splice(index, 1);
      return { success: true };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  );

export type App = typeof app;
