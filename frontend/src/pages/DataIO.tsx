import { useState, useCallback } from "react";
import { Upload, Zap, RefreshCw, Play, Database, ArrowRight, CheckCircle, FileText, Download, Globe, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiService } from "@/services/api";
import { ioApi, CSVUploadResponse } from "@/services/io";
import { cn } from "@/lib/utils";

interface IngestForm {
  product_id: string;
  base_price: string;
  demand: string;
  inventory: string;
  competitor_price: string;
}

interface OptimizedPrice {
  product_id: string;
  base_price: number;
  demand: number;
  optimized_price: number;
}

interface IngestResult {
  status: string;
  product_id: string;
}

interface UpdateResult {
  updated_count: number;
  updated_products: string[];
}

const DEFAULT_FORM: IngestForm = {
  product_id: "SKU-1001",
  base_price: "100.00",
  demand: "1.2",
  inventory: "50",
  competitor_price: "105.00",
};

const STEP_COLORS = [
  "bg-blue-600",
  "bg-purple-600",
  "bg-orange-500",
  "bg-green-600",
];

export function DataIO() {
  // Step 1 — CSV Upload
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState<CSVUploadResponse | null>(null);
  const [csvError, setCsvError] = useState("");

  // Step 2 — JSON Ingest
  const [form, setForm] = useState<IngestForm>(DEFAULT_FORM);
  const [ingesting, setIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null);
  const [ingestError, setIngestError] = useState("");

  // Step 3 — Update (simulate market)
  const [updating, setUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<UpdateResult | null>(null);
  const [updateError, setUpdateError] = useState("");

  // Step 4 — GET /prices
  const [fetchingPrices, setFetchingPrices] = useState(false);
  const [prices, setPrices] = useState<OptimizedPrice[]>([]);
  const [pricesError, setPricesError] = useState("");

  // Step 5 — POST /run
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<OptimizedPrice[]>([]);
  const [runError, setRunError] = useState("");

  // Industry real-time batch
  interface IndustryRow { id: number; product_id: string; name: string; base_price: string; demand: string; inventory: string; competitor_price: string; }
  const newRow = (id: number): IndustryRow => ({ id, product_id: `PROD-${id}`, name: "", base_price: "", demand: "1.0", inventory: "", competitor_price: "" });
  const [industryRows, setIndustryRows] = useState<IndustryRow[]>([newRow(1), newRow(2), newRow(3)]);
  const [industryLoading, setIndustryLoading] = useState(false);
  const [industryResults, setIndustryResults] = useState<{ product_id: string; status: string }[]>([]);
  const [industryError, setIndustryError] = useState("");

  // ── Handlers ──────────────────────────────────────────────────────────────

  // ── Industry batch ingest ──────────────────────────────────────────────────
  const updateIndustryRow = (id: number, field: string, value: string) =>
    setIndustryRows(rows => rows.map(r => r.id === id ? { ...r, [field]: value } : r));

  const addIndustryRow = () =>
    setIndustryRows(rows => [...rows, newRow(rows.length + 1)]);

  const removeIndustryRow = (id: number) =>
    setIndustryRows(rows => rows.filter(r => r.id !== id));

  const handleIndustryIngest = async () => {
    const valid = industryRows.filter(r => r.product_id && r.base_price && r.demand && r.inventory);
    if (!valid.length) { setIndustryError("Fill in at least one complete row."); return; }
    setIndustryLoading(true);
    setIndustryResults([]);
    setIndustryError("");
    const results: { product_id: string; status: string }[] = [];
    for (const row of valid) {
      try {
        const res = await apiService.post<{ status: string; product_id: string }>("/ingest", {
          product_id: row.product_id,
          base_price: parseFloat(row.base_price),
          demand: parseFloat(row.demand),
          inventory: parseInt(row.inventory),
          competitor_price: row.competitor_price ? parseFloat(row.competitor_price) : undefined,
        });
        results.push({ product_id: row.product_id, status: res.status });
      } catch {
        results.push({ product_id: row.product_id, status: "error" });
      }
    }
    setIndustryResults(results);
    setIndustryLoading(false);
  };

  const downloadSampleCSV = () => {
    const csv = [
      'product_id,name,base_price,demand,inventory,competitor_price',
      'SKU-101,Wireless Bluetooth Headphones,79.99,1.2,150,84.99',
      'SKU-102,USB-C Charging Cable,12.99,0.9,300,11.50',
      'SKU-103,Portable Power Bank,49.99,1.4,80,52.00',
      'SKU-104,Smart Home Speaker,129.99,0.7,60,135.00',
      'SKU-105,4K Webcam,89.99,1.1,45,94.99',
      'SKU-106,Running Shoes,89.99,1.3,120,95.00',
      'SKU-107,Air Fryer 5.8QT,99.99,1.5,35,109.99',
      'SKU-108,Yoga Mat Premium,39.99,0.8,200,42.00',
      'SKU-109,Coffee Maker,79.99,1.0,90,82.50',
      'SKU-110,Camping Tent 4-Person,179.99,0.6,25,',
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_products.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCSVUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvUploading(true);
    setCsvResult(null);
    setCsvError("");
    try {
      const result = await ioApi.uploadCSV(file);
      setCsvResult(result);
    } catch (err) {
      setCsvError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setCsvUploading(false);
      e.target.value = "";
    }
  }, []);

  const handleIngest = async () => {
    setIngesting(true);
    setIngestResult(null);
    setIngestError("");
    try {
      const payload = {
        product_id: form.product_id,
        base_price: parseFloat(form.base_price),
        demand: parseFloat(form.demand),
        inventory: parseInt(form.inventory),
        competitor_price: form.competitor_price ? parseFloat(form.competitor_price) : undefined,
      };
      const res = await apiService.post<IngestResult>("/ingest", payload);
      setIngestResult(res);
    } catch (err) {
      setIngestError(err instanceof Error ? err.message : "Ingest failed");
    } finally {
      setIngesting(false);
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    setUpdateResult(null);
    setUpdateError("");
    try {
      const res = await apiService.post<UpdateResult>("/update", {
        demand_min: 0.5,
        demand_max: 1.5,
      });
      setUpdateResult(res);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleGetPrices = async () => {
    setFetchingPrices(true);
    setPrices([]);
    setPricesError("");
    try {
      const res = await apiService.get<OptimizedPrice[]>("/prices");
      setPrices(res);
    } catch (err) {
      setPricesError(err instanceof Error ? err.message : "Failed to fetch prices");
    } finally {
      setFetchingPrices(false);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setRunResult([]);
    setRunError("");
    try {
      const res = await apiService.post<OptimizedPrice[]>("/run");
      setRunResult(res);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Run failed");
    } finally {
      setRunning(false);
    }
  };

  const updateField = (field: keyof IngestForm, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Database className="h-7 w-7 text-blue-500" />
          Data Input / Output
        </h1>
        <p className="text-muted-foreground mt-1">
          Full demonstration of real-time data ingestion and dynamic pricing output — exactly as specified.
        </p>
      </div>

      {/* Flow diagram */}
      <div className="flex flex-wrap items-center gap-2 p-4 bg-accent rounded-xl text-sm font-medium">
        {["CSV / JSON Input", "POST /ingest", "POST /update", "GET /prices  |  POST /run"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span className={cn("px-3 py-1.5 rounded-full text-white text-xs", STEP_COLORS[i])}>
              {label}
            </span>
            {i < 3 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* ── REAL-TIME INDUSTRY DATA ────────────────────────────────────────── */}
      <Card className="border-2 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-3 bg-blue-50 dark:bg-blue-950 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Globe className="h-5 w-5 text-blue-600" />
            Real-Time Industry Data Entry
            <Badge className="ml-2 bg-blue-600 text-white text-xs">No CSV needed</Badge>
          </CardTitle>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Enter live market data directly from your industry — no file upload required.
            Each row is sent as a real-time JSON ingest to <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">POST /ingest</code>.
          </p>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">

          {/* Answer: what if no CSV? */}
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-1">
              ✦ No CSV? No problem.
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              The system works entirely without CSV. You can enter product data directly here row by row,
              or call <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">POST /ingest</code> from
              any external system (ERP, POS, e-commerce platform) to push live market data in real time.
              The pricing engine will immediately use the new values when you run optimization.
            </p>
          </div>

          {/* Editable table */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {["Product ID", "Name", "Base Price ($)", "Demand (0.5–1.5)", "Inventory", "Competitor Price ($)", ""].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {industryRows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-2 py-1.5">
                      <Input value={row.product_id} onChange={e => updateIndustryRow(row.id, "product_id", e.target.value)}
                        className="h-8 text-xs font-mono w-28" placeholder="SKU-001" />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input value={row.name} onChange={e => updateIndustryRow(row.id, "name", e.target.value)}
                        className="h-8 text-xs w-36" placeholder="Product name" />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input type="number" value={row.base_price} onChange={e => updateIndustryRow(row.id, "base_price", e.target.value)}
                        className="h-8 text-xs w-24" placeholder="99.99" />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input type="number" step="0.1" min="0.5" max="1.5" value={row.demand}
                        onChange={e => updateIndustryRow(row.id, "demand", e.target.value)}
                        className={cn("h-8 text-xs w-24",
                          parseFloat(row.demand) >= 1.2 ? "border-green-400 text-green-700" :
                          parseFloat(row.demand) <= 0.8 ? "border-red-400 text-red-700" : ""
                        )} placeholder="1.0" />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input type="number" value={row.inventory} onChange={e => updateIndustryRow(row.id, "inventory", e.target.value)}
                        className="h-8 text-xs w-20" placeholder="100" />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input type="number" value={row.competitor_price} onChange={e => updateIndustryRow(row.id, "competitor_price", e.target.value)}
                        className="h-8 text-xs w-24" placeholder="optional" />
                    </td>
                    <td className="px-2 py-1.5">
                      <button onClick={() => removeIndustryRow(row.id)}
                        className="text-muted-foreground hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={addIndustryRow}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add Row
            </Button>
            <Button onClick={handleIndustryIngest} disabled={industryLoading}
              className="bg-blue-600 hover:bg-blue-700">
              {industryLoading
                ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Ingesting…</>
                : <><Zap className="mr-2 h-4 w-4" />Ingest All Rows</>}
            </Button>
            {industryError && <p className="text-xs text-red-600">{industryError}</p>}
          </div>

          {/* Results */}
          {industryResults.length > 0 && (
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground">
                Ingest Results
              </div>
              <div className="divide-y divide-border">
                {industryResults.map((r) => (
                  <div key={r.product_id} className="flex items-center justify-between px-3 py-2">
                    <span className="font-mono text-xs">{r.product_id}</span>
                    <Badge className={cn("text-xs",
                      r.status === "created" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                      r.status === "updated" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    )}>
                      {r.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                {industryResults.filter(r => r.status === "created").length} created ·{" "}
                {industryResults.filter(r => r.status === "updated").length} updated ·{" "}
                {industryResults.filter(r => r.status === "error").length} errors
              </div>
            </div>
          )}

          {/* Demand guide */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            {[
              { range: "1.3 – 1.5", label: "High Demand", desc: "Peak season, trending product", color: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200" },
              { range: "0.9 – 1.2", label: "Normal Demand", desc: "Steady market conditions", color: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200" },
              { range: "0.5 – 0.8", label: "Low Demand", desc: "Off-season, slow market", color: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200" },
            ].map(d => (
              <div key={d.range} className={cn("rounded-lg border p-2", d.color)}>
                <p className="font-bold">{d.range}</p>
                <p className="font-semibold">{d.label}</p>
                <p className="opacity-80">{d.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── STEP 1: CSV Upload ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
            <FileText className="h-4 w-4 text-blue-500" />
            CSV Upload  <Badge variant="secondary" className="ml-1 text-xs">POST /io/upload-csv</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload a CSV file to bulk-import product market data into the database.
            Required columns: <code className="bg-accent px-1 rounded text-xs">product_id, name, base_price, demand, inventory, competitor_price</code>
          </p>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={downloadSampleCSV}>
              <Download className="h-4 w-4 mr-2" />
              Download Sample CSV
            </Button>
            <label className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium cursor-pointer transition-colors bg-card hover:bg-accent",
              csvUploading && "opacity-50 pointer-events-none"
            )}>
              <Upload className="h-4 w-4" />
              {csvUploading ? "Uploading…" : "Choose CSV File"}
              <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
            </label>
            <span className="text-xs text-muted-foreground">Only admins can upload CSV</span>
          </div>

          {/* Sample CSV */}
          <div className="bg-accent rounded-lg p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Sample CSV format:</p>
            <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">
{`product_id,name,base_price,demand,inventory,competitor_price
1001,Widget Alpha,49.99,1.2,150,52.00
1002,Widget Beta,79.99,0.8,80,75.00
1003,Widget Gamma,29.99,1.5,200,31.00`}
            </pre>
          </div>

          {csvResult && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200 text-sm">Upload successful</span>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300">{csvResult.message}</p>
              <div className="flex gap-4 mt-2 text-xs text-green-700 dark:text-green-300">
                <span>Imported: <strong>{csvResult.imported}</strong></span>
                <span>Updated: <strong>{csvResult.updated}</strong></span>
                <span>Total: <strong>{csvResult.total_processed}</strong></span>
              </div>
            </div>
          )}
          {csvError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{csvError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── STEP 2: JSON Ingest ────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">2</span>
            <Zap className="h-4 w-4 text-purple-500" />
            Real-Time JSON Ingest  <Badge variant="secondary" className="ml-1 text-xs">POST /ingest</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Send live market data as JSON for a single product. Creates the product if it does not exist, otherwise updates it.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">product_id</Label>
              <Input value={form.product_id} onChange={(e) => updateField("product_id", e.target.value)} placeholder="SKU-1001" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">base_price</Label>
              <Input type="number" value={form.base_price} onChange={(e) => updateField("base_price", e.target.value)} placeholder="100.00" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">demand <span className="text-muted-foreground">(0.5–1.5)</span></Label>
              <Input type="number" step="0.1" value={form.demand} onChange={(e) => updateField("demand", e.target.value)} placeholder="1.2" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">inventory</Label>
              <Input type="number" value={form.inventory} onChange={(e) => updateField("inventory", e.target.value)} placeholder="50" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">competitor_price <span className="text-muted-foreground">(optional)</span></Label>
              <Input type="number" value={form.competitor_price} onChange={(e) => updateField("competitor_price", e.target.value)} placeholder="105.00" />
            </div>
          </div>

          {/* JSON preview */}
          <div className="bg-accent rounded-lg p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">JSON payload that will be sent:</p>
            <pre className="text-xs font-mono text-foreground">
{JSON.stringify({
  product_id: form.product_id,
  base_price: parseFloat(form.base_price) || 0,
  demand: parseFloat(form.demand) || 0,
  inventory: parseInt(form.inventory) || 0,
  competitor_price: form.competitor_price ? parseFloat(form.competitor_price) : null,
}, null, 2)}
            </pre>
          </div>

          <Button onClick={handleIngest} disabled={ingesting} className="bg-purple-600 hover:bg-purple-700">
            {ingesting
              ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Ingesting…</>
              : <><Zap className="mr-2 h-4 w-4" />POST /ingest</>}
          </Button>

          {ingestResult && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Product <strong>{ingestResult.product_id}</strong> — {ingestResult.status}
                </span>
              </div>
            </div>
          )}
          {ingestError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{ingestError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── STEP 3: Update (simulate market) ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">3</span>
            <RefreshCw className="h-4 w-4 text-orange-500" />
            Simulate Market Changes  <Badge variant="secondary" className="ml-1 text-xs">POST /update</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Simulates real-time market behavior across all products:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-none">
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-orange-500 inline-block" /> Randomly changes demand between <strong>0.5 and 1.5</strong></li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-orange-500 inline-block" /> Slightly reduces inventory (0–5%)</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-orange-500 inline-block" /> Adjusts competitor prices ±2%</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-orange-500 inline-block" /> Saves all updated values to SQLite</li>
          </ul>

          <div className="bg-accent rounded-lg p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Request body:</p>
            <pre className="text-xs font-mono text-foreground">
{`POST /api/v1/update
{
  "demand_min": 0.5,
  "demand_max": 1.5
}`}
            </pre>
          </div>

          <Button onClick={handleUpdate} disabled={updating} className="bg-orange-500 hover:bg-orange-600">
            {updating
              ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Updating…</>
              : <><RefreshCw className="mr-2 h-4 w-4" />POST /update</>}
          </Button>

          {updateResult && (
            <div className="rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Updated <strong>{updateResult.updated_count}</strong> products with new market data
                </span>
              </div>
              <p className="text-xs text-orange-700 dark:text-orange-300 font-mono">
                {updateResult.updated_products.slice(0, 8).join(", ")}
                {updateResult.updated_products.length > 8 && ` … +${updateResult.updated_products.length - 8} more`}
              </p>
            </div>
          )}
          {updateError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{updateError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── STEP 4 & 5: Output ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* GET /prices */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">4</span>
              <Database className="h-4 w-4 text-green-500" />
              Get Optimized Prices  <Badge variant="secondary" className="ml-1 text-xs">GET /prices</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Reads current data and computes optimized prices — <strong>no DB changes</strong>.
            </p>
            <div className="bg-accent rounded-lg p-3 text-xs font-mono">
              <p className="text-muted-foreground mb-1">Formula applied:</p>
              <p className="text-foreground">new_price = base_price × demand</p>
              <p className="text-foreground">clamped to [0.5×, 2.0×] base_price</p>
            </div>

            <Button onClick={handleGetPrices} disabled={fetchingPrices} variant="outline" className="border-green-500 text-green-700 hover:bg-green-50 dark:hover:bg-green-950">
              {fetchingPrices
                ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Fetching…</>
                : <><Play className="mr-2 h-4 w-4" />GET /prices</>}
            </Button>

            {pricesError && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 p-3">
                <p className="text-sm text-red-800 dark:text-red-200">{pricesError}</p>
              </div>
            )}

            {prices.length > 0 && (
              <div className="overflow-auto max-h-[320px] rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>product_id</TableHead>
                      <TableHead className="text-right">base_price</TableHead>
                      <TableHead className="text-right">demand</TableHead>
                      <TableHead className="text-right">optimized_price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prices.map((p) => (
                      <TableRow key={p.product_id}>
                        <TableCell className="font-mono text-xs">{p.product_id}</TableCell>
                        <TableCell className="text-right">${p.base_price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            "font-medium",
                            p.demand >= 1.2 ? "text-green-600" : p.demand <= 0.8 ? "text-red-600" : "text-foreground"
                          )}>
                            {p.demand.toFixed(4)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-blue-600">
                          ${p.optimized_price.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* POST /run */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">5</span>
              <Play className="h-4 w-4 text-green-500" />
              Run Pricing Engine  <Badge variant="secondary" className="ml-1 text-xs">POST /run</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Recalculates prices using latest data, <strong>saves to DB</strong>, and records pricing history.
            </p>
            <div className="bg-accent rounded-lg p-3 text-xs font-mono">
              <p className="text-muted-foreground mb-1">What it does:</p>
              <p className="text-foreground">1. Reads all products from SQLite</p>
              <p className="text-foreground">2. Applies: new_price = base_price × demand</p>
              <p className="text-foreground">3. Writes current_price to DB</p>
              <p className="text-foreground">4. Logs change to pricing_history</p>
            </div>

            <Button onClick={handleRun} disabled={running} className="bg-green-600 hover:bg-green-700">
              {running
                ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Running…</>
                : <><Play className="mr-2 h-4 w-4" />POST /run</>}
            </Button>

            {runError && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 p-3">
                <p className="text-sm text-red-800 dark:text-red-200">{runError}</p>
              </div>
            )}

            {runResult.length > 0 && (
              <>
                <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Saved optimized prices for <strong>{runResult.length}</strong> products
                    </span>
                  </div>
                </div>
                <div className="overflow-auto max-h-[260px] rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>product_id</TableHead>
                        <TableHead className="text-right">base_price</TableHead>
                        <TableHead className="text-right">demand</TableHead>
                        <TableHead className="text-right">optimized_price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {runResult.map((p) => (
                        <TableRow key={p.product_id}>
                          <TableCell className="font-mono text-xs">{p.product_id}</TableCell>
                          <TableCell className="text-right">${p.base_price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <span className={cn(
                              "font-medium",
                              p.demand >= 1.2 ? "text-green-600" : p.demand <= 0.8 ? "text-red-600" : "text-foreground"
                            )}>
                              {p.demand.toFixed(4)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold text-blue-600">
                            ${p.optimized_price.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* API reference */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">API Endpoint Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Method</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Input</TableHead>
                  <TableHead>Output</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { method: "POST", endpoint: "/api/v1/ingest", purpose: "Real-time data ingestion", input: "JSON: product_id, base_price, demand, inventory, competitor_price", output: "status, product_id" },
                  { method: "POST", endpoint: "/api/v1/update", purpose: "Simulate market changes", input: "JSON: demand_min, demand_max", output: "updated_count, updated_products[]" },
                  { method: "GET",  endpoint: "/api/v1/prices", purpose: "Get optimized prices", input: "None", output: "product_id, base_price, demand, optimized_price" },
                  { method: "POST", endpoint: "/api/v1/run",    purpose: "Run & save pricing engine", input: "None", output: "product_id, base_price, demand, optimized_price" },
                  { method: "POST", endpoint: "/api/v1/io/upload-csv", purpose: "Bulk CSV import", input: "multipart/form-data CSV file", output: "imported, updated, errors, total_processed" },
                ].map((row) => (
                  <TableRow key={row.endpoint}>
                    <TableCell>
                      <Badge className={cn(
                        "text-xs font-mono",
                        row.method === "GET" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      )}>
                        {row.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.endpoint}</TableCell>
                    <TableCell className="text-sm">{row.purpose}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.input}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.output}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
