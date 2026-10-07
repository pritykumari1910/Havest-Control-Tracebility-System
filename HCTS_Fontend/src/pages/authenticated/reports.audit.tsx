import { useEffect, useState } from "react";
import { useQuery } from "@/lib/useFetch";
import { getAllAudits } from "@/apis/reports";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import buildPageItems from "@/utils/paginationCount";



export function AuditPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [viewing, setViewing] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // Debounce the free-text search.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-log", page, limit, search, startDate, endDate],
    queryFn: async () => {
      return await getAllAudits({
        page,
        limit,
        search: search.trim() || undefined,
        // Send whole-day ISO bounds so the range is inclusive.
        startDate: startDate ? new Date(startDate + "T00:00:00").toISOString() : undefined,
        endDate: endDate ? new Date(endDate + "T23:59:59.999").toISOString() : undefined,
      });
    },
  });
  const rows = data?.logs ?? data ?? [];
  const total = data?.total ?? rows.length;
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const pageStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const pageEnd = Math.min(total, page * limit);
  console.log("vvvvvvvvvvvvvvv",viewing);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
          <p className="mt-1 text-sm text-muted-foreground">Browse system audit events with pagination and page size controls.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by email or action"
              className="pl-8 w-72"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">From</span>
            <Input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="h-8 w-36"
              aria-label="Start date"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">To</span>
            <Input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="h-8 w-36"
              aria-label="End date"
            />
          </div>
          {(startDate || endDate || searchInput) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchInput("");
                setStartDate("");
                setEndDate("");
                setPage(1);
              }}
            >
              Clear
            </Button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Page size</span>
            <Select
              value={String(limit)}
              onValueChange={(value) => {
                setLimit(Number(value));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Module</TableHead>
                {/* <TableHead>Record type</TableHead> */}
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="p-8 text-center text-muted-foreground">Loading…</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="p-8 text-center text-muted-foreground">No audit entries</TableCell></TableRow>
              ) : rows.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-sm">{new Date(r.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{r.entityType}</TableCell>
                  {/* <TableCell className="text-sm text-muted-foreground">{r.event}</TableCell> */}
                  <TableCell><Badge variant="secondary">{r.event}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{r.actorEmail}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => setViewing(r)}>View</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        {totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {pageStart}–{pageEnd} of {total} entries
            </p>
            <Pagination aria-label="Audit log pagination">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={(event) => {
                      event.preventDefault();
                      setPage((value) => Math.max(1, value - 1));
                    }}
                    aria-disabled={page === 1}
                    className={page === 1 ? "pointer-events-none opacity-50" : ""}
                    href="#"
                  />
                </PaginationItem>
                {buildPageItems(page, totalPages).map((value, index) =>
                  value === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={value}>
                      <PaginationLink
                        href="#"
                        isActive={value === page}
                        onClick={(event) => {
                          event.preventDefault();
                          setPage(value);
                        }}
                      >
                        {value}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={(event) => {
                      event.preventDefault();
                      setPage((value) => Math.min(totalPages, value + 1));
                    }}
                    aria-disabled={page === totalPages}
                    className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                    href="#"
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Audit entry</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">When:</span> {new Date(viewing.createdAt).toLocaleString()}</div>
                <div><span className="text-muted-foreground">Action:</span> {viewing.event}</div>
                <div><span className="text-muted-foreground">Module:</span> {viewing.entityType}</div>
                <div><span className="text-muted-foreground">Action performend by:</span> {viewing.actorEmail ?? "—"}</div>
                <div><span className="text-muted-foreground">Action performend on:</span> {viewing.targetEmail ?? "—"}</div>

              </div>
              <div>
                <div className="mt-3 mb-1 font-medium">Previous</div>
                <pre className="max-h-56 overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(viewing?.metadata?.previousValue, null, 2)}</pre>
              </div>
              <div>
                <div className="mt-3 mb-1 font-medium">New</div>
                <pre className="max-h-56 overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(viewing?.metadata?.newValue, null, 2)}</pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
