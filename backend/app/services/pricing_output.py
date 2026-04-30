"""Pricing optimization output service."""

import random
from typing import List, Dict, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.product import Product
from app.models.pricing_history import PricingHistory
from app.core.logging import get_logger

logger = get_logger(__name__)


class PricingOptimizationService:
    """Handles pricing optimization and output."""

    # Elasticity factor ranges based on product characteristics
    ELASTICITY_FACTORS = {
        'inelastic': 1.08,      # Can increase price more (demand doesn't drop much)
        'neutral': 1.00,         # Balanced
        'elastic': 0.95          # Be conservative (demand drops with price)
    }

    @staticmethod
    def optimize_price(
        product: Product,
        use_actual_elasticity: bool = True
    ) -> Dict:
        """
        Calculate optimized price using formula:
        new_price = base_price × demand × elasticity_factor
        
        Constraints:
        - max = 2 × base_price
        - min = 0.5 × base_price
        """
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        if product.base_price <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product base_price must be positive"
            )
        
        # Normalize demand score (0-100) to factor (0.5-1.5)
        demand_factor = 0.5 + (product.demand_score / 100) * 1.0
        
        # Determine elasticity factor
        if use_actual_elasticity and product.price_elasticity:
            elasticity = product.price_elasticity
            if elasticity > -0.5:  # Inelastic
                elasticity_factor = PricingOptimizationService.ELASTICITY_FACTORS['inelastic']
            elif elasticity > -1.5:  # Neutral
                elasticity_factor = PricingOptimizationService.ELASTICITY_FACTORS['neutral']
            else:  # Elastic
                elasticity_factor = PricingOptimizationService.ELASTICITY_FACTORS['elastic']
        else:
            elasticity_factor = PricingOptimizationService.ELASTICITY_FACTORS['neutral']
        
        # Core formula: new_price = base_price × demand × elasticity_factor
        calculated_price = product.base_price * demand_factor * elasticity_factor
        
        # Apply constraints
        min_price = 0.5 * product.base_price
        max_price = 2.0 * product.base_price
        
        optimized_price = max(min_price, min(calculated_price, max_price))
        optimized_price = round(optimized_price, 2)
        
        # Calculate metrics
        old_price = round(product.current_price, 2)
        price_change_pct = ((optimized_price - old_price) / old_price * 100) if old_price > 0 else 0
        
        return {
            'product_id': product.id,
            'product_name': product.name,
            'old_price': old_price,
            'new_price': optimized_price,
            'demand_factor': round(demand_factor, 2),
            'elasticity_factor': round(elasticity_factor, 2),
            'price_change_percent': round(price_change_pct, 2),
            'inventory_level': product.stock_quantity,
            'competitor_price': product.competitor_price
        }

    @staticmethod
    def optimize_and_apply(
        product: Product,
        db: Session,
        save_to_history: bool = True
    ) -> Dict:
        """Calculate optimization and optionally apply to database."""
        
        optimization = PricingOptimizationService.optimize_price(product)
        old_price = product.current_price
        new_price = optimization['new_price']
        
        # Only apply if price changed significantly (> 0.1%)
        price_change_pct = abs(new_price - old_price) / old_price * 100 if old_price > 0 else 0
        if price_change_pct < 0.1:
            optimization['applied'] = False
            optimization['reason'] = "Price change too small"
            return optimization
        
        # Apply to database
        try:
            product.current_price = new_price
            
            # Record history if requested
            if save_to_history:
                history_entry = PricingHistory(
                    product_id=product.id,
                    old_price=round(old_price, 2),
                    new_price=new_price,
                    demand_score_at_change=product.demand_score,
                    elasticity_at_change=product.price_elasticity,
                    optimization_reason=f"Demand {optimization['demand_factor']:.2f}x, Elasticity {optimization['elasticity_factor']:.2f}x",
                    triggered_by="optimization"
                )
                db.add(history_entry)
            
            db.commit()
            optimization['applied'] = True
            optimization['reason'] = "Applied to database"
            logger.info(f"Optimized product {product.id}: {old_price} → {new_price}")
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to apply optimization: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to apply optimization: {str(e)}"
            )
        
        return optimization

    @staticmethod
    def batch_optimize(
        product_ids: Optional[List[int]],
        db: Session,
        apply: bool = False
    ) -> Dict:
        """Optimize multiple products."""
        
        # Get products to optimize
        if product_ids:
            products = db.query(Product).filter(Product.id.in_(product_ids)).all()
        else:
            products = db.query(Product).filter(Product.is_active == True).all()
        
        if not products:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No products found to optimize"
            )
        
        optimizations = []
        total_revenue_impact = 0.0
        
        for product in products:
            try:
                if apply:
                    opt = PricingOptimizationService.optimize_and_apply(
                        product, db, save_to_history=True
                    )
                else:
                    opt = PricingOptimizationService.optimize_price(product)
                
                optimizations.append(opt)
                
                # Estimate revenue impact (monthly)
                price_diff = opt['new_price'] - opt['old_price']
                estimated_daily_units = product.historical_demand or 100
                daily_impact = price_diff * estimated_daily_units
                monthly_impact = daily_impact * 30
                total_revenue_impact += monthly_impact
                
            except Exception as e:
                logger.error(f"Failed to optimize product {product.id}: {str(e)}")
                continue
        
        return {
            'optimizations': optimizations,
            'total_optimized': len(optimizations),
            'estimated_monthly_revenue_impact': round(total_revenue_impact, 2),
            'timestamp': datetime.utcnow().isoformat()
        }

    @staticmethod
    def get_pricing_history(
        product_id: Optional[int],
        limit: int = 100,
        db: Session = None
    ) -> List[Dict]:
        """Fetch pricing history for a product or all products."""
        
        query = db.query(PricingHistory)
        
        if product_id:
            query = query.filter(PricingHistory.product_id == product_id)
        
        history = query.order_by(PricingHistory.created_at.desc()).limit(limit).all()
        
        return [
            {
                'id': h.id,
                'product_id': h.product_id,
                'product_name': h.product.name if h.product else 'Unknown',
                'old_price': round(h.old_price, 2),
                'new_price': round(h.new_price, 2),
                'price_change': round(h.new_price - h.old_price, 2),
                'demand_score': round(h.demand_score_at_change, 2) if h.demand_score_at_change else None,
                'elasticity': round(h.elasticity_at_change, 2) if h.elasticity_at_change else None,
                'reason': h.optimization_reason,
                'triggered_by': h.triggered_by,
                'timestamp': h.created_at.isoformat()
            }
            for h in history
        ]
