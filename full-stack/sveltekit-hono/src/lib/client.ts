import { hc } from "hono/client";
import type { AppType } from "./server";

// Use the origin from browser environment, fallback to localhost for SSR
const origin =
  typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:5173";

export const client = hc<AppType>(origin);
