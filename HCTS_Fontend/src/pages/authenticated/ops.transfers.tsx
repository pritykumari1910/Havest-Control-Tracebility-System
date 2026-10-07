import { createFileRoute } from "@/lib/router-compat";
import { OpsListPage, statusBadge, fmtDate } from "@/components/ops/ops-list";

export const Route = createFileRoute("/_authenticated/ops/transfers")({
  component: () => (
    <OpsListPage
      config={{
        table: "transfer_orders",
        title: "Transfer Orders",
        description: "Truck loads leaving the packhouse — one transfer order bundles one or more dispatch notes.",
        orderBy: { column: "loading_date", ascending: false },
        select: "*, buyer:buyers(name), destination:destination_centres(name), provider:transport_providers(name)",
        searchColumns: ["order_number", "buyer.name", "destination.name", "provider.name", "truck_plate", "driver_name"],
        statusOptions: [
          { value: "draft", label: "Draft" },
          { value: "in_transit", label: "In transit" },
          { value: "delivered", label: "Delivered" },
          { value: "cancelled", label: "Cancelled" },
        ],
        columns: [
          { key: "loading_date", header: "Loading date", accessor: (r) => fmtDate(r.loading_date) },
          { key: "order_number", header: "Order #", accessor: (r) => <span className="font-mono">{r.order_number}</span> },
          { key: "buyer", header: "Buyer", accessor: (r) => r.buyer?.name ?? "—" },
          { key: "destination", header: "Destination", accessor: (r) => r.destination?.name ?? "—" },
          { key: "provider", header: "Transport", accessor: (r) => r.provider?.name ?? "—" },
          { key: "truck_plate", header: "Truck", accessor: (r) => r.truck_plate ? <span className="font-mono text-xs">{r.truck_plate}</span> : "—" },
          { key: "driver_name", header: "Driver" },
          { key: "departure_at", header: "Departure", accessor: (r) => fmtDate(r.departure_at) },
          { key: "status", header: "Status", accessor: (r) => statusBadge(r.status) },
        ],
      }}
    />
  ),
});
