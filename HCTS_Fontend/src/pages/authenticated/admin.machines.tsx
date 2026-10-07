import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getMachine,
  createMachine,
  updateMachine,
  getMachineOperators,
  assignWorkersToMachine,
  removeWorkerFromMachine,
} from "@/apis/machine.operators";
import { getAllWorkers } from "@/apis/companies&worker";
import {
  MasterList,
  extractList,
  idOf,
  type CrudApi,
  type Option,
} from "@/components/admin/crud-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Users, Trash2, Plus, Search } from "lucide-react";

const MACHINE_API: CrudApi = {
  fetchAll: getMachine,
  create: createMachine,
  update: updateMachine,
};

function MachinesPage() {
  const [opMachine, setOpMachine] = useState<any | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Machines &amp; Operators</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Machine master data and the workers who are their standing operators.
        </p>
      </div>

      <MasterList
        api={MACHINE_API}
        config={{
          title: "Machines",
          serverMode: true,
          hasStatus: true,
          searchColumns: ["name", "internalCode", "licensePlateOrInternalId"],
          rowActions: [
            {
              icon: <Users className="h-4 w-4" />,
              tooltip: "Manage operators",
              onClick: (row) => setOpMachine(row),
            },
          ],
          columns: [
            { key: "internalCode", header: "Code" },
            { key: "name", header: "Name" },
            { key: "machineType", header: "Type" },
            { key: "licensePlateOrInternalId", header: "Plate / ID" },
          ],
          fields: [
            { name: "name", label: "Name", kind: "text", required: true },
            {
              name: "machineType",
              label: "Type",
              kind: "text",
              required: true,
              placeholder: "Tractor, forklift, truck…",
            },
            { name: "licensePlateOrInternalId", label: "License plate / internal ID", kind: "text" },
            { name: "comments", label: "Comments", kind: "textarea" },
          ],
        }}
      />

      <OperatorsSheet machine={opMachine} onClose={() => setOpMachine(null)} />
    </div>
  );
}

function OperatorsSheet({ machine, onClose }: { machine: any | null; onClose: () => void }) {
  const open = !!machine;
  const machineId = machine ? idOf(machine) : "";

  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState<Option[]>([]);
  const [workersLoading, setWorkersLoading] = useState(false);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [workerSearch, setWorkerSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!machineId) return;
    setLoading(true);
    try {
      const res = await getMachineOperators(machineId);
      setOperators(extractList(res));
    } catch (e: any) {
      toast.error(e?.message || "Unable to load operators");
    } finally {
      setLoading(false);
    }
  }, [machineId]);

  useEffect(() => {
    if (open) {
      setSelectedWorkers([]);
      setWorkerSearch("");
      setDebouncedSearch("");
      load();
    }
  }, [open, load]);

  // Debounce the worker search box.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(workerSearch), 350);
    return () => clearTimeout(t);
  }, [workerSearch]);

  // Fetch workers (server-side search) whenever the query changes — scales past
  // the first page instead of loading every worker into a flat list.
  useEffect(() => {
    if (!open) return;
    let active = true;
    setWorkersLoading(true);
    const params: Record<string, any> = { limit: 100 };
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    getAllWorkers(params)
      .then((res) => {
        if (!active) return;
        setWorkers(
          extractList(res).map((w) => ({
            value: idOf(w),
            label: [w.firstName, w.lastName].filter(Boolean).join(" ") || w.documentIdNumber || idOf(w),
          })),
        );
      })
      .catch(() => active && setWorkers([]))
      .finally(() => active && setWorkersLoading(false));
    return () => {
      active = false;
    };
  }, [open, debouncedSearch]);

  const assignedIds = new Set(operators.map((o) => idOf(o.worker)));
  const availableWorkers = workers.filter((w) => !assignedIds.has(w.value));

  const toggleWorker = (id: string) =>
    setSelectedWorkers((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));

  const assign = async () => {
    if (selectedWorkers.length === 0) return toast.error("Select at least one worker");
    setBusy(true);
    try {
      await assignWorkersToMachine(machineId, selectedWorkers);
      toast.success(selectedWorkers.length > 1 ? "Operators assigned" : "Operator assigned");
      setSelectedWorkers([]);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Unable to assign operators");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (workerId: string) => {
    setBusy(true);
    try {
      await removeWorkerFromMachine(machineId, workerId);
      toast.success("Operator removed");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Unable to remove operator");
    } finally {
      setBusy(false);
    }
  };

  const workerName = (w: any) =>
    [w?.firstName, w?.lastName].filter(Boolean).join(" ") || w?.documentIdNumber || "—";

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Operators · {machine?.name}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Assign workers</Label>
              <Button
                type="button"
                size="sm"
                onClick={assign}
                disabled={busy || selectedWorkers.length === 0}
              >
                <Plus className="mr-1 h-4 w-4" />
                Assign{selectedWorkers.length ? ` (${selectedWorkers.length})` : ""}
              </Button>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={workerSearch}
                onChange={(e) => setWorkerSearch(e.target.value)}
                placeholder="Search workers by name or document…"
                className="pl-8"
              />
            </div>
            <div className="max-h-56 space-y-1 overflow-auto rounded-md border p-1">
              {workersLoading ? (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">Searching…</div>
              ) : availableWorkers.length === 0 ? (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                  {debouncedSearch ? "No workers match your search." : "All workers are already assigned."}
                </div>
              ) : (
                availableWorkers.map((w) => (
                  <label
                    key={w.value}
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <Checkbox
                      checked={selectedWorkers.includes(w.value)}
                      onCheckedChange={() => toggleWorker(w.value)}
                    />
                    {w.label}
                  </label>
                ))
              )}
            </div>
            {selectedWorkers.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedWorkers.length} selected — selection is kept while you search.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">
              Assigned operators{" "}
              <Badge variant="secondary" className="ml-1">
                {operators.length}
              </Badge>
            </div>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : operators.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                No operators assigned yet.
              </p>
            ) : (
              <ul className="divide-y rounded-md border">
                {operators.map((o) => (
                  <li key={idOf(o)} className="flex items-center justify-between px-3 py-2">
                    <div className="text-sm">
                      <div className="font-medium">{workerName(o.worker)}</div>
                      {o.worker?.documentIdNumber && (
                        <div className="text-xs text-muted-foreground">{o.worker.documentIdNumber}</div>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => remove(idOf(o.worker))}
                      aria-label="Remove operator"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default MachinesPage;
