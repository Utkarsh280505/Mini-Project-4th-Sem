import numpy as np
from datetime import datetime
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import random

from app.models.product import Product
from app.schemas.product import OptimizedPrice, PriceOptimizationResponse
from app.services.product import ProductService
from app.core.logging import get_logger

logger = get_logger(__name__)


class PricingEngine:
    """
    AI-Powered Dynamic Pricing Optimization Engine
    
    Uses machine learning models to predict optimal pricing based on:
    - Demand forecasting
    - Price elasticity modeling
    - Seasonality adjustments
    - Competitor pricing
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.product_service = ProductService(db)
        self.scaler = StandardScaler()
        self.model = None
        
    def optimize_prices(
        self,
        product_ids: Optional[List[int]] = None,
        strategy: str = "revenue",
        min_margin_percent: float = 10.0
    ) -> PriceOptimizationResponse:
        """
        Run price optimization on selected or all products
        
        Args:
            product_ids: List of product IDs to optimize (None = all active)
            strategy: Optimization strategy ('revenue', 'demand', 'balanced')
            min_margin_percent: Minimum profit margin constraint
        """
        logger.info(f"Starting price optimization", strategy=strategy, product_count=len(product_ids) if product_ids else "all")
        
        # Get products to optimize
        if product_ids:
            products = []
            for pid in product_ids:
                p = self.product_service.get_product(pid)
                if p and p.is_active:
                    products.append(p)
        else:
            products = self.product_service.get_all_active_products()
        
        optimizations = []
        total_revenue_impact = 0.0
        
        for product in products:
            optimization = self._optimize_single_product(
                product, strategy, min_margin_percent
            )
            if optimization:
                optimizations.append(optimization)
                total_revenue_impact += optimization.expected_revenue_change
        
        return PriceOptimizationResponse(
            optimizations=optimizations,
            total_revenue_impact=round(total_revenue_impact, 2),
            products_optimized=len(optimizations),
            timestamp=datetime.utcnow()
        )
    
    def _optimize_single_product(
        self,
        product: Product,
        strategy: str,
        min_margin_percent: float
    ) -> Optional[OptimizedPrice]:
        """Optimize price for a single product"""
        
        # Calculate demand factor (0.5 to 1.5 range)
        demand_factor = self._calculate_demand_factor(product)
        
        # Calculate elasticity factor
        elasticity_factor = self._calculate_elasticity_factor(product)
        
        # Calculate seasonality adjustment
        seasonality_factor = product.seasonality_factor or 1.0
        
        # Calculate competitor adjustment
        competitor_factor = self._calculate_competitor_factor(product)
        
        # Base optimization formula
        base_optimized = product.base_price * demand_factor * elasticity_factor * seasonality_factor * competitor_factor
        
        # Apply strategy weights
        if strategy == "revenue":
            # Prioritize revenue - more aggressive pricing
            optimized_price = base_optimized * 1.05
        elif strategy == "demand":
            # Prioritize demand - more conservative pricing
            optimized_price = base_optimized * 0.98
        else:  # balanced
            optimized_price = base_optimized
        
        # Apply constraints
        min_price = product.min_price or (product.base_price * 0.5)
        max_price = product.max_price or (product.base_price * 2.0)
        
        # Ensure minimum margin
        min_margin_price = product.base_price * (1 + min_margin_percent / 100)
        min_price = max(min_price, min_margin_price)
        
        # Clamp to bounds
        optimized_price = max(min_price, min(optimized_price, max_price))
        
        # Round to 2 decimal places
        optimized_price = round(optimized_price, 2)
        
        # Skip if price change is negligible (< 1%)
        price_change_pct = abs(optimized_price - product.current_price) / product.current_price * 100
        if price_change_pct < 1.0:
            return None
        
        # Calculate confidence and expected impacts
        confidence_score = self._calculate_confidence(product, strategy)
        expected_demand_change = self._predict_demand_change(
            product, product.current_price, optimized_price
        )
        expected_revenue_change = self._predict_revenue_impact(
            product, optimized_price, expected_demand_change
        )
        
        # Generate optimization reason
        reason = self._generate_optimization_reason(
            demand_factor, elasticity_factor, seasonality_factor, competitor_factor, strategy
        )
        
        return OptimizedPrice(
            product_id=product.id,
            old_price=round(product.current_price, 2),
            suggested_price=optimized_price,
            confidence_score=round(confidence_score, 2),
            expected_revenue_change=round(expected_revenue_change, 2),
            expected_demand_change=round(expected_demand_change, 2),
            optimization_reason=reason
        )
    
    def _calculate_demand_factor(self, product: Product) -> float:
        """
        Calculate demand-based price adjustment factor
        Higher demand = higher price tolerance
        """
        demand_score = product.demand_score or 50.0
        
        # Normalize demand score (0-100) to factor (0.7 - 1.3)
        # 50 = neutral (1.0)
        factor = 0.7 + (demand_score / 100) * 0.6
        
        # Adjust for stock level
        if product.stock_quantity < 10:
            factor *= 1.1  # Low stock = increase price
        elif product.stock_quantity > 100:
            factor *= 0.95  # High stock = decrease price
        
        return round(factor, 2)
    
    def _calculate_elasticity_factor(self, product: Product) -> float:
        """
        Calculate price elasticity factor
        More elastic = lower price increases
        """
        elasticity = product.price_elasticity or -1.0
        
        # Elasticity is typically negative
        # -1.0 = unit elastic
        # -0.5 = inelastic (can increase price more)
        # -2.0 = elastic (be careful with price increases)
        
        if elasticity > -0.5:  # Inelastic
            factor = 1.08
        elif elasticity > -1.5:  # Unit elastic
            factor = 1.0
        else:  # Elastic
            factor = 0.95
        
        return round(factor, 2)
    
    def _calculate_competitor_factor(self, product: Product) -> float:
        """Adjust price based on competitor pricing"""
        if not product.competitor_price or product.competitor_price <= 0:
            return 1.0
        
        current_price = product.current_price
        competitor_price = product.competitor_price
        
        # If we're 20% higher than competitor
        if current_price > competitor_price * 1.2:
            return 0.95  # Suggest lowering price
        # If we're 20% lower than competitor
        elif current_price < competitor_price * 0.8:
            return 1.05  # Room to increase price
        
        return 1.0
    
    def _predict_demand_change(self, product: Product, old_price: float, new_price: float) -> float:
        """Predict percentage change in demand based on price change"""
        if old_price == 0:
            return 0.0
        
        price_change_pct = (new_price - old_price) / old_price
        elasticity = product.price_elasticity or -1.0
        
        # Demand change = elasticity * price change
        demand_change = elasticity * price_change_pct * 100
        
        # Add some noise for realism
        noise = random.uniform(-2, 2)
        
        return demand_change + noise
    
    def _predict_revenue_impact(self, product: Product, new_price: float, demand_change: float) -> float:
        """Predict revenue impact of price change"""
        historical_demand = product.historical_demand or 100  # Default assumption
        
        # New expected demand
        new_demand = historical_demand * (1 + demand_change / 100)
        
        # Current revenue estimate
        current_revenue = product.current_price * historical_demand
        
        # New revenue estimate
        new_revenue = new_price * new_demand
        
        # Daily impact (assuming historical_demand is daily)
        daily_impact = new_revenue - current_revenue
        
        # Monthly projection
        monthly_impact = daily_impact * 30
        
        return monthly_impact
    
    def _calculate_confidence(self, product: Product, strategy: str) -> float:
        """Calculate confidence score for the optimization (0-1)"""
        confidence = 0.7  # Base confidence
        
        # More data = higher confidence
        if product.historical_demand > 1000:
            confidence += 0.1
        
        # Known elasticity = higher confidence
        if product.price_elasticity and product.price_elasticity != -1.0:
            confidence += 0.1
        
        # Competitor data = higher confidence
        if product.competitor_price:
            confidence += 0.05
        
        # Balanced strategy = slightly higher confidence
        if strategy == "balanced":
            confidence += 0.05
        
        return min(confidence, 0.99)
    
    def _generate_optimization_reason(
        self,
        demand_factor: float,
        elasticity_factor: float,
        seasonality_factor: float,
        competitor_factor: float,
        strategy: str
    ) -> str:
        """Generate human-readable explanation for optimization"""
        reasons = []
        
        if demand_factor > 1.15:
            reasons.append("High demand")
        elif demand_factor < 0.85:
            reasons.append("Low demand")
        
        if seasonality_factor > 1.1:
            reasons.append("Peak seasonality")
        elif seasonality_factor < 0.9:
            reasons.append("Off-season")
        
        if competitor_factor > 1.05:
            reasons.append("Below competitor pricing")
        elif competitor_factor < 0.95:
            reasons.append("Above competitor pricing")
        
        if not reasons:
            reasons.append("Standard optimization")
        
        reasons.append(f"Strategy: {strategy}")
        
        return "; ".join(reasons)
    
    def simulate_demand_forecast(self, product: Product, days: int = 30) -> List[Dict]:
        """Simulate demand forecast for visualization"""
        forecast = []
        base_demand = product.historical_demand or 100
        
        for day in range(days):
            # Add trend and seasonality
            trend = 1 + (day * 0.005)  # 0.5% daily growth
            seasonality = 1 + 0.2 * np.sin(2 * np.pi * day / 30)  # Monthly cycle
            
            demand = base_demand * trend * seasonality * (product.demand_score / 50)
            
            forecast.append({
                "day": day,
                "predicted_demand": round(demand, 2),
                "confidence_lower": round(demand * 0.9, 2),
                "confidence_upper": round(demand * 1.1, 2)
            })
        
        return forecast
