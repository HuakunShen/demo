import { treaty } from "@elysiajs/eden";
import type { App } from "../app/api/[[...slugs]]/route";

// Use the origin from browser environment, fallback to localhost for SSR
const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

export const client = treaty<App>(origin);