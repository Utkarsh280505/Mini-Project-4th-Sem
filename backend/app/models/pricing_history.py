from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, String, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class PricingHistory(Base):
    __tablename__ = "pricing_history"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    old_price = Column(Float, nullable=False)
    new_price = Column(Float, nullable=False)
    demand_score_at_change = Column(Float, nullable=True)
    elasticity_at_change = Column(Float, nullable=True)
    optimization_reason = Column(Text, nullable=True)
    triggered_by = Column(String(50), default="system")  # system, user, scheduled
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    product = relationship("Product", back_populates="pricing_history")

    def __repr__(self):
        return f"<PricingHistory(id={self.id}, product_id={self.product_id}, old={self.old_price}, new={self.new_price})>"
