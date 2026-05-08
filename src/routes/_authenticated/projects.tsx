import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { listProjects, createProject, getMe } from "@/lib/threatdesk.functions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FolderKanban, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({ meta: [{ title: "Projects — ThreatDesk" }] }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const fetchProjects = useServerFn(listProjects);
  const fetchMe = useServerFn(getMe);
  const create = useServerFn(createProject);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  const projects = useQuery({ queryKey: ["projects"], queryFn: () => fetchProjects() });
  const meQ = useQuery({ queryKey: ["me"], queryFn: () => fetchMe(), staleTime: 60_000 });
  const isAdmin = meQ.data?.role === "admin";

  const m = useMutation({
    mutationFn: () => create({ data: form }),
    onSuccess: () => {
      toast.success("Project created");
      qc.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false);
      setForm({ name: "", description: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="px-6 py-8 md:px-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Group related security work — audits, reviews, assessments.
          </p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5"><Plus className="h-4 w-4" /> New project</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New project</DialogTitle></DialogHeader>
              <form
                className="grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (form.name.trim().length < 2) return toast.error("Name required");
                  m.mutate();
                }}
              >
                <div className="grid gap-1.5">
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Q3 Network Audit"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={m.isPending}>
                    {m.isPending ? "Creating…" : "Create project"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.isLoading ? (
          [0, 1, 2].map((i) => <div key={i} className="td-card h-32 animate-pulse" />)
        ) : projects.data?.length === 0 ? (
          <div className="td-card col-span-full py-12 text-center text-muted-foreground">
            No projects yet.
          </div>
        ) : (
          (projects.data ?? []).map((p: any) => (
            <div key={p.id} className="td-card p-5">
              <FolderKanban className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-semibold">{p.name}</h3>
              <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                {p.description || "No description."}
              </p>
              <div className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Created {new Date(p.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
