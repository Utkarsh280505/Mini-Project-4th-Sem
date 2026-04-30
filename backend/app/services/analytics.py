from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta, date
from typing import List, Dict, Optional
import random

from app.models.product import Product
from app.models.pricing_history import PricingHistory
from app.models.analytics import DailyAnalytics, HourlyMetrics
from app.schemas.analytics import (
    KPIData, DemandVsPricePoint, RevenueTrendPoint,
    CategoryPerformance, DashboardSummary, OptimizationInsight
)
from app.core.logging import get_logger

logger = get_logger(__name__)


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_summary(self) -> DashboardSummary:
        """Get high-level dashboard metrics"""
        today = date.today()
        
        # Product counts
        total_products = self.db.query(Product).count()
        active_products = self.db.query(Product).filter(Product.is_active == True).count()
        
        # Today's optimizations
        optimized_today = self.db.query(PricingHistory).filter(
            func.date(PricingHistory.created_at) == today
        ).count()
        
        # Today's analytics (simulated for demo)
        today_analytics = self._get_or_create_daily_analytics(today)
        
        # This month's revenue (simulated)
        revenue_this_month = self._calculate_monthly_revenue()
        
        # Average optimization impact
        avg_impact = self._calculate_avg_optimization_impact()
        
        return DashboardSummary(
            total_products=total_products,
            active_products=active_products,
            optimized_today=optimized_today,
            revenue_today=today_analytics.total_revenue,
            revenue_this_month=revenue_this_month,
            avg_optimization_impact=avg_impact
        )

    def get_kpi_data(self, days: int = 30) -> KPIData:
        """Get key performance indicators"""
        today = date.today()
        
        # Current values
        current_revenue = self._calculate_revenue(today)
        current_demand = self._calculate_avg_demand()
        active_products = self.db.query(Product).filter(Product.is_active == True).count()
        avg_price = self.db.query(func.avg(Product.current_price)).scalar() or 0
        
        # Previous period values (for comparison)
        prev_date = today - timedelta(days=days)
        prev_revenue = self._calculate_revenue(prev_date)
        prev_demand = current_demand * 0.95  # Simulated 5% growth
        prev_products = active_products - 2
        prev_avg_price = avg_price * 0.98
        
        # Calculate percentage changes
        revenue_change = self._calc_pct_change(current_revenue, prev_revenue)
        demand_change = self._calc_pct_change(current_demand, prev_demand)
        products_change = self._calc_pct_change(active_products, prev_products)
        price_change = self._calc_pct_change(avg_price, prev_avg_price)
        
        return KPIData(
            total_revenue=round(current_revenue, 2),
            revenue_change_percent=round(revenue_change, 2),
            demand_index=round(current_demand, 2),
            demand_change_percent=round(demand_change, 2),
            active_products=active_products,
            products_change_percent=round(products_change, 2),
            avg_price_change=round(avg_price, 2),
            price_change_percent=round(price_change, 2)
        )

    def get_demand_vs_price_data(self, limit: int = 100) -> List[DemandVsPricePoint]:
        """Get data for demand vs price — only products with a named category"""
        products = self.db.query(Product).filter(
            Product.is_active == True,
            Product.category.isnot(None),
            Product.category != "",
            Product.demand_score > 0
        ).limit(limit).all()

        return [
            DemandVsPricePoint(
                product_id=p.id,
                product_name=p.name,
                price=round(p.current_price, 2),
                demand_score=round(p.demand_score, 2),
                category=p.category
            )
            for p in products
        ]

    def get_revenue_trend(self, days: int = 30) -> List[RevenueTrendPoint]:
        """Get revenue trend over time"""
        trend = []
        today = date.today()
        
        for i in range(days, -1, -1):
            d = today - timedelta(days=i)
            analytics = self._get_or_create_daily_analytics(d)
            
            trend.append(RevenueTrendPoint(
                date=d,
                revenue=round(analytics.total_revenue, 2),
                transactions=analytics.total_transactions,
                avg_order_value=round(analytics.average_order_value, 2)
            ))
        
        return trend

    def get_category_performance(self) -> List[CategoryPerformance]:
        """Get performance metrics by category"""
        categories = self.db.query(Product.category).distinct().filter(
            Product.category.isnot(None)
        ).all()
        
        performance = []
        for (category,) in categories:
            if not category:
                continue
            
            products = self.db.query(Product).filter(Product.category == category).all()
            
            # Simulated metrics
            revenue = sum(p.current_price * (p.historical_demand or 50) for p in products)
            avg_demand = sum(p.demand_score for p in products) / len(products) if products else 0
            
            performance.append(CategoryPerformance(
                category=category,
                revenue=round(revenue, 2),
                product_count=len(products),
                avg_demand=round(avg_demand, 2)
            ))
        
        return sorted(performance, key=lambda x: x.revenue, reverse=True)

    def get_optimization_history(self, limit: int = 50) -> List[OptimizationInsight]:
        """Get history of optimization runs"""
        history = self.db.query(PricingHistory).order_by(
            PricingHistory.created_at.desc()
        ).limit(limit).all()
        
        # Group by date
        grouped = {}
        for h in history:
            date_key = h.created_at.date() if h.created_at else date.today()
            if date_key not in grouped:
                grouped[date_key] = {
                    "count": 0,
                    "avg_change": 0,
                    "items": []
                }
            grouped[date_key]["count"] += 1
            if h.old_price > 0:
                change_pct = abs(h.new_price - h.old_price) / h.old_price * 100
                grouped[date_key]["items"].append(change_pct)
        
        insights = []
        for date_key, data in grouped.items():
            avg_change = sum(data["items"]) / len(data["items"]) if data["items"] else 0
            
            insights.append(OptimizationInsight(
                id=len(insights) + 1,
                timestamp=datetime.combine(date_key, datetime.min.time()),
                products_affected=data["count"],
                avg_price_change=round(avg_change, 2),
                estimated_revenue_impact=round(data["count"] * avg_change * 10, 2),
                strategy_used="revenue"
            ))
        
        return sorted(insights, key=lambda x: x.timestamp, reverse=True)[:limit]

    def _get_or_create_daily_analytics(self, analytics_date: date) -> DailyAnalytics:
        """Get or create daily analytics record — deterministic based on product data"""
        analytics = self.db.query(DailyAnalytics).filter(
            DailyAnalytics.date == analytics_date
        ).first()

        if not analytics:
            # Base revenue on actual product prices × estimated daily units
            products = self.db.query(Product).filter(Product.is_active == True).all()
            if products:
                # Each product sells ~(demand_score/100 * 5) units/day on average
                base_revenue = sum(
                    p.current_price * max(1, int((p.demand_score or 50) / 100 * 5))
                    for p in products
                )
                # Add a small deterministic day-of-week variation (no random)
                day_factor = 1.0 + 0.08 * (analytics_date.weekday() % 3 - 1)  # ±8%
                total_revenue = round(base_revenue * day_factor, 2)
                transactions = max(10, int(len(products) * 0.6))
            else:
                total_revenue = 5000.0
                transactions = 30

            analytics = DailyAnalytics(
                date=analytics_date,
                total_revenue=total_revenue,
                total_transactions=transactions,
                average_order_value=round(total_revenue / max(1, transactions), 2),
                total_price_changes=0,
                avg_demand_index=round(
                    sum(p.demand_score for p in products) / len(products)
                    if products else 50.0, 2
                ),
                active_products=len(products),
                low_stock_products=sum(1 for p in products if p.stock_quantity < 10),
                optimizations_run=0,
                revenue_impact=0.0
            )
            self.db.add(analytics)
            self.db.commit()

        return analytics

    def _calculate_revenue(self, target_date: date) -> float:
        """Calculate total revenue for a date"""
        analytics = self._get_or_create_daily_analytics(target_date)
        return analytics.total_revenue

    def _calculate_avg_demand(self) -> float:
        """Calculate average demand score across all products"""
        avg = self.db.query(func.avg(Product.demand_score)).scalar()
        return avg or 50.0

    def _calculate_monthly_revenue(self) -> float:
        """Calculate total revenue for current month"""
        today = date.today()
        days_in_month = today.day
        
        total = 0
        for i in range(days_in_month):
            d = today - timedelta(days=i)
            analytics = self._get_or_create_daily_analytics(d)
            total += analytics.total_revenue
        
        return round(total, 2)

    def _calculate_avg_optimization_impact(self) -> float:
        """Calculate average revenue impact from optimizations"""
        result = self.db.query(func.avg(DailyAnalytics.revenue_impact)).filter(
            DailyAnalytics.revenue_impact > 0
        ).scalar()
        return round(result or 0, 2)

    def _calc_pct_change(self, current: float, previous: float) -> float:
        """Calculate percentage change between two values"""
        if previous == 0:
            return 0.0
        return ((current - previous) / previous) * 100
