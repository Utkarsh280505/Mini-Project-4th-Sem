import { apiService } from './api';
import {
  Product,
  ProductListResponse,
  PriceOptimizationResponse,
  OptimizationRequest,
} from '@/types';

export const productApi = {
  // Get all products with pagination and filters
  getProducts: (params?: {
    skip?: number;
    limit?: number;
    category?: string;
    search?: string;
    is_active?: boolean;
  }) => apiService.get<ProductListResponse>('/products', params),

  // Get single product
  getProduct: (id: number) => apiService.get<Product>(`/products/${id}`),

  // Create product
  createProduct: (data: Partial<Product>) => apiService.post<Product>('/products', data),

  // Update product
  updateProduct: (id: number, data: Partial<Product>) =>
    apiService.put<Product>(`/products/${id}`, data),

  // Delete product
  deleteProduct: (id: number) => apiService.delete(`/products/${id}`),

  // Get categories
  getCategories: () => apiService.get<{ categories: string[] }>('/products/categories'),

  // Get product stats
  getProductStats: () => apiService.get('/products/stats'),

  // Bulk price update
  bulkPriceUpdate: (data: {
    product_ids: number[];
    price_adjustment_percent: number;
    min_price?: number;
    max_price?: number;
  }) => apiService.post('/products/bulk-update', data),

  // Price optimization
  optimizePrices: (data: OptimizationRequest) =>
    apiService.post<PriceOptimizationResponse>('/pricing/optimize', data),

  // Apply optimizations
  applyOptimizations: (optimizationIds?: number[]) =>
    apiService.post('/pricing/apply', { optimization_ids: optimizationIds, apply_all: !optimizationIds }),

  // Get demand forecast
  getDemandForecast: (productId: number, days?: number) =>
    apiService.get(`/pricing/forecast/${productId}`, { days }),

  // Get price elasticity analysis
  getPriceElasticity: (productId: number) =>
    apiService.get(`/pricing/elasticity/${productId}`),

  // Simulate price change
  simulatePriceChange: (productId: number, newPrice: number) =>
    apiService.post('/pricing/simulate', { product_id: productId, new_price: newPrice }),
};
