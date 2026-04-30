from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.user import User
from app.models.product import Product
from app.schemas.product import (
    PriceOptimizationRequest, PriceOptimizationResponse,
    ApplyOptimizationRequest, OptimizedPrice
)
from app.services.pricing_engine import PricingEngine
from app.services.product import ProductService
from app.core.logging import get_logger

router = APIRouter(prefix="/pricing", tags=["Pricing Engine"])
logger = get_logger(__name__)


@router.post("/optimize", response_model=PriceOptimizationResponse)
def optimize_prices(
    request: PriceOptimizationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Run AI price optimization on selected products
    
    - **product_ids**: List of product IDs to optimize (null = all active products)
    - **optimization_strategy**: "revenue" | "demand" | "balanced"
    - **min_margin_percent**: Minimum profit margin constraint
    """
    pricing_engine = PricingEngine(db)
    
    result = pricing_engine.optimize_prices(
        product_ids=request.product_ids,
        strategy=request.optimization_strategy,
        min_margin_percent=request.min_margin_percent
    )
    
    logger.info(
        f"Price optimization completed",
        user_id=current_user.id,
        products_optimized=result.products_optimized,
        total_impact=result.total_revenue_impact
    )
    
    return result


@router.post("/apply")
def apply_optimizations(
    request: ApplyOptimizationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Apply suggested price optimizations"""
    product_service = ProductService(db)
    
    # In a real implementation, you'd store optimization suggestions first
    # and then apply them by ID. For this demo, we'll apply the most recent optimization.
    
    # Re-run optimization to get current suggestions
    pricing_engine = PricingEngine(db)
    optimization_result = pricing_engine.optimize_prices()
    
    if not optimization_result.optimizations:
        return {
            "message": "No optimizations to apply",
            "applied_count": 0
        }
    
    # Convert optimizations to price changes
    changes = []
    for opt in optimization_result.optimizations:
        changes.append({
            "product_id": opt.product_id,
            "new_price": opt.suggested_price,
            "reason": opt.optimization_reason,
            "triggered_by": "admin"
        })
    
    applied_count = product_service.apply_price_changes(changes)
    
    logger.info(
        f"Price optimizations applied",
        user_id=current_user.id,
        applied_count=applied_count
    )
    
    return {
        "message": f"Applied {applied_count} price changes",
        "applied_count": applied_count,
        "total_revenue_impact": optimization_result.total_revenue_impact
    }


@router.get("/forecast/{product_id}")
def get_demand_forecast(
    product_id: int,
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get demand forecast for a specific product"""
    product_service = ProductService(db)
    product = product_service.get_product(product_id)
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    pricing_engine = PricingEngine(db)
    forecast = pricing_engine.simulate_demand_forecast(product, days=days)
    
    return {
        "product_id": product_id,
        "product_name": product.name,
        "forecast_days": days,
        "forecast": forecast
    }


@router.get("/elasticity/{product_id}")
def get_price_elasticity(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get price elasticity analysis for a product"""
    product_service = ProductService(db)
    product = product_service.get_product(product_id)
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Calculate elasticity scenarios
    base_price = product.current_price
    elasticity = product.price_elasticity or -1.0
    
    scenarios = []
    for price_change in [-20, -10, -5, 0, 5, 10, 20]:
        new_price = base_price * (1 + price_change / 100)
        demand_change = elasticity * price_change
        
        # Assume 100 base units sold at current price
        base_revenue = base_price * 100
        new_units = 100 * (1 + demand_change / 100)
        new_revenue = new_price * new_units
        revenue_impact = new_revenue - base_revenue
        
        scenarios.append({
            "price_change_percent": price_change,
            "new_price": round(new_price, 2),
            "predicted_demand_change": round(demand_change, 2),
            "predicted_units": round(new_units, 0),
            "predicted_revenue": round(new_revenue, 2),
            "revenue_impact": round(revenue_impact, 2)
        })
    
    return {
        "product_id": product_id,
        "product_name": product.name,
        "current_price": base_price,
        "current_elasticity": elasticity,
        "elasticity_scenarios": scenarios
    }


@router.post("/simulate")
def simulate_price_change(
    product_id: int,
    new_price: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Simulate the impact of a price change without applying it"""
    product_service = ProductService(db)
    product = product_service.get_product(product_id)
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    pricing_engine = PricingEngine(db)
    
    # Predict impact
    expected_demand_change = pricing_engine._predict_demand_change(
        product, product.current_price, new_price
    )
    expected_revenue_change = pricing_engine._predict_revenue_impact(
        product, new_price, expected_demand_change
    )
    
    return {
        "product_id": product_id,
        "product_name": product.name,
        "current_price": product.current_price,
        "simulated_price": new_price,
        "price_change_percent": round(
            (new_price - product.current_price) / product.current_price * 100, 2
        ),
        "predicted_demand_change": round(expected_demand_change, 2),
        "predicted_revenue_impact_monthly": round(expected_revenue_change, 2),
        "confidence": pricing_engine._calculate_confidence(product, "balanced")
    }
