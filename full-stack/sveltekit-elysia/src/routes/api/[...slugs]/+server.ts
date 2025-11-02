// src/routes/api/[...slugs]/+server.ts

import { app } from "$lib/server";

type RequestHandler = (v: { request: Request }) => Response | Promise<Response>;

export const fallback: RequestHandler = ({ request }) => app.handle(request);
