import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DemandVsPricePoint } from '@/types';

interface DemandPriceChartProps {
  data: DemandVsPricePoint[];
}

// Colour by demand level
function demandColor(score: number) {
  if (score >= 70) return '#22c55e';   // green  — high
  if (score >= 40) return '#f59e0b';   // amber  — medium
  return '#ef4444';                     // red    — low
}

export function DemandPriceChart({ data }: DemandPriceChartProps) {
  // ── Chart 1: avg demand score per category ─────────────────────────────────
  const categoryData = useMemo(() => {
    const map: Record<string, { total: number; count: number; avgPrice: number; priceTotal: number }> = {};
    data.forEach((p) => {
      if (p.demand_score <= 0) return;          // skip bad rows
      const cat = p.category || 'Other';
      if (!map[cat]) map[cat] = { total: 0, count: 0, avgPrice: 0, priceTotal: 0 };
      map[cat].total      += p.demand_score;
      map[cat].priceTotal += p.price;
      map[cat].count      += 1;
    });
    return Object.entries(map)
      .map(([cat, v]) => ({
        category:  cat.length > 14 ? cat.slice(0, 13) + '…' : cat,
        fullName:  cat,
        demand:    Math.round(v.total / v.count),
        avgPrice:  Math.round(v.priceTotal / v.count),
        products:  v.count,
      }))
      .sort((a, b) => b.demand - a.demand);
  }, [data]);

  // ── Chart 2: demand distribution buckets ──────────────────────────────────
  const buckets = useMemo(() => {
    const b = [
      { label: '0–20',   min: 0,  max: 20,  count: 0 },
      { label: '21–40',  min: 21, max: 40,  count: 0 },
      { label: '41–60',  min: 41, max: 60,  count: 0 },
      { label: '61–80',  min: 61, max: 80,  count: 0 },
      { label: '81–100', min: 81, max: 100, count: 0 },
    ];
    data.forEach((p) => {
      if (p.demand_score <= 0) return;
      const bucket = b.find((bk) => p.demand_score >= bk.min && p.demand_score <= bk.max);
      if (bucket) bucket.count++;
    });
    return b;
  }, [data]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Demand by Category</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
          No data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium">Demand Analysis</CardTitle>
        <p className="text-xs text-muted-foreground">
          Average demand score per category · distribution of all products
        </p>
      </CardHeader>
      <CardContent className="pt-2 space-y-5">

        {/* ── Chart 1: Avg demand by category (horizontal bars) ─────────────── */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Avg Demand Score by Category
          </p>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ top: 0, right: 40, bottom: 0, left: 4 }}
                barSize={18}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `${v}`}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  width={88}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--accent))' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-border bg-card p-3 shadow-md text-xs">
                        <p className="font-semibold mb-1">{d.fullName}</p>
                        <p>Avg Demand: <strong>{d.demand}</strong> / 100</p>
                        <p>Avg Price: <strong>${d.avgPrice}</strong></p>
                        <p>Products: <strong>{d.products}</strong></p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="demand" radius={[0, 4, 4, 0]}>
                  {categoryData.map((entry) => (
                    <Cell key={entry.category} fill={demandColor(entry.demand)} />
                  ))}
                  <LabelList
                    dataKey="demand"
                    position="right"
                    style={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--foreground))' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Chart 2: Demand distribution (vertical bars) ──────────────────── */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Demand Score Distribution
          </p>
          <div className="h-[130px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={buckets}
                margin={{ top: 4, right: 8, bottom: 0, left: -10 }}
                barSize={32}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--accent))' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-border bg-card p-2 shadow-md text-xs">
                        <p>Score <strong>{d.label}</strong></p>
                        <p><strong>{d.count}</strong> products</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {buckets.map((b) => (
                    <Cell
                      key={b.label}
                      fill={
                        b.min >= 61 ? '#22c55e' :
                        b.min >= 41 ? '#f59e0b' :
                        b.min >= 21 ? '#fb923c' : '#ef4444'
                      }
                    />
                  ))}
                  <LabelList
                    dataKey="count"
                    position="top"
                    style={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--foreground))' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Colour legend */}
          <div className="flex items-center gap-4 mt-2 pt-2 border-t border-border">
            {[
              { label: 'High (61–100)', color: '#22c55e' },
              { label: 'Medium (41–60)', color: '#f59e0b' },
              { label: 'Low (0–40)', color: '#ef4444' },
            ].map((l) => (
              <span key={l.label} className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-sm inline-block" style={{ background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
