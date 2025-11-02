import { Hono } from "hono";
import { z } from "zod";
import { swaggerUI } from "@hono/swagger-ui";
import { Scalar } from "@scalar/hono-api-reference";
import {
  describeRoute,
  resolver,
  validator,
  openAPIRouteHandler,
} from "hono-openapi";

// In-memory todo store
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

const todos: Todo[] = [];
let nextId = 1;

// Zod schemas
const todoSchema = z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean(),
  createdAt: z.string(),
});

const createTodoSchema = z.object({
  text: z.string().min(1),
});

const updateTodoSchema = z.object({
  text: z.string().min(1).optional(),
  completed: z.boolean().optional(),
});

const todosResponseSchema = z.object({
  todos: z.array(todoSchema),
});

const todoResponseSchema = z.object({
  todo: todoSchema,
});

const errorResponseSchema = z.object({
  error: z.string(),
});

const successResponseSchema = z.object({
  success: z.boolean(),
});

export const app = new Hono()
  .basePath("/api")
  // Get all todos
  .get(
    "/todos",
    describeRoute({
      description: "Get all todos",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": { schema: resolver(todosResponseSchema) },
          },
        },
      },
    }),
    (c) => {
      return c.json({ todos });
    }
  )
  // Create a new todo
  .post(
    "/todos",
    describeRoute({
      description: "Create a new todo",
      responses: {
        200: {
          description: "Todo created successfully",
          content: {
            "application/json": { schema: resolver(todoResponseSchema) },
          },
        },
      },
    }),
    validator("json", createTodoSchema),
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
    describeRoute({
      description: "Update a todo",
      responses: {
        200: {
          description: "Todo updated successfully",
          content: {
            "application/json": { schema: resolver(todoResponseSchema) },
          },
        },
        404: {
          description: "Todo not found",
          content: {
            "application/json": { schema: resolver(errorResponseSchema) },
          },
        },
      },
    }),
    validator("json", updateTodoSchema),
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
  .delete(
    "/todos/:id",
    describeRoute({
      description: "Delete a todo",
      responses: {
        200: {
          description: "Todo deleted successfully",
          content: {
            "application/json": { schema: resolver(successResponseSchema) },
          },
        },
        404: {
          description: "Todo not found",
          content: {
            "application/json": { schema: resolver(errorResponseSchema) },
          },
        },
      },
    }),
    (c) => {
      const id = c.req.param("id");
      const index = todos.findIndex((t) => t.id === id);
      if (index === -1) {
        return c.json({ error: "Todo not found" }, 404);
      }
      todos.splice(index, 1);
      return c.json({ success: true });
    }
  );

// Generate and serve OpenAPI spec
app.get(
  "/openapi",
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: "Todo API",
        version: "1.0.0",
        description: "A simple Todo API built with Hono",
      },
      servers: [{ url: "http://localhost:5173", description: "Local Server" }],
    },
  })
);
app.get("/swagger", swaggerUI({ url: "/api/openapi" }));
app.get("/scalar", Scalar({ url: "/api/openapi" }));

export type AppType = typeof app;
