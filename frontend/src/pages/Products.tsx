import { useState, useCallback } from 'react';
import {
  Search, RefreshCw, Upload, Download, Trash2,
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus,
  CheckCircle, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProducts, useCategories, useProductStats } from '@/hooks/useProducts';
import { ioApi, CSVUploadResponse } from '@/services/io';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────
type Banner = { type: 'success' | 'error' | 'info'; message: string } | null;

// ── Helpers ───────────────────────────────────────────────────────────────────
function demandBadge(score: number) {
  if (score >= 70) return { label: 'High',   cls: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
  if (score >= 40) return { label: 'Medium', cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
  return               { label: 'Low',    cls: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
}

function PriceChangeCell({ pct }: { pct?: number | null }) {
  if (pct == null) return <span className="text-muted-foreground">—</span>;
  if (pct > 0) return <span className="flex items-center gap-1 text-green-600 font-medium"><TrendingUp className="h-3 w-3" />+{pct.toFixed(1)}%</span>;
  if (pct < 0) return <span className="flex items-center gap-1 text-red-600 font-medium"><TrendingDown className="h-3 w-3" />{pct.toFixed(1)}%</span>;
  return <span className="flex items-center gap-1 text-muted-foreground"><Minus className="h-3 w-3" />0%</span>;
}

function BannerAlert({ banner, onClose }: { banner: Banner; onClose: () => void }) {
  if (!banner) return null;
  const styles = {
    success: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    error:   'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    info:    'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
  };
  const Icon = banner.type === 'success' ? CheckCircle : AlertCircle;
  return (
    <div className={cn('flex items-start gap-3 rounded-lg border p-4', styles[banner.type])}>
      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
      <p className="text-sm flex-1">{banner.message}</p>
      <button onClick={onClose} className="text-current opacity-60 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function Products() {
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory]       = useState('');
  const [banner, setBanner]           = useState<Banner>(null);
  const [uploading, setUploading]     = useState(false);
  const [simulating, setSimulating]   = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data, loading, refetch } = useProducts({
    skip: (page - 1) * 15,
    limit: 15,
    search: search || undefined,
    category: category || undefined,
  });
  const { categories } = useCategories();
  const { stats, refetch: refetchStats } = useProductStats();

  const refresh = () => { refetch(); refetchStats(); };

  // ── Download sample CSV ────────────────────────────────────────────────────
  const downloadSampleCSV = () => {
    const rows = [
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
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
    a.download = 'sample_products.csv';
    a.click();
  };

  // ── Upload CSV ─────────────────────────────────────────────────────────────
  const handleCSVUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setBanner(null);
    try {
      const result: CSVUploadResponse = await ioApi.uploadCSV(file);
      setBanner({ type: 'success', message: result.message });
      refresh();
    } catch (err) {
      setBanner({ type: 'error', message: err instanceof Error ? err.message : 'Upload failed' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }, []);

  // ── Simulate market ────────────────────────────────────────────────────────
  const handleSimulate = async () => {
    setSimulating(true);
    setBanner(null);
    try {
      const r = await ioApi.simulateInput();
      setBanner({ type: 'info', message: `Market simulated — updated ${r.updated_count} products with new demand & inventory values.` });
      refresh();
    } catch {
      setBanner({ type: 'error', message: 'Simulation failed. Try again.' });
    } finally {
      setSimulating(false);
    }
  };

  // ── Delete CSV-imported products ───────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    setShowDeleteConfirm(false);
    setBanner(null);
    try {
      const r = await ioApi.deleteUploadedProducts();
      setBanner({ type: 'success', message: r.message });
      refresh();
    } catch (err) {
      setBanner({ type: 'error', message: err instanceof Error ? err.message : 'Delete failed' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View pricing, demand, and inventory. Upload CSV to add products.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Download sample */}
          <Button variant="outline" size="sm" onClick={downloadSampleCSV}>
            <Download className="h-4 w-4 mr-1.5" />
            Sample CSV
          </Button>

          {/* Upload CSV */}
          <label className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border',
            'text-sm font-medium cursor-pointer transition-colors bg-card hover:bg-accent',
            uploading && 'opacity-50 pointer-events-none'
          )}>
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading…' : 'Upload CSV'}
            <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
          </label>

          {/* Delete CSV products */}
          {!showDeleteConfirm ? (
            <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(true)} disabled={deleting}
              className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete CSV Products
            </Button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-red-300 bg-red-50 dark:bg-red-950">
              <span className="text-xs text-red-700 dark:text-red-300 font-medium">Delete all CSV-imported products?</span>
              <button onClick={handleDelete} disabled={deleting}
                className="px-2 py-0.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700">
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)}
                className="px-2 py-0.5 border border-border rounded text-xs font-medium hover:bg-accent">
                Cancel
              </button>
            </div>
          )}

          {/* Simulate market */}
          <Button variant="outline" size="sm" onClick={handleSimulate} disabled={simulating}>
            <RefreshCw className={cn('h-4 w-4 mr-1.5', simulating && 'animate-spin')} />
            {simulating ? 'Simulating…' : 'Simulate Market'}
          </Button>
        </div>
      </div>

      {/* ── Banner ─────────────────────────────────────────────────────────── */}
      <BannerAlert banner={banner} onClose={() => setBanner(null)} />

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total',      value: stats.total_products },
            { label: 'Active',     value: stats.active_products },
            { label: 'Avg Price',  value: `$${stats.avg_price.toFixed(2)}` },
            { label: 'Avg Demand', value: stats.avg_demand_score.toFixed(1) },
            { label: 'Low Stock',  value: stats.low_stock_products, warn: stats.low_stock_products > 0 },
          ].map((s) => (
            <Card key={s.label} className="shadow-none">
              <CardContent className="pt-3 pb-3 px-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={cn('text-xl font-bold mt-0.5', s.warn ? 'text-red-600' : '')}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Search + Category filter ────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 flex-1 min-w-[200px] max-w-sm">
          <Input
            placeholder="Search name or SKU…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
            className="h-8 text-sm"
          />
          <Button size="sm" className="h-8 px-3" onClick={() => { setSearch(searchInput); setPage(1); }}>
            <Search className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {['', ...categories].map((cat) => (
            <button
              key={cat || '__all__'}
              onClick={() => { setCategory(cat); setPage(1); }}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                category === cat
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              {cat || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <Card className="shadow-none">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-[200px]">Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Base</TableHead>
                      <TableHead className="text-right">Current</TableHead>
                      <TableHead className="text-right">Suggested</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                      <TableHead>Demand</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Competitor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.items.map((p) => {
                      const d = demandBadge(p.demand_score);
                      return (
                        <TableRow key={p.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-sm max-w-[200px] truncate" title={p.name}>
                            {p.name}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">{p.sku}</TableCell>
                          <TableCell>
                            {p.category
                              ? <Badge variant="secondary" className="text-xs">{p.category}</Badge>
                              : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-right text-sm">${p.base_price.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-sm font-medium">${p.current_price.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-sm">
                            {p.suggested_price
                              ? <span className="text-blue-600 font-semibold">${p.suggested_price.toFixed(2)}</span>
                              : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            <PriceChangeCell pct={p.price_change_percent} />
                          </TableCell>
                          <TableCell>
                            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', d.cls)}>
                              {d.label} · {p.demand_score.toFixed(0)}
                            </span>
                          </TableCell>
                          <TableCell className={cn('text-right text-sm font-medium', p.stock_quantity < 10 ? 'text-red-600' : '')}>
                            {p.stock_quantity}
                            {p.stock_quantity < 10 && <span className="ml-1 text-xs">⚠</span>}
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {p.competitor_price ? `$${p.competitor_price.toFixed(2)}` : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {!data?.items.length && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-muted-foreground py-16 text-sm">
                          No products found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data && data.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    {data.items.length} of {data.total} products
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs">Page {page} of {data.pages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= data.pages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── CSV format reference ────────────────────────────────────────────── */}
      <Card className="shadow-none border-dashed">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            CSV Format Reference
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <p className="font-medium mb-1">Required columns</p>
              <code className="block bg-accent rounded p-2 font-mono text-foreground">
                product_id, name, base_price, demand, inventory
              </code>
            </div>
            <div>
              <p className="font-medium mb-1">Optional column</p>
              <code className="block bg-accent rounded p-2 font-mono text-foreground">
                competitor_price  (leave blank if unknown)
              </code>
            </div>
          </div>
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p><span className="font-medium text-foreground">product_id</span> — any string SKU, e.g. <code className="bg-accent px-1 rounded">SKU-101</code></p>
            <p><span className="font-medium text-foreground">demand</span> — multiplier 0.5–1.5 (1.2 = high demand, 0.8 = low demand)</p>
            <p><span className="font-medium text-foreground">Column order</span> — doesn't matter, headers are matched by name</p>
          </div>
          <div className="bg-accent rounded p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Example:</p>
            <pre className="text-xs font-mono text-foreground leading-relaxed">{`product_id,name,base_price,demand,inventory,competitor_price
SKU-101,Widget Alpha,49.99,1.2,150,52.00
SKU-102,Widget Beta,79.99,0.8,80,
SKU-103,Widget Gamma,29.99,1.5,200,31.00`}</pre>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
