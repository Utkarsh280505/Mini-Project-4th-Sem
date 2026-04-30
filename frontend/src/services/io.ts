import { apiService } from './api';

export interface IOProduct {
  product_id: number;
  name: string;
  base_price: number;
  current_price: number;
  demand: number;
  inventory: number;
  competitor_price: number | null;
}

export interface IOProductListResponse {
  products: IOProduct[];
  total_count: number;
  timestamp: string;
}

export interface IOOptimizedPrice {
  product_id: number;
  product_name: string;
  old_price: number;
  new_price: number;
  demand_factor: number;
  elasticity_factor: number;
  price_change_percent: number;
  inventory_level: number;
  competitor_price: number | null;
  applied: boolean;
  reason: string | null;
}

export interface IOOptimizeResponse {
  optimizations: IOOptimizedPrice[];
  total_optimized: number;
  estimated_monthly_revenue_impact: number;
  timestamp: string;
}

export interface IOPricingHistoryRecord {
  id: number;
  product_id: number;
  product_name: string;
  old_price: number;
  new_price: number;
  price_change: number;
  demand_score: number | null;
  elasticity: number | null;
  reason: string | null;
  triggered_by: string;
  timestamp: string;
}

export interface IOPricingHistoryResponse {
  records: IOPricingHistoryRecord[];
  total_count: number;
  product_id: number | null;
  timestamp: string;
}

export interface CSVUploadResponse {
  imported: number;
  updated: number;
  errors: string[];
  total_processed: number;
  message: string;
}

export interface SimulateInputResponse {
  updated_count: number;
  updates: Array<{
    product_id: number;
    product_name: string;
    demand: { old: number; new: number; change_percent: number };
    inventory: { old: number; new: number; units_sold: number };
  }>;
  timestamp: string;
}

export interface RealtimeOptimizedPrice {
  product_id: string;
  base_price: number;
  demand: number;
  optimized_price: number;
}

export const ioApi = {
  // GET /io/products
  getProducts: (limit = 100, offset = 0) =>
    apiService.get<IOProductListResponse>('/io/products', { limit, offset }),

  // POST /io/optimize-output
  optimizeOutput: (productIds?: number[], apply = false) =>
    apiService.post<IOOptimizeResponse>('/io/optimize-output', {
      product_ids: productIds ?? null,
      apply,
    }),

  // GET /io/pricing-history
  getPricingHistory: (productId?: number, limit = 100) =>
    apiService.get<IOPricingHistoryResponse>('/io/pricing-history', {
      product_id: productId,
      limit,
    }),

  // POST /io/upload-csv
  uploadCSV: async (file: File): Promise<CSVUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('access_token');
    const baseUrl =
      localStorage.getItem('api_base_url') ||
      (import.meta.env.VITE_API_URL as string) ||
      'http://localhost:8001/api/v1';
    const res = await fetch(`${baseUrl}/io/upload-csv`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  // POST /io/simulate-input
  simulateInput: (productIds?: number[], demandVariance = 0.3, inventoryVariance = 0.2) =>
    apiService.post<SimulateInputResponse>('/io/simulate-input', {
      product_ids: productIds ?? null,
      demand_variance: demandVariance,
      inventory_variance: inventoryVariance,
    }),

  // POST /ingest-data (realtime)
  ingestData: (data: {
    product_id: string;
    base_price: number;
    demand: number;
    inventory: number;
    competitor_price?: number;
  }) => apiService.post('/ingest-data', data),

  // POST /update-market (realtime)
  updateMarket: (demandMin = 0.5, demandMax = 1.5) =>
    apiService.post('/update-market', { demand_min: demandMin, demand_max: demandMax }),

  // GET /optimized-prices (realtime)
  getOptimizedPrices: () =>
    apiService.get<RealtimeOptimizedPrice[]>('/optimized-prices'),

  // POST /run-pricing (realtime)
  runPricing: () =>
    apiService.post<RealtimeOptimizedPrice[]>('/run-pricing'),

  // DELETE /io/uploaded-products
  deleteUploadedProducts: (skus?: string[]) =>
    apiService.delete<{ deleted: number; deleted_skus: string[]; message: string }>(
      `/io/uploaded-products${skus && skus.length ? '?skus=' + skus.join('&skus=') : ''}`
    ),
};
