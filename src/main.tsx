import React from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./styles.css";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("ThreatDesk runtime error", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
          <div className="td-card max-w-lg p-8">
            <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              ThreatDesk recovery mode
            </div>
            <h1 className="mt-3 font-mono text-2xl font-semibold text-primary">App failed safely</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              The interface caught a runtime error instead of showing a blank screen.
            </p>
            <pre className="mt-4 max-h-40 overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">
              {this.state.error.message}
            </pre>
            <button
              className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              onClick={() => window.location.assign("/")}
            >
              Return home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const app = (
  <RootErrorBoundary>
    {clerkPublishableKey ? (
      <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/">
        <App clerkEnabled />
      </ClerkProvider>
    ) : (
      <App clerkEnabled={false} />
    )}
  </RootErrorBoundary>
);

createRoot(document.getElementById("root")!).render(app);
