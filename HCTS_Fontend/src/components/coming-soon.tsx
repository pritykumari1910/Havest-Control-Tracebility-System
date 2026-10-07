import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export function ComingSoon({
  title,
  description,
  breadcrumb,
}: {
  title: string;
  description?: string;
  breadcrumb?: string;
}) {
  return (
    <div className="space-y-6">
      {breadcrumb && (
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{breadcrumb}</div>
      )}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Construction className="h-5 w-5" />
          </div>
          <div className="text-base font-medium">Coming soon</div>
          <p className="max-w-md text-sm text-muted-foreground">
            This module is scheduled in the next delivery phase. The Operations Director dashboard already surfaces the underlying KPIs — use it while this page is being finalised.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
