import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  Network,
  GitBranch,
  Activity,
  Lock,
  ArrowRight,
  Radar,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ThreatDesk — Security workflow management for modern cyber teams" },
      {
        name: "description",
        content:
          "Assign, track, and resolve network security tasks through a centralized operations dashboard built for internal security teams.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      <Workflow />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-mono text-lg font-semibold tracking-tight">ThreatDesk</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            to="/login"
            className="rounded-md px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="td-glow inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-mono text-xs text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-status-resolved" />
            SOC ops · live
          </span>
          <h1 className="mt-5 font-mono text-5xl font-semibold leading-tight tracking-tight text-foreground md:text-6xl">
            Security workflow <br />
            for <span className="text-primary">modern cyber teams</span>.
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            Assign, track, and resolve network security tasks through a centralized
            operations dashboard. Built for internal security leads and the analysts
            who close the findings.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="td-glow inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-3 font-medium text-foreground hover:bg-accent"
            >
              Log in
            </Link>
          </div>
          <div className="mt-8 flex items-center gap-6 font-mono text-xs text-muted-foreground">
            <span>NETWORK · FIREWALL · DNS · VPN</span>
          </div>
        </div>

        <DashboardPreview />
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <div className="td-card td-glow relative p-5">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="h-2.5 w-2.5 rounded-full bg-sev-critical" />
          <span className="h-2.5 w-2.5 rounded-full bg-sev-medium" />
          <span className="h-2.5 w-2.5 rounded-full bg-status-resolved" />
          <span className="ml-3 text-muted-foreground">threatdesk · admin</span>
        </div>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: "Active", value: 18, color: "text-status-progress" },
          { label: "Critical", value: 4, color: "text-sev-critical" },
          { label: "Resolved", value: 27, color: "text-status-resolved" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-background/40 p-3">
            <div className="font-mono text-[10px] uppercase text-muted-foreground">{s.label}</div>
            <div className={`mt-1 font-mono text-2xl ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {[
          { t: "Open Port Exposure Review", s: "high", st: "in progress" },
          { t: "Firewall Rule Audit", s: "medium", st: "pending" },
          { t: "Internal Network Scan Review", s: "critical", st: "review" },
          { t: "DNS Record Drift Check", s: "low", st: "resolved" },
        ].map((row) => (
          <div
            key={row.t}
            className="flex items-center justify-between rounded-md border border-border bg-background/40 px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-3">
              <span
                className={`h-2 w-2 rounded-full ${
                  row.s === "critical"
                    ? "bg-sev-critical"
                    : row.s === "high"
                      ? "bg-sev-high"
                      : row.s === "medium"
                        ? "bg-sev-medium"
                        : "bg-sev-low"
                }`}
              />
              <span className="text-foreground">{row.t}</span>
            </div>
            <span className="font-mono text-[10px] uppercase text-muted-foreground">{row.st}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Features() {
  const items = [
    {
      icon: Network,
      title: "Network vulnerability tracking",
      body: "Capture open ports, exposure findings, and misconfigurations as actionable tasks tied to projects.",
    },
    {
      icon: GitBranch,
      title: "Role-based assignment",
      body: "Security Leads dispatch work to analysts. Members see only what they own, with severity and deadlines.",
    },
    {
      icon: Radar,
      title: "Team progress monitoring",
      body: "Watch every analyst's queue, in-flight investigations, and resolved findings from one operations view.",
    },
    {
      icon: Activity,
      title: "Security analytics",
      body: "Severity breakdowns, status charts, and an activity log that updates as findings move through review.",
    },
  ];
  return (
    <section className="border-t border-border/50 bg-background/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-mono text-3xl tracking-tight">Everything a network security workflow needs.</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          ThreatDesk is opinionated for internal SOC and infrastructure security workflows — not a generic ticket system.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {items.map(({ icon: Icon, title, body }) => (
            <div key={title} className="td-card p-6 transition-transform hover:-translate-y-0.5">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Workflow() {
  const steps = [
    { n: "01", title: "Lead creates the task", body: "Severity, priority, due date, and the network category." },
    { n: "02", title: "Analyst investigates", body: "Updates status to In Progress and logs findings as notes." },
    { n: "03", title: "Lead reviews & resolves", body: "Status moves to Resolved; analytics reflect the close." },
  ];
  return (
    <section className="border-t border-border/50">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-mono text-3xl tracking-tight">How a finding flows.</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="td-card p-6">
              <div className="font-mono text-xs text-primary">{s.n}</div>
              <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/50 py-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          <span className="font-mono">ThreatDesk · operations console</span>
        </div>
        <div>© {new Date().getFullYear()} ThreatDesk</div>
      </div>
    </footer>
  );
}
