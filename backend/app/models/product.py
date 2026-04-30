from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    base_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    min_price = Column(Float, nullable=False, default=0.0)
    max_price = Column(Float, nullable=True)
    stock_quantity = Column(Integer, default=0)
    category = Column(String(100), nullable=True, index=True)
    is_active = Column(Boolean, default=True)
    
    # Demand metrics
    demand_score = Column(Float, default=50.0)  # 0-100 scale
    price_elasticity = Column(Float, default=-1.0)
    competitor_price = Column(Float, nullable=True)
    
    # ML features
    historical_demand = Column(Float, default=0.0)
    seasonality_factor = Column(Float, default=1.0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    pricing_history = relationship("PricingHistory", back_populates="product", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Product(id={self.id}, name={self.name}, sku={self.sku})>"
