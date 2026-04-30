from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional, List, Dict, Any


class KPIData(BaseModel):
    total_revenue: float
    revenue_change_percent: float
    demand_index: float
    demand_change_percent: float
    active_products: int
    products_change_percent: float
    avg_price_change: float
    price_change_percent: float


class TimeSeriesPoint(BaseModel):
    timestamp: datetime
    value: float
    label: Optional[str] = None


class DemandVsPricePoint(BaseModel):
    product_id: int
    product_name: str
    price: float
    demand_score: float
    category: Optional[str] = None


class RevenueTrendPoint(BaseModel):
    date: date
    revenue: float
    transactions: int
    avg_order_value: float


class CategoryPerformance(BaseModel):
    category: str
    revenue: float
    product_count: int
    avg_demand: float


class AnalyticsOverview(BaseModel):
    kpi: KPIData
    demand_vs_price: List[DemandVsPricePoint]
    revenue_trend: List[RevenueTrendPoint]
    category_performance: List[CategoryPerformance]


class DashboardSummary(BaseModel):
    total_products: int
    active_products: int
    optimized_today: int
    revenue_today: float
    revenue_this_month: float
    avg_optimization_impact: float


class OptimizationInsight(BaseModel):
    id: int
    timestamp: datetime
    products_affected: int
    avg_price_change: float
    estimated_revenue_impact: float
    strategy_used: str


class AnalyticsHistoryResponse(BaseModel):
    optimizations: List[OptimizationInsight]
    total: int


class PredictiveInsight(BaseModel):
    forecast_period: str
    predicted_revenue: float
    confidence_interval: Dict[str, float]
    recommended_actions: List[str]
    risk_factors: List[str]
