import { createFileRoute } from "@tanstack/react-router";

// Catch-all so Clerk's path routing (/login/factor-one, etc.) still mounts SignIn.
export const Route = createFileRoute("/login/$")({
  component: () => null,
});
