import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { ReportingUserDashboard } from "@/components/dashboards/reporting-user-dashboard";

export function ReadOnlyDashboard({ userEmail }: { userEmail?: string | null }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-warning/40 bg-warning/5 px-4 py-2">
        <div className="flex items-center gap-2 text-sm">
          <Eye className="h-4 w-4 text-warning" />
          <span className="font-medium">Read-Only Mode</span>
          <span className="text-muted-foreground">— you can view data assigned by the administrator. No editing, exporting or printing.</span>
        </div>
        <Badge variant="outline" className="border-warning/50 text-warning">Viewer</Badge>
      </div>
      <ReportingUserDashboard userEmail={userEmail} />
    </div>
  );
}
