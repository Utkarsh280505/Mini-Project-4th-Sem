import { useState } from 'react';
import { Sparkles, Play, CheckCircle, RefreshCw, TrendingUp, Zap, Shield, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ioApi, IOOptimizedPrice } from '@/services/io';
import { cn } from '@/lib/utils';

type Strategy = 'revenue' | 'demand' | 'balanced';

const STRATEGIES: { id: Strategy; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: 'revenue',
    label: 'Maximize Revenue',
    desc: 'Aggressive pricing — push prices up where demand allows. Best for high-demand periods.',
    icon: <TrendingUp className="h-5 w-5 text-green-500" />,
  },
  {
    id: 'balanced',
    label: 'Balanced',
    desc: 'Balances revenue growth with demand retention. Recommended for most scenarios.',
    icon: <Target className="h-5 w-5 text-blue-500" />,
  },
  {
    id: 'demand',
    label: 'Maximize Demand',
    desc: 'Conservative pricing — prioritize volume and market share over margin.',
    icon: <Zap className="h-5 w-5 text-yellow-500" />,
  },
];

export function PricingEngine() {
  const [activeStrategy, setActiveStrategy] = useState<Strategy>('balanced');
  const [apply, setApply] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{
    optimizations: IOOptimizedPrice[];
    total_optimized: number;
    estimated_monthly_revenue_impact: number;
    timestamp: string;
  } | null>(null);
  const [error, setError] = useState('');

  // Realtime run-pricing
  const [realtimeRunning, setRealtimeRunning] = useState(false);
  const [realtimeResult, setRealtimeResult] = useState<string>('');

  // Market simulation
  const [marketRunning, setMarketRunning] = useState(false);
  const [marketResult, setMarketResult] = useState<string>('');

  const handleOptimize = async () => {
    setRunning(true);
    setError('');
    setResult(null);
    try {
      const res = await ioApi.optimizeOutput(undefined, apply);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization failed');
    } finally {
      setRunning(false);
    }
  };

  const handleRunPricing = async () => {
    setRealtimeRunning(true);
    setRealtimeResult('');
    try {
      const res = await ioApi.runPricing();
      setRealtimeResult(`Recalculated and saved prices for ${res.length} products.`);
    } catch {
      setRealtimeResult('Failed to run pricing.');
    } finally {
      setRealtimeRunning(false);
    }
  };

  const handleUpdateMarket = async () => {
    setMarketRunning(true);
    setMarketResult('');
    try {
      const res = await ioApi.updateMarket(0.5, 1.5) as { updated_count: number };
      setMarketResult(`Market simulation updated ${res.updated_count} products with new demand & inventory values.`);
    } catch {
      setMarketResult('Market update failed.');
    } finally {
      setMarketRunning(false);
    }
  };

  const impactColor = (pct: number) =>
    pct > 0 ? 'text-green-600' : pct < 0 ? 'text-red-600' : 'text-muted-foreground';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-blue-500" />
          Pricing Engine
        </h1>
        <p className="text-muted-foreground mt-1">
          AI-powered price optimization using demand forecasting and elasticity modeling.
        </p>
      </div>

      {/* How it works */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
        <CardContent className="pt-5 pb-4">
          <h2 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">How the AI Engine Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-sm">
            {[
              { step: '1', label: 'Market Data', desc: 'Ingest demand, inventory & competitor prices' },
              { step: '2', label: 'Demand Prediction', desc: 'Forecast demand using historical patterns' },
              { step: '3', label: 'Price Optimization', desc: 'Apply formula: base × demand × elasticity' },
              { step: '4', label: 'Business Rules', desc: 'Clamp to [0.5×, 2.0×] base price bounds' },
              { step: '5', label: 'Deployment', desc: 'Apply or preview — your choice' },
            ].map((s, i) => (
              <div key={s.step} className="flex items-start gap-2">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                  {s.step}
                </div>
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">{s.label}</p>
                  <p className="text-blue-700 dark:text-blue-300 text-xs">{s.desc}</p>
                </div>
                {i < 4 && <span className="hidden md:block text-blue-400 mt-1">→</span>}
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-900 rounded-md">
            <p className="text-xs font-mono text-blue-800 dark:text-blue-200">
              new_price = base_price × demand_factor × elasticity_factor
              &nbsp;&nbsp;|&nbsp;&nbsp;
              min = 0.5 × base_price &nbsp; max = 2.0 × base_price
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Controls */}
        <div className="space-y-4">
          {/* Strategy selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Optimization Strategy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {STRATEGIES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveStrategy(s.id)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border transition-all',
                    activeStrategy === s.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-border hover:bg-accent'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {s.icon}
                    <span className="font-medium text-sm">{s.label}</span>
                    {activeStrategy === s.id && (
                      <Badge className="ml-auto text-xs bg-blue-600 text-white">Selected</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Apply toggle */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Apply to Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setApply(false)}
                  className={cn(
                    'flex-1 py-2 rounded-md border text-sm font-medium transition-colors',
                    !apply ? 'bg-blue-600 text-white border-blue-600' : 'border-border text-foreground hover:bg-accent'
                  )}
                >
                  Preview Only
                </button>
                <button
                  onClick={() => setApply(true)}
                  className={cn(
                    'flex-1 py-2 rounded-md border text-sm font-medium transition-colors',
                    apply ? 'bg-green-600 text-white border-green-600' : 'border-border text-foreground hover:bg-accent'
                  )}
                >
                  Apply Prices
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {apply
                  ? '⚠ Prices will be written to the database and history recorded.'
                  : 'Preview mode — no changes saved.'}
              </p>
            </CardContent>
          </Card>

          {/* Run button */}
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
            onClick={handleOptimize}
            disabled={running}
          >
            {running ? (
              <><RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Running AI Optimization…</>
            ) : (
              <><Play className="mr-2 h-5 w-5" /> Run Optimization</>
            )}
          </Button>

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Realtime controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Real-Time Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleUpdateMarket}
                disabled={marketRunning}
              >
                <RefreshCw className={cn('mr-2 h-4 w-4', marketRunning && 'animate-spin')} />
                {marketRunning ? 'Simulating…' : 'Simulate Market Changes'}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleRunPricing}
                disabled={realtimeRunning}
              >
                <Zap className={cn('mr-2 h-4 w-4', realtimeRunning && 'animate-spin')} />
                {realtimeRunning ? 'Running…' : 'Run & Save Pricing'}
              </Button>
              {marketResult && (
                <p className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 rounded p-2">{marketResult}</p>
              )}
              {realtimeResult && (
                <p className="text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950 rounded p-2">{realtimeResult}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2 space-y-4">
          {result ? (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4 pb-3 text-center">
                    <p className="text-xs text-muted-foreground">Products Optimized</p>
                    <p className="text-2xl font-bold mt-1">{result.total_optimized}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3 text-center">
                    <p className="text-xs text-muted-foreground">Est. Monthly Impact</p>
                    <p className={cn('text-2xl font-bold mt-1', impactColor(result.estimated_monthly_revenue_impact))}>
                      {result.estimated_monthly_revenue_impact >= 0 ? '+' : ''}
                      ${Math.abs(result.estimated_monthly_revenue_impact).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3 text-center">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-bold text-green-600">{apply ? 'Applied' : 'Preview'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Results table */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Optimization Results</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Old Price</TableHead>
                          <TableHead className="text-right">New Price</TableHead>
                          <TableHead className="text-right">Change</TableHead>
                          <TableHead className="text-right">Demand ×</TableHead>
                          <TableHead className="text-right">Elasticity ×</TableHead>
                          <TableHead>Applied</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.optimizations.map((opt) => (
                          <TableRow key={opt.product_id}>
                            <TableCell className="font-medium text-sm max-w-[160px] truncate">
                              {opt.product_name}
                            </TableCell>
                            <TableCell className="text-right">${opt.old_price.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium text-blue-600">
                              ${opt.new_price.toFixed(2)}
                            </TableCell>
                            <TableCell className={cn('text-right font-medium', impactColor(opt.price_change_percent))}>
                              {opt.price_change_percent > 0 ? '+' : ''}{opt.price_change_percent.toFixed(1)}%
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">{opt.demand_factor.toFixed(2)}×</TableCell>
                            <TableCell className="text-right text-muted-foreground">{opt.elasticity_factor.toFixed(2)}×</TableCell>
                            <TableCell>
                              {opt.applied
                                ? <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Saved</Badge>
                                : <Badge variant="outline">Preview</Badge>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="h-full min-h-[300px] flex items-center justify-center">
              <CardContent className="text-center py-16">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No results yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a strategy and click <strong>Run Optimization</strong> to see AI-suggested prices.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Pricing formula reference */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pricing Formula Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-accent rounded-lg">
              <p className="font-semibold mb-1">Demand Factor</p>
              <code className="text-xs">0.5 + (demand_score / 100) × 1.0</code>
              <p className="text-xs text-muted-foreground mt-1">Normalizes 0–100 demand score to 0.5–1.5 multiplier</p>
            </div>
            <div className="p-3 bg-accent rounded-lg">
              <p className="font-semibold mb-1">Elasticity Factor</p>
              <code className="text-xs">inelastic=1.08 | neutral=1.00 | elastic=0.95</code>
              <p className="text-xs text-muted-foreground mt-1">Based on price elasticity coefficient stored per product</p>
            </div>
            <div className="p-3 bg-accent rounded-lg">
              <p className="font-semibold mb-1">Price Bounds</p>
              <code className="text-xs">min = 0.5 × base_price &nbsp; max = 2.0 × base_price</code>
              <p className="text-xs text-muted-foreground mt-1">Rule-based safeguard — prevents extreme price swings</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
