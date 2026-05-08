import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  getTask,
  updateTaskStatus,
  addNote,
  assignTask,
  listUsers,
  getMe,
} from "@/lib/threatdesk.functions";
import { SeverityBadge, StatusBadge } from "@/components/threatdesk/badges";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, MessageSquarePlus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tasks/$id")({
  head: () => ({ meta: [{ title: "Task — ThreatDesk" }] }),
  component: TaskDetail,
});

function TaskDetail() {
  const { id } = Route.useParams();
  const fetchTask = useServerFn(getTask);
  const fetchMe = useServerFn(getMe);
  const fetchUsers = useServerFn(listUsers);
  const updateStatus = useServerFn(updateTaskStatus);
  const reassign = useServerFn(assignTask);
  const postNote = useServerFn(addNote);
  const qc = useQueryClient();
  const [note, setNote] = useState("");

  const taskQ = useQuery({ queryKey: ["task", id], queryFn: () => fetchTask({ data: { id } }) });
  const meQ = useQuery({ queryKey: ["me"], queryFn: () => fetchMe(), staleTime: 60_000 });
  const usersQ = useQuery({
    queryKey: ["users"],
    queryFn: () => fetchUsers(),
    enabled: meQ.data?.role === "admin",
  });

  const statusMut = useMutation({
    mutationFn: (status: string) => updateStatus({ data: { id, status: status as any } }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["task", id] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to update status"),
  });

  const assignMut = useMutation({
    mutationFn: (uid: string | null) => reassign({ data: { id, assigned_to: uid } }),
    onSuccess: () => {
      toast.success("Assignment updated");
      qc.invalidateQueries({ queryKey: ["task", id] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const noteMut = useMutation({
    mutationFn: () => postNote({ data: { task_id: id, note } }),
    onSuccess: () => {
      toast.success("Note added");
      setNote("");
      qc.invalidateQueries({ queryKey: ["task", id] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (taskQ.isLoading) {
    return (
      <div className="px-6 py-10 md:px-10">
        <div className="td-card h-64 animate-pulse" />
      </div>
    );
  }
  if (taskQ.error || !taskQ.data) {
    return <div className="px-10 py-12 text-muted-foreground">Task not found.</div>;
  }

  const { task, notes, logs } = taskQ.data as any;
  const isAdmin = meQ.data?.role === "admin";

  return (
    <div className="px-6 py-8 md:px-10">
      <Link
        to="/tasks"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to tasks
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="td-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {task.category} {task.project ? ` · ${task.project.name}` : ""}
                </div>
                <h1 className="mt-1 font-mono text-2xl font-semibold tracking-tight">
                  {task.title}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <SeverityBadge value={task.severity} />
                <StatusBadge value={task.status} />
              </div>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm text-muted-foreground">
              {task.description || "No description provided."}
            </p>
          </div>

          <div className="td-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
                Investigation notes
              </h2>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (note.trim().length === 0) return;
                noteMut.mutate();
              }}
              className="mt-4 space-y-2"
            >
              <Textarea
                placeholder="Add a finding, evidence, or next-step note…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={noteMut.isPending} className="gap-1.5">
                  <MessageSquarePlus className="h-4 w-4" />
                  {noteMut.isPending ? "Posting…" : "Post note"}
                </Button>
              </div>
            </form>
            <div className="mt-4 space-y-3">
              {notes.length === 0 ? (
                <div className="py-6 text-center font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  No notes yet.
                </div>
              ) : (
                notes.map((n: any) => (
                  <div key={n.id} className="rounded-md border border-border bg-background/40 p-3">
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {n.author?.name ?? "system"} ·{" "}
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                    <p className="mt-1 whitespace-pre-line text-sm">{n.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="td-card p-6">
            <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
              Status
            </h2>
            <Select
              value={task.status}
              onValueChange={(v) => statusMut.mutate(v)}
            >
              <SelectTrigger className="mt-3"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            <div className="mt-6 space-y-3 text-sm">
              <Field label="Priority" value={cap(task.priority)} />
              <Field label="Due date" value={task.due_date ?? "—"} />
              <Field
                label="Assignee"
                value={task.assignee?.name ?? "Unassigned"}
              />
              <Field label="Created by" value={task.creator?.name ?? "—"} />
            </div>

            {isAdmin && (
              <div className="mt-6">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Reassign
                </div>
                <Select
                  value={task.assignee?.id ?? "_none"}
                  onValueChange={(v) => assignMut.mutate(v === "_none" ? null : v)}
                >
                  <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Unassigned</SelectItem>
                    {(usersQ.data ?? []).map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="td-card p-6">
            <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
              Activity
            </h2>
            <div className="mt-3 space-y-2">
              {logs.length === 0 ? (
                <div className="py-3 text-xs text-muted-foreground">No activity recorded.</div>
              ) : (
                logs.map((l: any) => (
                  <div key={l.id} className="text-sm">
                    <div className="text-foreground">{l.action}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {l.actor?.name ?? "system"} ·{" "}
                      {new Date(l.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
