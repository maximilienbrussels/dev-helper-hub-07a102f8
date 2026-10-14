import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachAuthToken } from "@/lib/auth-token-attacher";
// Geen Supabase-attacher meer: dit project draait op Neon Auth. De oude
// middleware gooide een fout ("Missing Supabase environment variable(s)")
// bij elke serverFn-oproep na het inloggen.

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(error), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  // Render route components only in the browser. API handlers and server
  // functions remain server-side and continue to work normally.
  defaultSsr: false,
  functionMiddleware: [attachAuthToken],
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
