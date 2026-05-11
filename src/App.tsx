import { useEffect, useMemo, useState } from "react";
import { SignedIn, SignedOut, SignIn, SignUp, useUser } from "@clerk/clerk-react";
import { toast, Toaster } from "sonner";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock4,
  FolderKanban,
  GitBranch,
  ListChecks,
  Lock,
  MessageSquarePlus,
  Network,
  Plus,
  Radar,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ThreatDeskProvider, useThreatDesk, type Priority, type Role, type Severity, type Status } from "@/lib/threatdesk-store";
import { AppShell } from "@/components/threatdesk/app-shell";
import { SeverityBadge, StatCard, StatusBadge } from "@/components/threatdesk/badges";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const NETWORK_CATEGORIES = [
  "Open Port Review",
  "Firewall Audit",
  "Network Misconfiguration",
  "Suspicious Traffic",
  "Router Security",
  "Server Exposure",
  "VPN Access Review",
  "DNS Security",
  "Authentication Logs",
  "Internal Network Scan",
];

const SEV_COLORS: Record<string, string> = {
  low: "var(--sev-low)",
  medium: "var(--sev-medium)",
  high: "var(--sev-high)",
  critical: "var(--sev-critical)",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "var(--status-pending)",
  in_progress: "var(--status-progress)",
  under_review: "var(--status-review)",
  resolved: "var(--status-resolved)",
};

type Route = {
  path: string;
  search: URLSearchParams;
};

function getRoute(): Route {
  if (typeof window === "undefined") return { path: "/", search: new URLSearchParams() };
  return { path: window.location.pathname, search: new URLSearchParams(window.location.search) };
}

export default function App({ clerkEnabled }: { clerkEnabled: boolean }) {
  const [route, setRoute] = useState<Route>(getRoute);

  useEffect(() => {
    const onPop = () => setRoute(getRoute());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, "", path);
    setRoute(getRoute());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <ThreatDeskProvider>
      {clerkEnabled ? (
        <>
          <SignedIn>
            <AppRouter route={route} navigate={navigate} clerkEnabled />
          </SignedIn>
          <SignedOut>
            <PublicRouter route={route} navigate={navigate} clerkEnabled />
          </SignedOut>
        </>
      ) : (
        <AppRouter route={route} navigate={navigate} clerkEnabled={false} />
      )}
      <Toaster richColors theme="dark" position="top-right" />
    </ThreatDeskProvider>
  );
}

function PublicRouter({ route, navigate, clerkEnabled }: { route: Route; navigate: (path: string) => void; clerkEnabled: boolean }) {
  if (route.path.startsWith("/signup")) return <SignupPage navigate={navigate} clerkEnabled={clerkEnabled} />;
  if (route.path.startsWith("/login") || isPrivatePath(route.path)) {
    return <LoginPage route={route} navigate={navigate} clerkEnabled={clerkEnabled} />;
  }
  return <Landing navigate={navigate} />;
}

function AppRouter({ route, navigate, clerkEnabled }: { route: Route; navigate: (path: string) => void; clerkEnabled: boolean }) {
  const { role, setRole, me } = useThreatDesk();
  const { user } = useUser();
  const userName = clerkEnabled
    ? user?.fullName || user?.primaryEmailAddress?.emailAddress || me.name
    : me.name;

  useEffect(() => {
    const roleParam = route.search.get("role");
    if (roleParam === "admin" || roleParam === "member") setRole(roleParam);
  }, [route.search, setRole]);

  if (route.path === "/login" || route.path.startsWith("/login/")) {
    return <LoginPage route={route} navigate={navigate} clerkEnabled={clerkEnabled} />;
  }
  if (route.path === "/signup" || route.path.startsWith("/signup/")) {
    return <SignupPage navigate={navigate} clerkEnabled={clerkEnabled} />;
  }
  if (route.path === "/") return <Landing navigate={navigate} />;

  if (!isPrivatePath(route.path)) return <NotFound navigate={navigate} />;

  return (
    <AppShell
      role={role}
      userName={userName}
      pathname={route.path}
      navigate={navigate}
      logout={() => navigate("/")}
      clerkEnabled={clerkEnabled}
    >
      <PrivatePage path={route.path} navigate={navigate} role={role} />
    </AppShell>
  );
}

