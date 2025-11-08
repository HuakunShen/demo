import { Hono } from "hono";
import { hc } from "hono/client";
import { describeRoute, resolver, validator } from "hono-openapi";
import { z } from "zod";

import { createFileRoute } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";

const app = new Hono<{ Bindings: Env }>().basePath("/hono").get(
  "/",
  describeRoute({
    description: "Say hello to the user",
    responses: {
      200: {
        description: "Successful response",
        content: {
          "text/plain": { schema: resolver(z.string()) },
        },
      },
    },
  }),
  validator(
    "query",
    z.object({
      name: z.string().optional(),
    })
  ),
  async (c) => {
    console.log({ "c.env": c.env });
    return c.text(
      `Hello ${c.req.query("name") ?? "World"}! I am ${c.env.APP_NAME}`
    );
  }
);
export type AppType = typeof app;
const handle = async ({ request }: { request: Request }) => {
  const { env } = await import("cloudflare:workers");
  return app.fetch(request, env);
};
export const Route = createFileRoute("/hono/$")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
    },
  },
});

export const api = createIsomorphicFn()
  .server(
    () =>
      hc<AppType>("http://localhost", {
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
          console.log({ init });
          const { env } = await import("cloudflare:workers");
          return app.fetch(new Request(input, init), env);
        },
      }).hono
  )
  .client(() => hc<AppType>(window.location.origin).hono);
