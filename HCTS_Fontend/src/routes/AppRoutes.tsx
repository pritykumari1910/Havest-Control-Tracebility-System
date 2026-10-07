import { Routes, Route } from "react-router-dom";
import AuthPage from "../pages";
import ResetPassword from "../pages/reset-password";
import ProtectedRoute from "@/routes/ProtectedRoute";
import RequireRole from "@/components/RequireRole";
import Profile from "../pages/authenticated/profile";
// import Notifications from "../pages/authenticated/notifications";
import Dashboard from "../pages/authenticated/dashboard";
import { AuthedLayout } from "./Layout";
import UsersPage from "@/pages/authenticated/admin.users";
import PermissionsPage from "@/pages/authenticated/admin.permissions";
import { CampaginPage } from "@/pages/authenticated/admin.campaigns";
import { AuditPage } from "@/pages/authenticated/reports.audit";
import Geography from "@/pages/authenticated/admin.geography";
import VarietiesPage from "@/pages/authenticated/admin.varieties";
import WorkersPage from "@/pages/authenticated/admin.workers";
import QRSeriesPage from "@/pages/authenticated/qr.series";
import QRInventoryPage from "@/pages/authenticated/qr.inventory";
import HarvestForecasts from "@/pages/authenticated/reports.forecasts";
import MachinesPage from "@/pages/authenticated/admin.machines";
import CommercialPage from "@/pages/authenticated/admin.commercial";
import CrewsPage from "@/pages/authenticated/ops.crews";
import HarvestAssignmentsPage from "@/pages/authenticated/ops.assignments";
import { SatelliteStaffPage } from "@/pages/authenticated/reports.satellite";
import SystemParametersPage from "@/pages/authenticated/admin.parameters";
import { ReceptionPage } from "@/pages/authenticated/ops.reception";
import UnassignedPalletBinsPage from "@/pages/authenticated/ops.unassigned";
import DispatchNotesPage from "@/pages/authenticated/ops.dispatch";
import HarvestReportPage from "@/pages/authenticated/reports.harvest-report";
import TraceabilityPage from "@/pages/authenticated/reports.traceability";
import DispatchReportPage from "@/pages/authenticated/reports.dispatch";

function PagePlaceholder({ title }: { title: string }) {
  return (
    <div className="prose max-w-none">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">Comming soon. work in progress.</p>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Authenticated routes (protected) */}
      <Route path="/dashboard" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
      </Route>

      <Route path="/profile" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}>
        <Route index element={<Profile />} />
      </Route>

      {/* <Route path="/notifications" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}>
        <Route index element={<Notifications />} />
      </Route> */}

      {/* Admin area — require system_administrator */}
      <Route path="/admin/users" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}>
        <Route index element={<RequireRole roles={["system_administrator"]}> <UsersPage /> </RequireRole>} />
      </Route>
      <Route path="/admin/permissions" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}>
        <Route index element={<RequireRole roles={["system_administrator"]}><PermissionsPage /></RequireRole>} />
      </Route>
      <Route path="/admin/campaigns" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}>
        <Route index element={<RequireRole roles={["system_administrator","operations_director"]}><CampaginPage /></RequireRole>} />
      </Route>
      <Route path="/admin/geography" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}>
        <Route index element={<RequireRole roles={["system_administrator"]}><Geography /></RequireRole>} />
      </Route>
      <Route path="/admin/varieties" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}>
        <Route index element={<RequireRole roles={["system_administrator"]}><VarietiesPage /></RequireRole>} />
      </Route>
      <Route path="/admin/workers" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}>
        <Route index element={<RequireRole roles={["system_administrator"]}><WorkersPage /></RequireRole>} />
      </Route>
      <Route path="/admin/machines" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}>
        <Route index element={<RequireRole roles={["system_administrator"]}><MachinesPage /></RequireRole>} />
      </Route>
      <Route path="/admin/commercial" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}>
        <Route index element={<RequireRole roles={["system_administrator"]}><CommercialPage /></RequireRole>} />
      </Route>
      <Route path="/admin/parameters" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}>
        <Route index element={<RequireRole roles={["system_administrator"]}><SystemParametersPage/></RequireRole>} />
      </Route>

      {/* QR */}
      <Route path="/qr/series" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}>
      <Route index element={<QRSeriesPage />} /></Route>
      <Route path="/qr/inventory" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}>
      <Route index element={<QRInventoryPage />} /></Route>

      {/* Operations */}
      <Route path="/ops/crews" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}><Route index element={<CrewsPage />} /></Route>
      <Route path="/ops/assignments" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}><Route index element={<HarvestAssignmentsPage />} /></Route>
      <Route path="/ops/reception" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}><Route index element={<ReceptionPage />} /></Route>
      <Route path="/ops/dispatch" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}><Route index element={<DispatchNotesPage />} /></Route>
      <Route path="/ops/transfers" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}><Route index element={<PagePlaceholder title="Transfer Orders"/>} /></Route>
      <Route path="/ops/unassigned" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}><Route index element={<UnassignedPalletBinsPage />} /></Route>

      {/* Reports & Insights */}
      <Route path="/reports/progress" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}><Route index element={<HarvestReportPage />} /></Route>
      <Route path="/reports/dispatch" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}><Route index element={<DispatchReportPage />} /></Route>
      <Route path="/reports/traceability" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}><Route index element={<TraceabilityPage />} /></Route>
      <Route path="/reports/satellite" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}><Route index element={<SatelliteStaffPage />} /></Route>
      <Route path="/reports/forecasts" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}><Route index element={<HarvestForecasts />} /></Route>
      <Route path="/reports/forecasts/approvals" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}><Route index element={<RequireRole roles={["operations_director"]}><PagePlaceholder title="Forecast Approvals"/></RequireRole>} /></Route>
      <Route path="/reports/economic" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}><Route index element={<PagePlaceholder title="Economic Dashboard"/>} /></Route>
      <Route path="/reports/audit" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}><Route index element={<AuditPage />} /></Route>

      {/* Commercial */}
      <Route path="/commercial/buyer-delivery-notes" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}><Route index element={<PagePlaceholder title="Buyer Delivery Notes"/>} /></Route>
      <Route path="/commercial/weight-reconciliation" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}><Route index element={<PagePlaceholder title="Weight Reconciliation"/>} /></Route>
      <Route path="/commercial/classification" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}><Route index element={<PagePlaceholder title="Commercial Classification"/>} /></Route>
      <Route path="/commercial/liquidation" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}><Route index element={<PagePlaceholder title="Liquidation Management"/>} /></Route>
      <Route path="/commercial/settlement" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}><Route index element={<PagePlaceholder title="Settlement Summary"/>} /></Route>

      {/* Misc */}
      <Route path="/reports/qr-search" element={<ProtectedRoute><AuthedLayout /></ProtectedRoute>}><Route index element={<PagePlaceholder title="QR Search"/>} /></Route>

      <Route path="*" element={<div>Not found</div>} />
    </Routes>
  );
}
