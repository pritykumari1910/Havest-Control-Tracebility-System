import { useCallback, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAllFarms,
  createFarm,
  updateFarm,
  getAllPlots,
  createPlot,
  updatePlot,
  getAllValves,
  createValve,
  updateValve,
  getAllParks,
  createPark,
  updatePark,
  allPlotsOfFarm,
  allValvesOfPlot,
} from "@/apis/farm.geography";
import { getAllVarieties } from "@/apis/varieties";
import {
  MasterList,
  extractList,
  idOf,
  toIdArray,
  type CrudApi,
  type Option,
} from "@/components/admin/crud-list";

// ---------- page ----------
const FARM_API: CrudApi = { fetchAll: getAllFarms, create: createFarm, update: updateFarm };
const PLOT_API: CrudApi = { fetchAll: getAllPlots, create: createPlot, update: updatePlot };
const VALVE_API: CrudApi = { fetchAll: getAllValves, create: createValve, update: updateValve };
const PARK_API: CrudApi = { fetchAll: getAllParks, create: createPark, update: updatePark };

function Geography() {
  const [tab, setTab] = useState("farms");
  const [optionsMap, setOptionsMap] = useState<Record<string, Option[]>>({
    farms: [],
    varieties: [],
  });

  const loadOptions = useCallback(async () => {
    try {
      // Farms feed the Farm select + Farm filter; varieties feed the multi-select.
      // Plot/valve options are fetched on demand (cascading selects & filters).
      const [farmsRes, varietiesRes] = await Promise.all([
        getAllFarms({ limit: 100 }),
        getAllVarieties(),
      ]);
      const toOptions = (res: any): Option[] =>
        extractList(res).map((r) => ({
          value: idOf(r),
          label: r.farmName ?? r.plotName ?? r.valveName ?? r.name ?? r.code ?? idOf(r),
        }));
      // The plot backend stores/resolves varieties by name (see plot.service),
      // so the option value must be the variety name for save + edit round-trips.
      const toVarietyOptions = (res: any): Option[] =>
        extractList(res).map((r) => {
          const name = r.varietyName ?? r.name ?? idOf(r);
          return { value: name, label: name };
        });
      setOptionsMap({
        farms: toOptions(farmsRes),
        varieties: toVarietyOptions(varietiesRes),
      });
    } catch {
      /* option lookups are best-effort; individual tabs still load their own data */
    }
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Farms & Geography</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Farms contain plots. Plots contain valves and parks.
        </p>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="farms">Farms</TabsTrigger>
          <TabsTrigger value="plots">Plots</TabsTrigger>
          <TabsTrigger value="valves">Valves</TabsTrigger>
          <TabsTrigger value="parks">Parks</TabsTrigger>
        </TabsList>

        <TabsContent value="farms" className="mt-6">
          <MasterList
            api={FARM_API}
            optionsMap={optionsMap}
            onChanged={loadOptions}
            config={{
              title: "Farms",
              serverMode: true,
              searchColumns: ["farmName", "internalCode"],
              hasStatus: true,
              columns: [
                { key: "internalCode", header: "Farm Code" },
                { key: "farmName", header: "Farm Name" },
                { key: "totalHectares", header: "Hectares" },
              ],
              fields: [
                { name: "farmName", label: "Farm Name", kind: "text", required: true },
                { name: "totalHectares", label: "Total hectares", kind: "number", required: true },
                { name: "comments", label: "Comments", kind: "textarea" },
              ],
            }}
          />
        </TabsContent>

        <TabsContent value="plots" className="mt-6">
          <MasterList
            api={PLOT_API}
            optionsMap={optionsMap}
            onChanged={loadOptions}
            config={{
              title: "Plots",
              serverMode: true,
              searchColumns: ["plotName", "plotCode"],
              hasStatus: true,
              filters: [{ label: "Farm", path: "parentFarm", param: "parentFarm", optionsFrom: "farms" }],
              columns: [
                { key: "plotCode", header: "Plot Code" },
                { key: "plotName", header: "Plot Name" },
                { key: "totalArea", header: "Hectares" },
                { key: `parentFarm.farmName`, header: "Farm" },
                {
                  key: "avocadoVariety",
                  header: "Varieties",
                  render: (row) => {
                    const names = toIdArray(row.avocadoVariety);
                    return names.length ? names.join(", ") : "—";
                  },
                },
              ],
              fields: [
                { name: "parentFarm", label: "Farm", kind: "select", required: true, optionsFrom: "farms" },
                { name: "avocadoVariety", label: "Varieties", kind: "multi-select", optionsFrom: "varieties", required: true },
                { name: "plotName", label: "Plot Name", kind: "text", required: true },
                { name: "totalArea", label: "Hectares", kind: "number", required: true },
                { name: "comments", label: "Comments", kind: "textarea" },
              ],
            }}
          />
        </TabsContent>

        <TabsContent value="valves" className="mt-6">
          <MasterList
            api={VALVE_API}
            optionsMap={optionsMap}
            onChanged={loadOptions}
            config={{
              title: "Valves",
              serverMode: true,
              searchColumns: ["valveName", "valveCode"],
              hasStatus: true,
              filters: [
                { label: "Farm", path: "parentFarm", param: "parentFarm", optionsFrom: "farms" },
                {
                  label: "Plot",
                  path: "parentPlot",
                  param: "parentPlot",
                  dependsOn: "parentFarm",
                  fetchOptions: allPlotsOfFarm,
                },
              ],
              columns: [
                { key: "valveCode", header: "Valve Code" },
                { key: "valveName", header: "Valve Name" },
                { key: "irrigationArea", header: "Hectares" },
                { key: `parentPlot.plotName`, header: "Plot" },
                { key: `parentFarm.farmName`, header: "Farm" },
                {
                  key: "avocadoVariety",
                  header: "Varieties",
                  render: (row) => {
                    const names = toIdArray(row.avocadoVariety);
                    return names.length ? names.join(", ") : "—";
                  },
                },
              ],
              fields: [
                { name: "parentFarm", label: "Farm", kind: "select", required: true, optionsFrom: "farms" },
                {
                  name: "parentPlot",
                  label: "Plot",
                  kind: "select",
                  required: true,
                  dependsOn: "parentFarm",
                  fetchOptions: allPlotsOfFarm,
                  placeholder: "Select plot",
                },
                { name: "avocadoVariety", label: "Varieties", kind: "multi-select", required: true, optionsFrom: "varieties" },
                { name: "valveName", label: "Valve Name", kind: "text", required: true },
                { name: "irrigationArea", label: "Hectares", kind: "number", required: true },
                { name: "comments", label: "Comments", kind: "textarea" },
              ],
            }}
          />
        </TabsContent>

        <TabsContent value="parks" className="mt-6">
          <MasterList
            api={PARK_API}
            optionsMap={optionsMap}
            onChanged={loadOptions}
            config={{
              title: "Parks (Row Blocks)",
              serverMode: true,
              searchColumns: ["parkName", "parkCode"],
              hasStatus: true,
              filters: [
                { label: "Farm", path: "parentFarm", param: "parentFarm", optionsFrom: "farms" },
                {
                  label: "Plot",
                  path: "parentPlot",
                  param: "parentPlot",
                  dependsOn: "parentFarm",
                  fetchOptions: allPlotsOfFarm,
                },
                {
                  label: "Valve",
                  path: "parentValve",
                  param: "parentValve",
                  dependsOn: "parentPlot",
                  fetchOptions: allValvesOfPlot,
                },
              ],
              columns: [
                { key: "parkCode", header: "Park Code" },
                { key: "parkName", header: "Park Name" },
                { key: "rowRange", header: "Rows" },
                { key: "area", header: "Hectares" },
                { key: `parentValve.valveName`, header: "Valve" },
                { key: `parentPlot.plotName`, header: "Plot" },
                { key: `parentFarm.farmName`, header: "Farm" },
                {
                  key: "avocadoVariety",
                  header: "Varieties",
                  render: (row) => {
                    const names = toIdArray(row.avocadoVariety);
                    return names.length ? names.join(", ") : "—";
                  },
                },
              ],
              fields: [
                { name: "parentFarm", label: "Farm", kind: "select", required: true, optionsFrom: "farms" },
                {
                  name: "parentPlot",
                  label: "Plot",
                  kind: "select",
                  required: true,
                  dependsOn: "parentFarm",
                  fetchOptions: allPlotsOfFarm,
                  placeholder: "Select plot",
                },
                {
                  name: "parentValve",
                  label: "Valve",
                  kind: "select",
                  required: true,
                  dependsOn: "parentPlot",
                  fetchOptions: allValvesOfPlot,
                  placeholder: "Select valve",
                },
                { name: "avocadoVariety", label: "Varieties", kind: "multi-select", required: true, optionsFrom: "varieties" },
                { name: "parkName", label: "Park Name", kind: "text", required: true },
                { name: "rowRange", label: "Row range", kind: "text", required: true, placeholder: "e.g. 1-25" },
                { name: "area", label: "Hectares", kind: "number", required: true },
                { name: "comments", label: "Comments", kind: "textarea" },
              ],
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Geography;
