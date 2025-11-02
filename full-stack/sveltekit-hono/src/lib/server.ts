import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

// In-memory todo store
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

const todos: Todo[] = [];
let nextId = 1;

export const app = new Hono()
  .basePath("/api")
  // Get all todos
  .get("/todos", (c) => {
    return c.json({ todos });
  })
  // Create a new todo
  .post(
    "/todos",
    zValidator(
      "json",
      z.object({
        text: z.string().min(1),
      })
    ),
    (c) => {
      const body = c.req.valid("json");
      const todo: Todo = {
        id: String(nextId++),
        text: body.text,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      todos.push(todo);
      return c.json({ todo });
    }
  )
  // Update a todo
  .patch(
    "/todos/:id",
    zValidator(
      "json",
      z.object({
        text: z.string().min(1).optional(),
        completed: z.boolean().optional(),
      })
    ),
    (c) => {
      const id = c.req.param("id");
      const body = c.req.valid("json");
      const todo = todos.find((t) => t.id === id);
      if (!todo) {
        return c.json({ error: "Todo not found" }, 404);
      }
      if (body.text !== undefined) {
        todo.text = body.text;
      }
      if (body.completed !== undefined) {
        todo.completed = body.completed;
      }
      return c.json({ todo });
    }
  )
  // Delete a todo
  .delete("/todos/:id", (c) => {
    const id = c.req.param("id");
    const index = todos.findIndex((t) => t.id === id);
    if (index === -1) {
      return c.json({ error: "Todo not found" }, 404);
    }
    todos.splice(index, 1);
    return c.json({ success: true });
  });

export type AppType = typeof app;

