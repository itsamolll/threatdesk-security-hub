import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  listTasks,
  createTask,
  listProjects,
  listUsers,
  getMe,
  deleteTask,
} from "@/lib/threatdesk.functions";
import { SeverityBadge, StatusBadge } from "@/components/threatdesk/badges";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

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

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({ meta: [{ title: "Tasks — ThreatDesk" }] }),
  component: TasksPage,
});

function TasksPage() {
  const fetchTasks = useServerFn(listTasks);
  const fetchMe = useServerFn(getMe);
  const tasksQ = useQuery({ queryKey: ["tasks"], queryFn: () => fetchTasks() });
  const meQ = useQuery({ queryKey: ["me"], queryFn: () => fetchMe(), staleTime: 60_000 });
  const isAdmin = meQ.data?.role === "admin";

  const [filter, setFilter] = useState<string>("all");
  const filtered = (tasksQ.data ?? []).filter((t: any) =>
    filter === "all" ? true : t.status === filter,
  );

  return (
    <div className="px-6 py-8 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-semibold tracking-tight">
            {isAdmin ? "All tasks" : "My tasks"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin
              ? "Every finding across active projects."
              : "Findings assigned to you. Click a row to investigate."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && <NewTaskDialog />}
        </div>
      </div>

      <div className="td-card mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-background/40 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Assignee</th>
              <th className="px-4 py-3 text-left">Severity</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Due</th>
              {isAdmin && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasksQ.isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  No tasks match this filter.
                </td>
              </tr>
            ) : (
              filtered.map((t: any) => (
                <tr key={t.id} className="transition-colors hover:bg-accent/40">
                  <td className="px-4 py-3">
                    <Link
                      to="/tasks/$id"
                      params={{ id: t.id }}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {t.title}
                    </Link>
                    {t.project ? (
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {t.project.name}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t.category}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.assignee?.name ?? <span className="italic">unassigned</span>}
                  </td>
                  <td className="px-4 py-3"><SeverityBadge value={t.severity} /></td>
                  <td className="px-4 py-3"><StatusBadge value={t.status} /></td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {t.due_date ?? "—"}
                  </td>
                  {isAdmin && <td className="px-4 py-3 text-right"><DeleteBtn id={t.id} /></td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeleteBtn({ id }: { id: string }) {
  const fn = useServerFn(deleteTask);
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => fn({ data: { id } }),
    onSuccess: () => {
      toast.success("Task deleted");
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to delete"),
  });
  return (
    <button
      onClick={() => m.mutate()}
      className="rounded p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

function NewTaskDialog() {
  const [open, setOpen] = useState(false);
  const fetchProjects = useServerFn(listProjects);
  const fetchUsers = useServerFn(listUsers);
  const create = useServerFn(createTask);
  const qc = useQueryClient();

  const projects = useQuery({ queryKey: ["projects"], queryFn: () => fetchProjects() });
  const users = useQuery({ queryKey: ["users"], queryFn: () => fetchUsers() });

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: NETWORK_CATEGORIES[0],
    severity: "medium",
    priority: "medium",
    project_id: "",
    assigned_to: "",
    due_date: new Date().toISOString().slice(0, 10),
  });

  const m = useMutation({
    mutationFn: () =>
      create({
        data: {
          title: form.title,
          description: form.description,
          category: form.category,
          severity: form.severity as any,
          priority: form.priority as any,
          project_id: form.project_id || null,
          assigned_to: form.assigned_to || null,
          due_date: form.due_date,
        },
      }),
    onSuccess: () => {
      toast.success("Task created");
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      setOpen(false);
      setForm({ ...form, title: "", description: "" });
    },
    onError: (e: any) => toast.error(e.message || "Failed to create task"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Plus className="h-4 w-4" /> New task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New security task</DialogTitle>
          <DialogDescription>
            Create a network or vulnerability task and assign it to an analyst.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (form.title.trim().length < 3) return toast.error("Title is required");
            if (!form.due_date) return toast.error("Due date is required");
            m.mutate();
          }}
        >
          <div className="grid gap-1.5">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Open Port Exposure Review"
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Findings, scope, or initial direction…"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NETWORK_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Project</Label>
              <Select
                value={form.project_id || "_none"}
                onValueChange={(v) =>
                  setForm({ ...form, project_id: v === "_none" ? "" : v })
                }
              >
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">No project</SelectItem>
                  {(projects.data ?? []).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Severity</Label>
              <Select
                value={form.severity}
                onValueChange={(v) => setForm({ ...form, severity: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Assignee</Label>
              <Select
                value={form.assigned_to || "_none"}
                onValueChange={(v) =>
                  setForm({ ...form, assigned_to: v === "_none" ? "" : v })
                }
              >
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Unassigned</SelectItem>
                  {(users.data ?? []).map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Due date</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={m.isPending}>
              {m.isPending ? "Creating…" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
