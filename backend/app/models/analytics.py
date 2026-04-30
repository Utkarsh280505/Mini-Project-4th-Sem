from sqlalchemy import Column, Integer, Float, DateTime, String, Date
from sqlalchemy.sql import func
from app.core.database import Base


class DailyAnalytics(Base):
    __tablename__ = "daily_analytics"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True, unique=True)
    
    # Revenue metrics
    total_revenue = Column(Float, default=0.0)
    total_transactions = Column(Integer, default=0)
    average_order_value = Column(Float, default=0.0)
    
    # Pricing metrics
    total_price_changes = Column(Integer, default=0)
    avg_price_change_percent = Column(Float, default=0.0)
    
    # Demand metrics
    avg_demand_index = Column(Float, default=50.0)
    demand_trend = Column(String(20), default="stable")  # increasing, decreasing, stable
    
    # Product metrics
    active_products = Column(Integer, default=0)
    low_stock_products = Column(Integer, default=0)
    
    # AI optimization metrics
    optimizations_run = Column(Integer, default=0)
    revenue_impact = Column(Float, default=0.0)  # estimated revenue impact from optimizations
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<DailyAnalytics(date={self.date}, revenue={self.total_revenue})>"


class HourlyMetrics(Base):
    __tablename__ = "hourly_metrics"

    id = Column(Integer, primary_key=True, index=True)
    hour = Column(DateTime, nullable=False, index=True)
    
    demand_index = Column(Float, default=50.0)
    avg_price = Column(Float, default=0.0)
    transaction_count = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
