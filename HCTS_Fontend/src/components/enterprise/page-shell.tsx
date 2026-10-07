import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PageHeader({
  breadcrumb,
  title,
  description,
  live,
  onRefresh,
  isFetching,
  actions,
}: {
  breadcrumb?: string;
  title: string;
  description?: string;
  live?: boolean;
  onRefresh?: () => void;
  isFetching?: boolean;
  actions?: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>Home</span>
        <span>/</span>
        {breadcrumb && (
          <>
            <span>{breadcrumb}</span>
            <span>/</span>
          </>
        )}
        <span className="font-medium text-foreground">{title}</span>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {live && (
            <Badge variant="outline" className="gap-1.5 text-[10px]">
              <Radio className={`h-3 w-3 ${isFetching ? "animate-pulse text-primary" : ""}`} />
              Live
            </Badge>
          )}
          {onRefresh && (
            <Button size="sm" variant="ghost" onClick={onRefresh} className="h-7 gap-1.5 text-xs">
              <RefreshCcw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneCls =
    tone === "success" ? "text-success" :
    tone === "warning" ? "text-warning" :
    tone === "danger" ? "text-destructive" :
    "text-primary";
  return (
    <Card className="h-full border transition hover:border-primary/40 hover:shadow-sm">
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
          {Icon && <Icon className={`h-4 w-4 shrink-0 ${toneCls}`} />}
        </div>
        <div className="font-display text-2xl font-semibold tabular-nums text-foreground">{value}</div>
        {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

export function SectionHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 p-10 text-center">
      <div className="text-sm font-medium text-foreground">{title}</div>
      {description && <p className="max-w-md text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}
