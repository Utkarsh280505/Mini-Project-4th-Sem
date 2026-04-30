import { apiService } from './api';
import {
  DashboardSummary,
  KPIData,
  AnalyticsOverview,
  AnalyticsHistoryResponse,
  PredictiveInsight,
} from '@/types';

export const analyticsApi = {
  // Get dashboard summary
  getDashboardSummary: () => apiService.get<DashboardSummary>('/analytics/dashboard'),

  // Get KPI data
  getKPIData: (days?: number) => apiService.get<KPIData>('/analytics/kpi', { days }),

  // Get full analytics overview
  getAnalyticsOverview: (days?: number) =>
    apiService.get<AnalyticsOverview>('/analytics/overview', { days }),

  // Get demand vs price data
  getDemandVsPrice: (limit?: number) =>
    apiService.get('/analytics/demand-vs-price', { limit }),

  // Get revenue trend
  getRevenueTrend: (days?: number) =>
    apiService.get('/analytics/revenue-trend', { days }),

  // Get category performance
  getCategoryPerformance: () => apiService.get('/analytics/category-performance'),

  // Get optimization history
  getOptimizationHistory: (limit?: number) =>
    apiService.get<AnalyticsHistoryResponse>('/analytics/optimization-history', { limit }),

  // Get predictive insights
  getPredictiveInsights: () => apiService.get<PredictiveInsight>('/analytics/insights'),
};
