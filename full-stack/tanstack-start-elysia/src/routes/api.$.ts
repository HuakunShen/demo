import { Elysia } from "elysia";
import { treaty } from "@elysiajs/eden";
import { HttpsProxyAgent } from "https-proxy-agent";

import { createFileRoute } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";

const agent  = new HttpsProxyAgent("http://localhost:9090")
const app = new Elysia({
  prefix: "/api",
}).get("/", "Hello Elysia!");

const handle = ({ request }: { request: Request }) => app.fetch(request);

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
    },
  },
});

export const getTreaty = createIsomorphicFn()
  .server(() => treaty(app).api)
  .client(() => treaty<typeof app>("localhost:3000").api);