function isPrivatePath(path: string) {
  return ["/dashboard", "/projects", "/tasks", "/team", "/analytics", "/settings", "/profile", "/admin", "/member"].some((p) => path === p || path.startsWith(`${p}/`));
}

function PrivatePage({ path, navigate, role }: { path: string; navigate: (path: string) => void; role: Role }) {
  if (path === "/admin") return <DashboardPage navigate={navigate} forcedRole="admin" />;
  if (path === "/member") return <DashboardPage navigate={navigate} forcedRole="member" />;
  if (path === "/dashboard") return <DashboardPage navigate={navigate} />;
  if (path === "/projects") return role === "admin" ? <ProjectsPage /> : <DashboardPage navigate={navigate} />;
  if (path === "/tasks") return <TasksPage navigate={navigate} />;
  if (path.startsWith("/tasks/")) return <TaskDetail id={decodeURIComponent(path.replace("/tasks/", ""))} navigate={navigate} />;
  if (path === "/team") return role === "admin" ? <TeamPage /> : <ProfilePage />;
  if (path === "/analytics") return role === "admin" ? <AnalyticsPage /> : <DashboardPage navigate={navigate} />;
  if (path === "/settings") return <SettingsPage />;
  if (path === "/profile") return <ProfilePage />;
  return <NotFound navigate={navigate} />;
}

