// Exposes the Clerk publishable key to the browser. The key itself is public
// (it ships in every Clerk frontend); we just route it via a server fn so we
// don't have to wire a build-time env var.
import { createServerFn } from "@tanstack/react-start";

export const getClerkConfig = createServerFn({ method: "GET" }).handler(async () => {
  const publishableKey = process.env.CLERK_PUBLISHABLE_KEY ?? "";
  return { publishableKey };
});
