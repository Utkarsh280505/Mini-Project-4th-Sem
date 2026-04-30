import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  description?: string;
}

export function KPICard({ title, value, change, icon, description }: KPICardProps) {
  const getTrend = (changeValue?: number) => {
    if (!changeValue) return 'neutral';
    if (changeValue > 0) return 'up';
    if (changeValue < 0) return 'down';
    return 'neutral';
  };

  const trend = getTrend(change);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center text-xs">
            {trend === 'up' && (
              <>
                <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                <span className="text-green-500">+{change.toFixed(1)}%</span>
              </>
            )}
            {trend === 'down' && (
              <>
                <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                <span className="text-red-500">{change.toFixed(1)}%</span>
              </>
            )}
            {trend === 'neutral' && (
              <>
                <Minus className="mr-1 h-3 w-3 text-gray-500" />
                <span className="text-gray-500">0%</span>
              </>
            )}
            {description && (
              <span className="ml-2 text-muted-foreground">{description}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