function Landing({ navigate }: { navigate: (path: string) => void }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="font-mono text-lg font-semibold tracking-tight">ThreatDesk</span>
          </button>
          <nav className="flex items-center gap-2">
            <button onClick={() => navigate("/signup")} className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
              Sign up
            </button>
            <button onClick={() => navigate("/login?role=admin")} className="td-glow inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
              Login <ArrowRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </header>
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-mono text-xs text-muted-foreground">
              <span className="h-2 w-2 animate-pulse rounded-full bg-status-resolved" /> SOC ops · live
            </span>
            <h1 className="mt-5 font-mono text-5xl font-semibold leading-tight tracking-tight text-foreground md:text-6xl">
              Security workflow <br />for <span className="text-primary">modern cyber teams</span>.
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
              Assign, track, and resolve network security tasks through a centralized operations dashboard. Built for internal security leads and the analysts who close findings.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => navigate("/login?role=admin")} className="td-glow inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90">
                <ShieldCheck className="h-4 w-4" /> Login as Admin
              </button>
              <button onClick={() => navigate("/login?role=member")} className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-3 font-medium text-foreground hover:bg-accent">
                <Activity className="h-4 w-4" /> Login as Member
              </button>
            </div>
            <p className="mt-3 font-mono text-[11px] text-muted-foreground">Demo state persists in this browser for reliable Railway assessment.</p>
          </div>
          <DashboardPreview />
        </div>
      </section>
      <Features />
      <Workflow />
      <Footer navigate={navigate} />
    </div>
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
        {[{ label: "Active", value: 3, color: "text-status-progress" }, { label: "Critical", value: 1, color: "text-sev-critical" }, { label: "Resolved", value: 1, color: "text-status-resolved" }].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-background/40 p-3">
            <div className="font-mono text-[10px] uppercase text-muted-foreground">{s.label}</div>
            <div className={`mt-1 font-mono text-2xl ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {["Open Port Exposure Review", "Firewall Rule Audit", "Internal Network Scan Review", "DNS Record Drift Check"].map((title, i) => (
          <div key={title} className="flex items-center justify-between rounded-md border border-border bg-background/40 px-3 py-2 text-sm">
            <div className="flex items-center gap-3">
              <span className={`h-2 w-2 rounded-full ${i === 2 ? "bg-sev-critical" : i === 0 ? "bg-sev-high" : i === 1 ? "bg-sev-medium" : "bg-sev-low"}`} />
              <span className="text-foreground">{title}</span>
            </div>
            <span className="font-mono text-[10px] uppercase text-muted-foreground">{i === 3 ? "resolved" : "active"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Features() {
  const items = [
    { icon: Network, title: "Network vulnerability tracking", body: "Capture open ports, exposure findings, and misconfigurations as actionable tasks tied to projects." },
    { icon: GitBranch, title: "Role-based assignment", body: "Security Leads dispatch work to analysts. Members see only their queue with severity and deadlines." },
    { icon: Radar, title: "Team progress monitoring", body: "Watch analyst queues, in-flight investigations, and resolved findings from one operations view." },
    { icon: Activity, title: "Security analytics", body: "Severity breakdowns, status charts, and an activity log update as findings move through review." },
  ];
  return (
    <section className="border-t border-border/50 bg-background/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-mono text-3xl tracking-tight">Everything a network security workflow needs.</h2>
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
    { n: "01", title: "Lead creates the task", body: "Severity, priority, due date, and network category." },
    { n: "02", title: "Analyst investigates", body: "Updates status and logs findings as notes." },
    { n: "03", title: "Lead reviews & resolves", body: "Status moves to resolved; analytics reflect the close." },
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

function Footer({ navigate }: { navigate: (path: string) => void }) {
  return (
    <footer className="border-t border-border/50 px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2"><Lock className="h-4 w-4" /> ThreatDesk assessment build</div>
        <button onClick={() => navigate("/login?role=admin")} className="text-primary hover:underline">Open console</button>
      </div>
    </footer>
  );
}

function LoginPage({ route, navigate, clerkEnabled }: { route: Route; navigate: (path: string) => void; clerkEnabled: boolean }) {
  const { setRole } = useThreatDesk();
  const role = route.search.get("role") === "member" ? "member" : "admin";
  useEffect(() => setRole(role), [role, setRole]);

  const demoLogin = (nextRole: Role) => {
    setRole(nextRole);
    navigate("/dashboard");
    toast.success(`Demo ${nextRole === "admin" ? "admin" : "member"} session started`);
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between border-r border-border bg-sidebar p-12 md:flex">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-left">
          <ShieldCheck className="h-5 w-5 text-primary" /> <span className="font-mono text-lg">ThreatDesk</span>
        </button>
        <div>
          <h2 className="font-mono text-3xl leading-tight">One console for your <span className="text-primary">network security</span> ops.</h2>
          <p className="mt-3 max-w-md text-muted-foreground">Sign in to triage findings, update task status, and keep your security program moving.</p>
          <div className="mt-6 flex gap-2">
            <button onClick={() => navigate("/login?role=admin")} className={`flex-1 rounded-md border px-4 py-3 text-left text-sm transition ${role === "admin" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>
              <ShieldCheck className="mb-1 h-4 w-4" /><div className="font-medium">Login as Admin</div><div className="font-mono text-[10px] uppercase tracking-wider">Security Lead</div>
            </button>
            <button onClick={() => navigate("/login?role=member")} className={`flex-1 rounded-md border px-4 py-3 text-left text-sm transition ${role === "member" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>
              <Activity className="mb-1 h-4 w-4" /><div className="font-medium">Login as Member</div><div className="font-mono text-[10px] uppercase tracking-wider">Analyst</div>
            </button>
          </div>
        </div>
        <p className="font-mono text-xs text-muted-foreground">Railway-ready SPA · no SSR runtime</p>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        {clerkEnabled ? (
          <SignIn routing="path" path="/login" signUpUrl="/signup" fallbackRedirectUrl="/dashboard" forceRedirectUrl="/dashboard" />
        ) : (
          <div className="td-card w-full max-w-sm p-6 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
            <h1 className="mt-3 font-mono text-2xl font-semibold">ThreatDesk demo login</h1>
            <p className="mt-2 text-sm text-muted-foreground">Clerk keys are not configured in this environment, so Railway uses a stable demo session.</p>
            <div className="mt-6 grid gap-3">
              <Button onClick={() => demoLogin("admin")}>Continue as Admin</Button>
              <Button variant="outline" onClick={() => demoLogin("member")}>Continue as Member</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SignupPage({ navigate, clerkEnabled }: { navigate: (path: string) => void; clerkEnabled: boolean }) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between border-r border-border bg-sidebar p-12 md:flex">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-left"><ShieldCheck className="h-5 w-5 text-primary" /><span className="font-mono text-lg">ThreatDesk</span></button>
        <div><h2 className="font-mono text-3xl leading-tight">Provision your <span className="text-primary">analyst account</span>.</h2><p className="mt-3 max-w-md text-muted-foreground">Create an account or use the assessment demo login.</p></div>
        <button onClick={() => navigate("/login?role=admin")} className="font-mono text-xs text-primary">Back to login</button>
      </div>
      <div className="flex items-center justify-center p-8">
        {clerkEnabled ? <SignUp routing="path" path="/signup" signInUrl="/login" fallbackRedirectUrl="/dashboard" forceRedirectUrl="/dashboard" /> : <LoginPage route={{ path: "/login", search: new URLSearchParams("role=admin") }} navigate={navigate} clerkEnabled={false} />}
      </div>
    </div>
  );
}

function DashboardPage({ navigate, forcedRole }: { navigate: (path: string) => void; forcedRole?: Role }) {
  const { analytics, visibleTasks, role } = useThreatDesk();
  const activeRole = forcedRole ?? role;
  const stats = analytics.stats;
  const tasks = visibleTasks.slice(0, 6);
  return (
    <div className="px-6 py-8 md:px-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-semibold tracking-tight">{activeRole === "admin" ? "Operations overview" : "My security queue"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{activeRole === "admin" ? "Live status of every active investigation across the team." : "Findings assigned to you. Triage, investigate, resolve."}</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/tasks")}>View all tasks</Button>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total tasks" value={stats.total} icon={ListChecks} tone="info" />
        <StatCard label="Critical issues" value={stats.critical} icon={AlertTriangle} tone="critical" />
        <StatCard label="In progress" value={stats.in_progress} icon={Activity} tone="info" />
        <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} tone="good" />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Under review" value={stats.under_review} />
        <StatCard label="Overdue" value={stats.overdue} tone="warning" icon={Clock4} />
        <StatCard label="Active vulnerabilities" value={stats.in_progress + stats.under_review} icon={ShieldAlert} />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="td-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between"><h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Recent tasks</h2><button onClick={() => navigate("/tasks")} className="text-xs text-primary hover:underline">See all →</button></div>
          <div className="mt-4 divide-y divide-border">
            {tasks.map((t) => <button key={t.id} onClick={() => navigate(`/tasks/${t.id}`)} className="flex w-full items-center justify-between gap-4 py-3 text-left text-sm hover:opacity-90"><div className="min-w-0"><div className="truncate font-medium">{t.title}</div><div className="font-mono text-[11px] text-muted-foreground">{t.category}{t.assignee ? ` · ${t.assignee.name}` : " · unassigned"}</div></div><div className="flex shrink-0 items-center gap-2"><SeverityBadge value={t.severity} /><StatusBadge value={t.status} /></div></button>)}
          </div>
        </div>
        <RecentActivity />
      </div>
    </div>
  );
}

function TasksPage({ navigate }: { navigate: (path: string) => void }) {
  const { visibleTasks, role, deleteTask } = useThreatDesk();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const filtered = visibleTasks.filter((t) => (filter === "all" || t.status === filter) && `${t.title} ${t.category} ${t.assignee?.name ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const isAdmin = role === "admin";
  return (
    <div className="px-6 py-8 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-mono text-2xl font-semibold tracking-tight">{isAdmin ? "All tasks" : "My tasks"}</h1><p className="mt-1 text-sm text-muted-foreground">{isAdmin ? "Every finding across active projects." : "Findings assigned to you. Click a row to investigate."}</p></div><div className="flex flex-wrap items-center gap-2"><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks" className="w-44" /><Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="under_review">Under Review</SelectItem><SelectItem value="resolved">Resolved</SelectItem></SelectContent></Select>{isAdmin && <NewTaskDialog />}</div></div>
      <div className="td-card mt-6 overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="border-b border-border bg-background/40 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-4 py-3 text-left">Title</th><th className="px-4 py-3 text-left">Category</th><th className="px-4 py-3 text-left">Assignee</th><th className="px-4 py-3 text-left">Severity</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Due</th>{isAdmin && <th className="px-4 py-3" />}</tr></thead><tbody className="divide-y divide-border">{filtered.length === 0 ? <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No tasks match this filter.</td></tr> : filtered.map((t) => <tr key={t.id} className="transition-colors hover:bg-accent/40"><td className="px-4 py-3"><button onClick={() => navigate(`/tasks/${t.id}`)} className="font-medium text-foreground hover:text-primary">{t.title}</button>{t.project ? <div className="font-mono text-[10px] text-muted-foreground">{t.project.name}</div> : null}</td><td className="px-4 py-3 text-muted-foreground">{t.category}</td><td className="px-4 py-3 text-muted-foreground">{t.assignee?.name ?? <span className="italic">unassigned</span>}</td><td className="px-4 py-3"><SeverityBadge value={t.severity} /></td><td className="px-4 py-3"><StatusBadge value={t.status} /></td><td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.due_date}</td>{isAdmin && <td className="px-4 py-3 text-right"><button onClick={() => { deleteTask(t.id); toast.success("Task deleted"); }} className="rounded p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive" aria-label={`Delete ${t.title}`}><Trash2 className="h-4 w-4" /></button></td>}</tr>)}</tbody></table></div>
    </div>
  );
}

function NewTaskDialog() {
  const { createTask, projects, users } = useThreatDesk();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: NETWORK_CATEGORIES[0], severity: "medium" as Severity, priority: "medium" as Priority, project_id: "", assigned_to: "u-member", due_date: new Date().toISOString().slice(0, 10) });
  const submit = () => { if (form.title.trim().length < 3) return toast.error("Title is required"); createTask({ ...form, project_id: form.project_id || null, assigned_to: form.assigned_to || null }); toast.success("Task created"); setOpen(false); setForm({ ...form, title: "", description: "" }); };
  return (
    <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="gap-1.5"><Plus className="h-4 w-4" /> New task</Button></DialogTrigger><DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto"><DialogHeader><DialogTitle>New security task</DialogTitle><DialogDescription>Create a network or vulnerability task and assign it to an analyst.</DialogDescription></DialogHeader><form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); submit(); }}><div className="grid gap-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Open Port Exposure Review" required /></div><div className="grid gap-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Findings, scope, or initial direction…" rows={3} /></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><SelectField label="Category" value={form.category} onValueChange={(v) => setForm({ ...form, category: v })} options={NETWORK_CATEGORIES.map((c) => [c, c])} /><SelectField label="Project" value={form.project_id || "_none"} onValueChange={(v) => setForm({ ...form, project_id: v === "_none" ? "" : v })} options={[["_none", "No project"], ...projects.map((p) => [p.id, p.name])]} /><SelectField label="Severity" value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v as Severity })} options={[["low", "Low"], ["medium", "Medium"], ["high", "High"], ["critical", "Critical"]]} /><SelectField label="Priority" value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Priority })} options={[["low", "Low"], ["medium", "Medium"], ["high", "High"], ["critical", "Critical"]]} /><SelectField label="Assignee" value={form.assigned_to || "_none"} onValueChange={(v) => setForm({ ...form, assigned_to: v === "_none" ? "" : v })} options={[["_none", "Unassigned"], ...users.map((u) => [u.id, `${u.name} (${u.role})`])]} /><div className="grid gap-1.5"><Label>Due date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Create task</Button></DialogFooter></form></DialogContent></Dialog>
  );
}

function SelectField({ label, value, onValueChange, options }: { label: string; value: string; onValueChange: (v: string) => void; options: string[][] }) {
  return <div className="grid gap-1.5"><Label>{label}</Label><Select value={value} onValueChange={onValueChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{options.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>;
}

function TaskDetail({ id, navigate }: { id: string; navigate: (path: string) => void }) {
  const { getTaskBundle, updateTaskStatus, addNote, assignTask, users, role } = useThreatDesk();
  const [note, setNote] = useState("");
  const bundle = getTaskBundle(id);
  if (!bundle) return <div className="px-10 py-12 text-muted-foreground">Task not found.</div>;
  const { task, notes, logs } = bundle;
  const isAdmin = role === "admin";
  return (
    <div className="px-6 py-8 md:px-10"><button onClick={() => navigate("/tasks")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to tasks</button><div className="mt-4 grid gap-6 lg:grid-cols-3"><div className="space-y-6 lg:col-span-2"><div className="td-card p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{task.category}{task.project ? ` · ${task.project.name}` : ""}</div><h1 className="mt-1 font-mono text-2xl font-semibold tracking-tight">{task.title}</h1></div><div className="flex items-center gap-2"><SeverityBadge value={task.severity} /><StatusBadge value={task.status} /></div></div><p className="mt-4 whitespace-pre-line text-sm text-muted-foreground">{task.description || "No description provided."}</p></div><div className="td-card p-6"><h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Investigation notes</h2><form onSubmit={(e) => { e.preventDefault(); if (!note.trim()) return; addNote(task.id, note); setNote(""); toast.success("Note added"); }} className="mt-4 space-y-2"><Textarea placeholder="Add a finding, evidence, or next-step note…" value={note} onChange={(e) => setNote(e.target.value)} rows={3} /><div className="flex justify-end"><Button type="submit" className="gap-1.5"><MessageSquarePlus className="h-4 w-4" />Post note</Button></div></form><div className="mt-4 space-y-3">{notes.length === 0 ? <div className="py-6 text-center font-mono text-xs uppercase tracking-wider text-muted-foreground">No notes yet.</div> : notes.map((n) => <div key={n.id} className="rounded-md border border-border bg-background/40 p-3"><div className="font-mono text-[11px] text-muted-foreground">{n.author?.name ?? "system"} · {new Date(n.created_at).toLocaleString()}</div><p className="mt-1 whitespace-pre-line text-sm">{n.note}</p></div>)}</div></div></div><div className="space-y-6"><div className="td-card p-6"><h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Status</h2><Select value={task.status} onValueChange={(v) => { updateTaskStatus(task.id, v as Status); toast.success("Status updated"); }}><SelectTrigger className="mt-3"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="under_review">Under Review</SelectItem><SelectItem value="resolved">Resolved</SelectItem></SelectContent></Select><div className="mt-6 space-y-3 text-sm"><Field label="Priority" value={cap(task.priority)} /><Field label="Due date" value={task.due_date} /><Field label="Assignee" value={task.assignee?.name ?? "Unassigned"} /><Field label="Created by" value={task.creator?.name ?? "—"} /></div>{isAdmin && <div className="mt-6"><div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Reassign</div><Select value={task.assignee?.id ?? "_none"} onValueChange={(v) => { assignTask(task.id, v === "_none" ? null : v); toast.success("Assignment updated"); }}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="_none">Unassigned</SelectItem>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name} ({u.role})</SelectItem>)}</SelectContent></Select></div>}</div><div className="td-card p-6"><h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Activity</h2><div className="mt-3 space-y-2">{logs.length === 0 ? <div className="py-3 text-xs text-muted-foreground">No activity recorded.</div> : logs.map((l) => <div key={l.id} className="text-sm"><div className="text-foreground">{l.action}</div><div className="font-mono text-[11px] text-muted-foreground">{l.actor?.name ?? "system"} · {new Date(l.created_at).toLocaleString()}</div></div>)}</div></div></div></div></div>
  );
}

function ProjectsPage() {
  const { projects, createProject } = useThreatDesk();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  return <div className="px-6 py-8 md:px-10"><div className="flex items-end justify-between gap-4"><div><h1 className="font-mono text-2xl font-semibold tracking-tight">Projects</h1><p className="mt-1 text-sm text-muted-foreground">Group related security work — audits, reviews, assessments.</p></div><Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="gap-1.5"><Plus className="h-4 w-4" /> New project</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>New project</DialogTitle></DialogHeader><form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); if (form.name.trim().length < 2) return toast.error("Name required"); createProject(form); toast.success("Project created"); setOpen(false); setForm({ name: "", description: "" }); }}><div className="grid gap-1.5"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Q3 Network Audit" /></div><div className="grid gap-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div><DialogFooter><Button type="submit">Create project</Button></DialogFooter></form></DialogContent></Dialog></div><div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{projects.map((p) => <div key={p.id} className="td-card p-5"><FolderKanban className="h-5 w-5 text-primary" /><h3 className="mt-3 font-semibold">{p.name}</h3><p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{p.description || "No description."}</p><div className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Created {new Date(p.created_at).toLocaleDateString()}</div></div>)}</div></div>;
}

function AnalyticsPage() {
  const { analytics } = useThreatDesk();
  return <div className="px-6 py-8 md:px-10"><h1 className="font-mono text-2xl font-semibold tracking-tight">Security analytics</h1><p className="mt-1 text-sm text-muted-foreground">Posture indicators across all open and resolved findings.</p><div className="mt-6 grid gap-4 lg:grid-cols-2"><div className="td-card p-5"><h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Severity breakdown</h2><div className="mt-4 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.severityBreakdown}><XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} /><YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} /><Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} /><Bar dataKey="value" radius={[4, 4, 0, 0]}>{analytics.severityBreakdown.map((d) => <Cell key={d.name} fill={SEV_COLORS[d.name]} />)}</Bar></BarChart></ResponsiveContainer></div></div><div className="td-card p-5"><h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Status distribution</h2><div className="mt-4 h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={analytics.statusBreakdown} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>{analytics.statusBreakdown.map((d) => <Cell key={d.name} fill={STATUS_COLORS[d.name]} />)}</Pie><Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} /></PieChart></ResponsiveContainer></div><div className="mt-3 flex flex-wrap gap-3 text-xs">{Object.entries(STATUS_COLORS).map(([k, v]) => <div key={k} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: v }} /><span className="capitalize text-muted-foreground">{k.replace("_", " ")}</span></div>)}</div></div></div><div className="td-card mt-6 p-5"><RecentActivity /></div></div>;
}

