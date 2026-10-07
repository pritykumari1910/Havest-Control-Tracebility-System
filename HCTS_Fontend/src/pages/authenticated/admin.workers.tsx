import { useCallback, useEffect, useState } from "react";
import { Download, BookText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAllCompanies,
  createCompany,
  updateCompany,
  getAllWorkers,
  createWorker,
  updateWorker,
  getSatelliteWorkers,
  createSatelliteWorker,
  updateSatelliteWorker,
  downloadQRForWorker,
  downloadQRPDFBooklet,
} from "@/apis/companies&worker";
import {
  MasterList,
  extractList,
  idOf,
  type CrudApi,
  type Option,
} from "@/components/admin/crud-list";

const COMPANY_API: CrudApi = {
  fetchAll: getAllCompanies,
  create: createCompany,
  update: updateCompany,
};
const WORKER_API: CrudApi = {
  fetchAll: getAllWorkers,
  create: createWorker,
  update: updateWorker,
};
const SATELLITE_API: CrudApi = {
  fetchAll: getSatelliteWorkers,
  create: createSatelliteWorker,
  update: updateSatelliteWorker,
};

// Trigger a browser download for a Blob returned by the API.
const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

function WorkersPage() {
  const [tab, setTab] = useState("companies");
  const [optionsMap, setOptionsMap] = useState<Record<string, Option[]>>({ companies: [] });

  const loadOptions = useCallback(async () => {
    try {
      // Fetch the full company list (not a paginated page) for the select + filter.
      const companiesRes = await getAllCompanies({ limit: 20 });
      setOptionsMap({
        companies: extractList(companiesRes).map((r) => ({
          value: idOf(r),
          label: r.companyName ?? r.name ?? idOf(r),
        })),
      });
    } catch {
      /* option lookups are best-effort; each tab still loads its own data */
    }
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Companies & Workers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Employment companies, workers, and satellite roles.
        </p>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="companies">Employment Companies</TabsTrigger>
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="sat">Satellite Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="companies" className="mt-6">
          <MasterList
            api={COMPANY_API}
            onChanged={loadOptions}
            config={{
              title: "Employment Companies",
              serverMode: true,
              searchColumns: ["companyName", "taxId"],
              hasStatus: true,
              columns: [
                { key: "companyName", header: "Legal name" },
                { key: "taxId", header: "Tax ID" },
                { key: "contactPerson", header: "Contact" },
                { key: "phoneNumber", header: "Phone" },
              ],
              fields: [
                { name: "companyName", label: "Legal name", kind: "text", required: true },
                { name: "taxId", label: "Tax ID", kind: "text", required: true },
                { name: "contactPerson", label: "Contact person", kind: "text", required: true },
                {
                  name: "phoneNumber",
                  label: "Phone",
                  kind: "text",
                  required: true,
                  placeholder: "+911234567890",
                },
                { name: "email", label: "Email", kind: "text" },
                { name: "comments", label: "Comments", kind: "textarea" },
              ],
            }}
          />
        </TabsContent>

        <TabsContent value="workers" className="mt-6">
          <MasterList
            api={WORKER_API}
            optionsMap={optionsMap}
            config={{
              title: "Workers",
              serverMode: true,
              searchColumns: ["firstName", "lastName", "documentIdNumber"],
              hasStatus: true,
              headerActions: [
                {
                  label: "QR Booklet",
                  icon: <Download className="h-4 w-4" />,
                  onClick: async () => {
                    const blob = await downloadQRPDFBooklet();
                    saveBlob(blob, "workers_qr_booklet.pdf");
                  },
                },
              ],
              rowActions: [
                {
                  icon: <Download className="h-4 w-4" />,
                  tooltip: "Download QR code",
                  onClick: async (row) => {
                    const blob = await downloadQRForWorker(idOf(row));
                    const name = [row.firstName, row.lastName].filter(Boolean).join("_") || idOf(row);
                    saveBlob(blob, `worker_${name}_qr.pdf`);
                  },
                },
              ],
              filters: [
                {
                  label: "Company",
                  path: "employmentCompany",
                  param: "employmentCompany",
                  optionsFrom: "companies",
                },
              ],
              columns: [
                { key: "firstName", header: "First name" },
                { key: "lastName", header: "Last name" },
                { key: "documentIdType", header: "Doc type" },
                { key: "documentIdNumber", header: "Document #" },
                { key: "phoneNumber", header: "Phone" },
                { key: "employmentCompany.companyName", header: "Company" },
              ],
              fields: [
                {
                  name: "employmentCompany",
                  label: "Employment company",
                  kind: "select",
                  required: true,
                  optionsFrom: "companies",
                },
                { name: "firstName", label: "First name", kind: "text", required: true },
                { name: "lastName", label: "Last name", kind: "text", required: true },
                {
                  name: "documentIdType",
                  label: "Document type",
                  kind: "select",
                  required: true,
                  options: [
                    { value: "DNI", label: "DNI" },
                    { value: "NIE", label: "NIE" },
                  ],
                },
                {
                  name: "documentIdNumber",
                  label: "Document number",
                  kind: "text",
                  required: true,
                  placeholder: "DNI: 12345678A · NIE: X1234567A",
                },
                {
                  name: "phoneNumber",
                  label: "Phone",
                  kind: "text",
                  placeholder: "+911234567890",
                },
                { name: "email", label: "Email", kind: "text" },
                // { name: "registrationDate", label: "Registration date", kind: "date" },
              ],
            }}
          />
        </TabsContent>

        <TabsContent value="sat" className="mt-6">
          <MasterList
            api={SATELLITE_API}
            config={{
              title: "Satellite Roles",
              searchColumns: ["name"],
              hasStatus: true,
              columns: [{ key: "name", header: "Name" }],
              fields: [{ name: "name", label: "Name", kind: "text", required: true }],
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default WorkersPage;
