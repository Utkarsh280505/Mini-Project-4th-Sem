import { useState } from 'react';
import { BarChart3, RefreshCw, TrendingUp, TrendingDown, Lightbulb, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useAnalyticsOverview, useOptimizationHistory, usePredictiveInsights } from '@/hooks/useAnalytics';
import { ioApi, IOPricingHistoryRecord } from '@/services/io';
import { cn } from '@/lib/utils';

const DAYS_OPTIONS = [7, 14, 30, 90];

export function Analytics() {
  const [days, setDays] = useState(30);
  const { data: overview, loading: overviewLoading, refetch: refetchOverview } = useAnalyticsOverview(days);
  const { data: history } = useOptimizationHistory(20);
  const { data: insights } = usePredictiveInsights();

  // Pricing history from IO endpoint
  const [pricingHistory, setPricingHistory] = useState<IOPricingHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const loadPricingHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await ioApi.getPricingHistory(undefined, 50);
      setPricingHistory(res.records);
      setHistoryLoaded(true);
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  };

  const kpi = overview?.kpi;

  const kpiCards = kpi ? [
    {
      label: 'Total Revenue',
      value: `$${kpi.total_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      change: kpi.revenue_change_percent,
    },
    {
      label: 'Demand Index',
      value: kpi.demand_index.toFixed(1),
      change: kpi.demand_change_percent,
    },
    {
      label: 'Active Products',
      value: kpi.active_products,
      change: kpi.products_change_percent,
    },
    {
      label: 'Avg Price Change',
      value: `${kpi.price_change_percent.toFixed(1)}%`,
      change: kpi.price_change_percent,
    },
  ] : [];

  const categoryData = overview?.category_performance.map((c) => ({
    name: c.category,
    revenue: Math.round(c.revenue),
    demand: Math.round(c.avg_demand),
    products: c.product_count,
  })) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-blue-500" />
            Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Revenue trends, demand analysis, category performance, and pricing history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {DAYS_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium border transition-colors',
                days === d
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-border text-foreground hover:bg-accent'
              )}
            >
              {d}d
            </button>
          ))}
          <Button variant="outline" size="sm" onClick={refetchOverview} disabled={overviewLoading}>
            <RefreshCw className={cn('h-4 w-4', overviewLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {overviewLoading ? (
        <div className="flex items-center justify-center h-48">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map((k) => (
              <Card key={k.label}>
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className="text-2xl font-bold mt-1">{k.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {k.change > 0
                      ? <TrendingUp className="h-3 w-3 text-green-500" />
                      : k.change < 0
                      ? <TrendingDown className="h-3 w-3 text-red-500" />
                      : null}
                    <span className={cn(
                      'text-xs font-medium',
                      k.change > 0 ? 'text-green-600' : k.change < 0 ? 'text-red-600' : 'text-muted-foreground'
                    )}>
                      {k.change > 0 ? '+' : ''}{k.change.toFixed(1)}% vs prev period
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Revenue trend chart */}
          {overview?.revenue_trend && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Revenue Trend — Last {days} Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={overview.revenue_trend.map((p) => ({
                      date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      revenue: p.revenue,
                      transactions: p.transactions,
                    }))}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tick={{ fontSize: 11 }} />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div className="rounded-lg border border-border bg-card p-3 shadow-md text-sm">
                              <p className="font-semibold">{payload[0].payload.date}</p>
                              <p className="text-blue-600">Revenue: ${Number(payload[0].value).toLocaleString()}</p>
                              <p className="text-muted-foreground">Transactions: {payload[0].payload.transactions}</p>
                            </div>
                          );
                        }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category performance + Demand vs Price */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category bar chart */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Revenue by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={90} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="rounded-lg border border-border bg-card p-3 shadow-md text-sm">
                              <p className="font-semibold">{d.name}</p>
                              <p className="text-blue-600">Revenue: ${d.revenue.toLocaleString()}</p>
                              <p className="text-muted-foreground">Products: {d.products}</p>
                              <p className="text-muted-foreground">Avg Demand: {d.demand}</p>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Category Performance</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Products</TableHead>
                      <TableHead className="text-right">Avg Demand</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview?.category_performance.map((c) => (
                      <TableRow key={c.category}>
                        <TableCell className="font-medium">{c.category}</TableCell>
                        <TableCell className="text-right">${c.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                        <TableCell className="text-right">{c.product_count}</TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            'font-medium',
                            c.avg_demand >= 60 ? 'text-green-600' : c.avg_demand >= 40 ? 'text-yellow-600' : 'text-red-600'
                          )}>
                            {c.avg_demand.toFixed(1)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Optimization history */}
          {history && history.optimizations.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Optimization History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Products Affected</TableHead>
                      <TableHead className="text-right">Avg Price Change</TableHead>
                      <TableHead className="text-right">Est. Revenue Impact</TableHead>
                      <TableHead>Strategy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.optimizations.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="text-sm">
                          {new Date(o.timestamp).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="text-right">{o.products_affected}</TableCell>
                        <TableCell className="text-right">{o.avg_price_change.toFixed(1)}%</TableCell>
                        <TableCell className={cn(
                          'text-right font-medium',
                          o.estimated_revenue_impact >= 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          {o.estimated_revenue_impact >= 0 ? '+' : ''}
                          ${o.estimated_revenue_impact.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{o.strategy_used}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Pricing history from IO */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pricing Change History
              </CardTitle>
              {!historyLoaded && (
                <Button variant="outline" size="sm" onClick={loadPricingHistory} disabled={historyLoading}>
                  {historyLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Load History'}
                </Button>
              )}
            </CardHeader>
            <CardContent className={historyLoaded ? 'p-0' : undefined}>
              {!historyLoaded ? (
                <p className="text-sm text-muted-foreground">
                  Click "Load History" to fetch the full pricing change log.
                </p>
              ) : pricingHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground px-4 pb-4">No pricing history yet. Run an optimization with "Apply Prices" to generate records.</p>
              ) : (
                <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Old Price</TableHead>
                        <TableHead className="text-right">New Price</TableHead>
                        <TableHead className="text-right">Change</TableHead>
                        <TableHead>Triggered By</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pricingHistory.map((h) => (
                        <TableRow key={h.id}>
                          <TableCell className="font-medium text-sm">{h.product_name}</TableCell>
                          <TableCell className="text-right">${h.old_price.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">${h.new_price.toFixed(2)}</TableCell>
                          <TableCell className={cn(
                            'text-right font-medium',
                            h.price_change >= 0 ? 'text-green-600' : 'text-red-600'
                          )}>
                            {h.price_change >= 0 ? '+' : ''}${h.price_change.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{h.triggered_by}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(h.timestamp).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Predictive insights */}
          {insights && (
            <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-yellow-900 dark:text-yellow-100">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  AI Predictive Insights — {insights.forecast_period}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium mb-1">Predicted Revenue</p>
                    <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                      ${insights.predicted_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      Range: ${insights.confidence_interval.lower.toLocaleString(undefined, { maximumFractionDigits: 0 })} –
                      ${insights.confidence_interval.upper.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium mb-2">Recommended Actions</p>
                    <ul className="space-y-1">
                      {insights.recommended_actions.map((a, i) => (
                        <li key={i} className="text-xs text-yellow-800 dark:text-yellow-200 flex items-start gap-1">
                          <span className="text-yellow-500 mt-0.5">•</span> {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium mb-2">Risk Factors</p>
                    <ul className="space-y-1">
                      {insights.risk_factors.map((r, i) => (
                        <li key={i} className="text-xs text-yellow-800 dark:text-yellow-200 flex items-start gap-1">
                          <span className="text-red-400 mt-0.5">⚠</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
