import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { ClerkProvider } from "@clerk/tanstack-react-start";

import { getClerkConfig } from "@/lib/clerk-config.functions";
import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-mono text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Signal lost</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          That route isn&apos;t in the threat map.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Return to base
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Operations interrupted
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Retry
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async () => {
    const config = await getClerkConfig();
    return { clerkPublishableKey: config.publishableKey };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ThreatDesk — Security workflow management" },
      {
        name: "description",
        content:
          "ThreatDesk is the operations console for modern cyber teams: assign, track, and resolve network security tasks from one centralized dashboard.",
      },
      { name: "author", content: "ThreatDesk" },
      { property: "og:title", content: "ThreatDesk — Security workflow management" },
      {
        property: "og:description",
        content:
          "Centralized vulnerability and network task management for internal security teams.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient, clerkPublishableKey } = Route.useRouteContext();

  if (!clerkPublishableKey) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="td-card max-w-lg p-8">
          <h1 className="font-mono text-2xl text-primary">ThreatDesk</h1>
          <p className="mt-3 text-muted-foreground">
            Authentication isn&apos;t configured yet. Add your Clerk
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">CLERK_PUBLISHABLE_KEY</code>
            and
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">CLERK_SECRET_KEY</code>
            in project secrets to enable the auth flow.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/">
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <Toaster richColors theme="dark" position="top-right" />
      </QueryClientProvider>
    </ClerkProvider>
  );
}
