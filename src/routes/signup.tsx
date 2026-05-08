import { createFileRoute, Link } from "@tanstack/react-router";
import { SignUp } from "@clerk/tanstack-react-start";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — ThreatDesk" }] }),
  component: SignupPage,
});

function SignupPage() {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between border-r border-border bg-sidebar p-12 md:flex">
        <Link to="/" className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-mono text-lg">ThreatDesk</span>
        </Link>
        <div>
          <h2 className="font-mono text-3xl leading-tight">
            Provision your <span className="text-primary">analyst account</span>.
          </h2>
          <p className="mt-3 max-w-md text-muted-foreground">
            The first account becomes the Security Lead. Subsequent accounts join
            as analysts and receive starter assignments.
          </p>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          Tip · the very first signup becomes the Admin
        </p>
      </div>
      <div className="flex items-center justify-center p-8">
        <SignUp
          routing="path"
          path="/signup"
          signInUrl="/login"
          forceRedirectUrl="/dashboard"
          appearance={{ variables: { colorPrimary: "#5ed8d8", colorBackground: "#1a1f2a" } }}
        />
      </div>
    </div>
  );
}
