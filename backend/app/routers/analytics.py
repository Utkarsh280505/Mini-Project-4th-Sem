from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.analytics import (
    KPIData, AnalyticsOverview, DashboardSummary,
    AnalyticsHistoryResponse, PredictiveInsight
)
from app.services.analytics import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardSummary)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard summary data"""
    analytics_service = AnalyticsService(db)
    return analytics_service.get_dashboard_summary()


@router.get("/kpi", response_model=KPIData)
def get_kpi_data(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get key performance indicators"""
    analytics_service = AnalyticsService(db)
    return analytics_service.get_kpi_data(days=days)


@router.get("/overview", response_model=AnalyticsOverview)
def get_analytics_overview(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get complete analytics overview for dashboard"""
    analytics_service = AnalyticsService(db)
    
    return AnalyticsOverview(
        kpi=analytics_service.get_kpi_data(days=days),
        demand_vs_price=analytics_service.get_demand_vs_price_data(),
        revenue_trend=analytics_service.get_revenue_trend(days=days),
        category_performance=analytics_service.get_category_performance()
    )


@router.get("/demand-vs-price")
def get_demand_vs_price(
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get data for demand vs price scatter chart"""
    analytics_service = AnalyticsService(db)
    return analytics_service.get_demand_vs_price_data(limit=limit)


@router.get("/revenue-trend")
def get_revenue_trend(
    days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get revenue trend over time"""
    analytics_service = AnalyticsService(db)
    return analytics_service.get_revenue_trend(days=days)


@router.get("/category-performance")
def get_category_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get performance metrics by category"""
    analytics_service = AnalyticsService(db)
    return analytics_service.get_category_performance()


@router.get("/optimization-history", response_model=AnalyticsHistoryResponse)
def get_optimization_history(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get history of price optimizations"""
    analytics_service = AnalyticsService(db)
    optimizations = analytics_service.get_optimization_history(limit=limit)
    
    return AnalyticsHistoryResponse(
        optimizations=optimizations,
        total=len(optimizations)
    )


@router.get("/insights", response_model=PredictiveInsight)
def get_predictive_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get AI-powered predictive insights"""
    analytics_service = AnalyticsService(db)
    
    # Generate predictive insights based on current data
    from datetime import datetime, timedelta
    
    kpi = analytics_service.get_kpi_data(days=30)
    
    # Simple trend extrapolation for demo
    predicted_growth = 0.05 if kpi.revenue_change_percent > 0 else -0.02
    predicted_revenue = kpi.total_revenue * (1 + predicted_growth * 3)  # 3 months
    
    return PredictiveInsight(
        forecast_period="Next 90 days",
        predicted_revenue=round(predicted_revenue, 2),
        confidence_interval={
            "lower": round(predicted_revenue * 0.85, 2),
            "upper": round(predicted_revenue * 1.15, 2)
        },
        recommended_actions=[
            "Increase prices on high-demand, low-stock items",
            "Run promotions on items with declining demand",
            "Monitor competitor pricing weekly"
        ],
        risk_factors=[
            "Seasonal demand fluctuation",
            "Competitor price wars"
        ]
    )
