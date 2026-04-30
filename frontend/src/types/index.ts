// Auth Types
export interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_admin: boolean;
  role: string;
  created_at: string;
  updated_at: string | null;
  last_login: string | null;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
}

// Product Types
export interface Product {
  id: number;
  name: string;
  description: string | null;
  sku: string;
  base_price: number;
  current_price: number;
  min_price: number;
  max_price: number | null;
  stock_quantity: number;
  category: string | null;
  is_active: boolean;
  demand_score: number;
  price_elasticity: number;
  competitor_price: number | null;
  historical_demand: number;
  seasonality_factor: number;
  created_at: string;
  updated_at: string | null;
  suggested_price?: number | null;
  price_change_percent?: number | null;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface OptimizedPrice {
  product_id: number;
  old_price: number;
  suggested_price: number;
  confidence_score: number;
  expected_revenue_change: number;
  expected_demand_change: number;
  optimization_reason: string;
}

export interface PriceOptimizationResponse {
  optimizations: OptimizedPrice[];
  total_revenue_impact: number;
  products_optimized: number;
  timestamp: string;
}

export interface OptimizationRequest {
  product_ids?: number[];
  optimization_strategy: 'revenue' | 'demand' | 'balanced';
  min_margin_percent: number;
}

// Analytics Types
export interface KPIData {
  total_revenue: number;
  revenue_change_percent: number;
  demand_index: number;
  demand_change_percent: number;
  active_products: number;
  products_change_percent: number;
  avg_price_change: number;
  price_change_percent: number;
}

export interface DemandVsPricePoint {
  product_id: number;
  product_name: string;
  price: number;
  demand_score: number;
  category: string | null;
}

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
  transactions: number;
  avg_order_value: number;
}

export interface CategoryPerformance {
  category: string;
  revenue: number;
  product_count: number;
  avg_demand: number;
}

export interface DashboardSummary {
  total_products: number;
  active_products: number;
  optimized_today: number;
  revenue_today: number;
  revenue_this_month: number;
  avg_optimization_impact: number;
}

export interface AnalyticsOverview {
  kpi: KPIData;
  demand_vs_price: DemandVsPricePoint[];
  revenue_trend: RevenueTrendPoint[];
  category_performance: CategoryPerformance[];
}

// Optimization History Types
export interface OptimizationInsight {
  id: number;
  timestamp: string;
  products_affected: number;
  avg_price_change: number;
  estimated_revenue_impact: number;
  strategy_used: string;
}

export interface AnalyticsHistoryResponse {
  optimizations: OptimizationInsight[];
  total: number;
}

// Predictive Insights
export interface PredictiveInsight {
  forecast_period: string;
  predicted_revenue: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  recommended_actions: string[];
  risk_factors: string[];
}

// UI Types
export interface NavItem {
  title: string;
  href: string;
  icon: string;
}

export interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: unknown;
  description?: string;
}
