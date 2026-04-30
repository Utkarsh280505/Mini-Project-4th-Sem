import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '@/types';
import { cn } from '@/lib/utils';

interface ProductsTableProps {
  products: Product[];
  total: number;
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}

export function ProductsTable({
  products,
  total,
  page,
  pages,
  onPageChange,
}: ProductsTableProps) {
  const getDemandBadge = (score: number) => {
    if (score >= 70) return { label: 'High', variant: 'default' as const };
    if (score >= 40) return { label: 'Medium', variant: 'secondary' as const };
    return { label: 'Low', variant: 'outline' as const };
  };

  const getPriceChangeColor = (percent?: number | null) => {
    if (!percent) return '';
    if (percent > 0) return 'text-green-600';
    if (percent < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Current Price</TableHead>
              <TableHead>Suggested Price</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>Demand</TableHead>
              <TableHead>Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const demandBadge = getDemandBadge(product.demand_score);
              return (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.category || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell>${product.current_price.toFixed(2)}</TableCell>
                  <TableCell>
                    {product.suggested_price ? (
                      <span className="font-medium text-blue-600">
                        ${product.suggested_price.toFixed(2)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {product.price_change_percent !== undefined &&
                    product.price_change_percent !== null ? (
                      <span
                        className={cn(
                          'font-medium',
                          getPriceChangeColor(product.price_change_percent)
                        )}
                      >
                        {product.price_change_percent > 0 ? '+' : ''}
                        {product.price_change_percent.toFixed(1)}%
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={demandBadge.variant}>{demandBadge.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        product.stock_quantity < 10 ? 'text-red-600 font-medium' : ''
                      )}
                    >
                      {product.stock_quantity}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {products.length} of {total} products
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {page} of {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
