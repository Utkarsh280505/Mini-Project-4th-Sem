import { useState } from 'react';
import { DollarSign, TrendingUp, Package, Activity, Loader2, RefreshCw } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { DemandPriceChart } from '@/components/dashboard/DemandPriceChart';
import { ProductsTable } from '@/components/dashboard/ProductsTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAnalyticsOverview, useDashboardSummary } from '@/hooks/useAnalytics';
import { useProducts, usePriceOptimization } from '@/hooks/useProducts';

export function Dashboard() {
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: overview,
    loading: overviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = useAnalyticsOverview(30);

  const { loading: summaryLoading } = useDashboardSummary();

  const {
    data: productsData,
    loading: productsLoading,
    refetch: refetchProducts,
  } = useProducts({ skip: (currentPage - 1) * 10, limit: 10 });

  const { optimize, loading: optimizing, result: optimizationResult } = usePriceOptimization();

  const handleRunOptimization = async () => {
    await optimize({ optimization_strategy: 'balanced', min_margin_percent: 10 });
    refetchProducts();
    refetchOverview();
  };

  const kpi = overview?.kpi;

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            AI-powered dynamic pricing — real-time overview
          </p>
        </div>
        <Button
          onClick={handleRunOptimization}
          disabled={optimizing}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {optimizing
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Running…</>
            : <><TrendingUp className="mr-2 h-4 w-4" />Run Optimization</>}
        </Button>
      </div>

      {/* ── Optimization result banner ──────────────────────────────────────── */}
      {optimizationResult && (
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <p className="font-semibold text-blue-900 dark:text-blue-100">Optimization Complete</p>
          </div>

          {/* Step-by-step what happened */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            {[
              { step: '1', label: 'Products read', value: `${optimizationResult.products_optimized + (optimizationResult.optimizations?.length ?? 0)} active`, color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' },
              { step: '2', label: 'Prices calculated', value: `${optimizationResult.products_optimized} changed`, color: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' },
              { step: '3', label: 'Strategy used', value: 'Balanced', color: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' },
              { step: '4', label: 'Est. monthly impact', value: `$${Math.abs(optimizationResult.total_revenue_impact).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: optimizationResult.total_revenue_impact >= 0 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' },
            ].map(s => (
              <div key={s.step} className={`rounded-lg p-2 ${s.color}`}>
                <p className="font-bold text-[10px] uppercase tracking-wide opacity-70">Step {s.step} — {s.label}</p>
                <p className="font-semibold mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Top 3 changes */}
          {optimizationResult.optimizations && optimizationResult.optimizations.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-1.5">Top price changes:</p>
              <div className="space-y-1">
                {optimizationResult.optimizations.slice(0, 3).map((opt) => {
                  const pct = ((opt.suggested_price - opt.old_price) / opt.old_price * 100);
                  return (
                    <div key={opt.product_id} className="flex items-center justify-between bg-white dark:bg-blue-900/40 rounded px-3 py-1.5 text-xs">
                      <span className="text-blue-900 dark:text-blue-100 font-medium truncate max-w-[200px]">
                        Product #{opt.product_id}
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="text-muted-foreground">${opt.old_price.toFixed(2)}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-bold text-blue-700 dark:text-blue-300">${opt.suggested_price.toFixed(2)}</span>
                        <span className={pct >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                        </span>
                      </span>
                    </div>
                  );
                })}
                {optimizationResult.optimizations.length > 3 && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 pl-1">
                    +{optimizationResult.optimizations.length - 3} more products updated
                  </p>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-blue-600 dark:text-blue-400">
            ⚠ These are <strong>suggested prices only</strong> — not saved to the database yet.
            Go to <strong>Pricing Engine</strong> → select "Apply Prices" to save them.
          </p>
        </div>
      )}

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      {(overviewLoading || summaryLoading) && !kpi ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6 pb-5">
                <div className="h-3 bg-muted rounded w-24 mb-3" />
                <div className="h-7 bg-muted rounded w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : overviewError ? (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 flex items-center justify-between">
          <p className="text-sm text-red-700 dark:text-red-300">
            Failed to load analytics data.
          </p>
          <Button variant="outline" size="sm" onClick={refetchOverview}>
            <RefreshCw className="h-4 w-4 mr-1.5" />Retry
          </Button>
        </div>
      ) : kpi ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Revenue"
            value={`$${kpi.total_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            change={kpi.revenue_change_percent}
            description="vs last period"
            icon={<DollarSign className="h-4 w-4" />}
          />
          <KPICard
            title="Demand Index"
            value={kpi.demand_index.toFixed(1)}
            change={kpi.demand_change_percent}
            description="avg across products"
            icon={<Activity className="h-4 w-4" />}
          />
          <KPICard
            title="Active Products"
            value={kpi.active_products}
            change={kpi.products_change_percent}
            description="in catalog"
            icon={<Package className="h-4 w-4" />}
          />
          <KPICard
            title="Avg Price Change"
            value={`${kpi.price_change_percent.toFixed(1)}%`}
            change={kpi.price_change_percent}
            description="since last optimization"
            icon={<TrendingUp className="h-4 w-4" />}
          />
        </div>
      ) : null}

      {/* ── Charts ─────────────────────────────────────────────────────────── */}
      {overviewLoading && !overview ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2].map((i) => (
            <Card key={i} className={`animate-pulse ${i === 1 ? 'lg:col-span-2' : ''}`}>
              <CardContent className="pt-6">
                <div className="h-4 bg-muted rounded w-32 mb-4" />
                <div className="h-[260px] bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : overview ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueChart data={overview.revenue_trend} />
          </div>
          <div className="lg:col-span-1">
            <DemandPriceChart data={overview.demand_vs_price} />
          </div>
        </div>
      ) : null}

      {/* ── Products Table ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Product Pricing</h2>
        {productsLoading && !productsData ? (
          <Card className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-[200px] bg-muted rounded" />
            </CardContent>
          </Card>
        ) : productsData ? (
          <ProductsTable
            products={productsData.items}
            total={productsData.total}
            page={currentPage}
            pages={productsData.pages}
            onPageChange={setCurrentPage}
          />
        ) : null}
      </div>

    </div>
  );
}