function RecentActivity() {
  const { analytics } = useThreatDesk();
  return <div className="td-card p-5"><h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Recent activity</h2><div className="mt-4 space-y-3">{analytics.recent.length === 0 ? <div className="py-8 text-center text-sm text-muted-foreground">No activity yet.</div> : analytics.recent.slice(0, 8).map((a) => <div key={a.id} className="text-sm"><div className="text-foreground">{a.action}</div><div className="font-mono text-[11px] text-muted-foreground">{a.actor?.name ?? "system"}{a.task ? ` · ${a.task.title}` : ""}</div></div>)}</div></div>;
}

function TeamPage() {
  const { users } = useThreatDesk();
  return <div className="px-6 py-8 md:px-10"><h1 className="font-mono text-2xl font-semibold tracking-tight">Team</h1><p className="mt-1 text-sm text-muted-foreground">Everyone with access to the ThreatDesk operations console.</p><div className="td-card mt-6 overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead className="border-b border-border bg-background/40 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-4 py-3 text-left">Member</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Role</th><th className="px-4 py-3 text-left">Joined</th></tr></thead><tbody className="divide-y divide-border">{users.map((u) => <tr key={u.id}><td className="px-4 py-3"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">{u.role === "admin" ? <ShieldCheck className="h-4 w-4 text-primary" /> : <User className="h-4 w-4" />}</div><span className="font-medium">{u.name}</span></div></td><td className="px-4 py-3 text-muted-foreground">{u.email}</td><td className="px-4 py-3"><span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{u.role === "admin" ? "Security Lead" : "Analyst"}</span></td><td className="px-4 py-3 font-mono text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div></div>;
}

function ProfilePage() {
  const { me, analytics } = useThreatDesk();
  return <div className="px-6 py-8 md:px-10"><h1 className="font-mono text-2xl font-semibold tracking-tight">Profile</h1><div className="td-card mt-6 max-w-xl p-6"><div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground"><User className="h-6 w-6" /></div><div><div className="text-lg font-semibold">{me.name}</div><div className="text-sm text-muted-foreground">{me.email}</div><div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{me.role === "admin" ? "Security Lead" : "Analyst"}</div></div></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="Assigned" value={analytics.stats.total} /><StatCard label="In progress" value={analytics.stats.in_progress} tone="info" /><StatCard label="Resolved" value={analytics.stats.resolved} tone="good" /><StatCard label="Critical" value={analytics.stats.critical} tone="critical" /></div></div>;
}

function SettingsPage() {
  const { me, role, setRole } = useThreatDesk();
  return <div className="px-6 py-8 md:px-10"><h1 className="font-mono text-2xl font-semibold tracking-tight">Settings</h1><div className="td-card mt-6 max-w-xl p-6"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-primary" /><h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Account</h2></div><dl className="mt-4 space-y-3 text-sm"><Field label="Name" value={me.name} /><Field label="Email" value={me.email} /><Field label="Role" value={me.role === "admin" ? "Security Lead (Admin)" : "Analyst (Member)"} /></dl><div className="mt-6 grid gap-2 sm:grid-cols-2"><Button variant={role === "admin" ? "default" : "outline"} onClick={() => setRole("admin")}>Use Admin View</Button><Button variant={role === "member" ? "default" : "outline"} onClick={() => setRole("member")}>Use Member View</Button></div></div></div>;
}

function NotFound({ navigate }: { navigate: (path: string) => void }) {
  return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="max-w-md text-center"><h1 className="font-mono text-7xl font-bold text-primary">404</h1><h2 className="mt-4 text-xl font-semibold text-foreground">Signal lost</h2><p className="mt-2 text-sm text-muted-foreground">That route is not in the threat map.</p><Button className="mt-6" onClick={() => navigate("/")}>Return to base</Button></div></div>;
}

function Field({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3 border-b border-border/60 py-2"><dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt><dd className="text-right">{value}</dd></div>;
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ");
}
