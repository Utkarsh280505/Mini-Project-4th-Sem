"""Router for data import/export and pricing optimization endpoints."""

import random
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.product import Product
from app.services.data_import import DataImportService
from app.services.pricing_output import PricingOptimizationService
from app.schemas.io import (
    CSVUploadResponse,
    SimulateInputRequest,
    SimulateInputResponse,
    ProductDataResponse,
    ProductListResponse,
    PriceOptimizationRequest,
    PriceOptimizationResponse,
    PricingHistoryResponse,
    PricingHistoryRecord,
)
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/io", tags=["Input/Output"])


# ============================================================================
# INPUT ENDPOINTS
# ============================================================================

@router.post("/upload-csv", response_model=CSVUploadResponse)
async def upload_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload and import CSV file with product data.
    
    CSV must contain columns: product_id, name, base_price, demand, inventory, competitor_price
    
    Returns:
        CSVUploadResponse with import statistics
    """
    
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can import CSV data"
        )
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a CSV file"
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Validate CSV
        df, validation_errors = DataImportService.validate_csv_content(content)
        
        # Import to database
        result = DataImportService.import_csv_to_db(df, db)
        
        message = f"Imported {result['imported']} new products, updated {result['updated']} products"
        if result['errors']:
            message += f", {len(result['errors'])} errors"
        
        logger.info(f"CSV import completed by user {current_user.email}: {message}")
        
        return CSVUploadResponse(
            imported=result['imported'],
            updated=result['updated'],
            errors=result['errors'],
            total_processed=result['total_processed'],
            message=message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CSV upload failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"CSV upload failed: {str(e)}"
        )


@router.post("/simulate-input", response_model=SimulateInputResponse)
def simulate_real_time_input(
    request: SimulateInputRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Simulate real-time market input by updating demand and inventory.
    
    Randomly updates:
    - Demand: varies by ±(demand_variance * 100)%
    - Inventory: reduces by ±(inventory_variance * current_inventory)
    
    Returns:
        SimulateInputResponse with update details
    """
    
    # Get products to update
    if request.product_ids:
        products = db.query(Product).filter(Product.id.in_(request.product_ids)).all()
    else:
        products = db.query(Product).filter(Product.is_active == True).all()
    
    if not products:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No products found to update"
        )
    
    updates = []
    
    try:
        for product in products:
            old_demand = product.demand_score
            old_inventory = product.stock_quantity
            
            # Simulate demand change (range: 0.5–1.5 as per spec, controlled by variance)
            demand_multiplier = 0.5 + random.uniform(0, 1.5 - 0.5)  # 0.5 to 1.5
            # Apply variance control
            demand_variance_range = request.demand_variance
            variance = random.uniform(-demand_variance_range, demand_variance_range)
            new_demand = min(100, max(0, old_demand * (1 + variance)))
            
            # Simulate inventory reduction
            inventory_reduction = int(old_inventory * random.uniform(0, request.inventory_variance))
            new_inventory = max(0, old_inventory - inventory_reduction)
            
            # Update product
            product.demand_score = round(new_demand, 2)
            product.stock_quantity = new_inventory
            
            updates.append({
                'product_id': product.id,
                'product_name': product.name,
                'demand': {
                    'old': round(old_demand, 2),
                    'new': round(new_demand, 2),
                    'change_percent': round((new_demand - old_demand) / old_demand * 100, 2) if old_demand > 0 else 0
                },
                'inventory': {
                    'old': old_inventory,
                    'new': new_inventory,
                    'units_sold': inventory_reduction
                }
            })
        
        db.commit()
        logger.info(f"Simulated real-time input for {len(updates)} products")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Simulation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation failed: {str(e)}"
        )
    
    return SimulateInputResponse(
        updated_count=len(updates),
        updates=updates,
        timestamp=datetime.utcnow().isoformat()
    )


# ============================================================================
# OUTPUT ENDPOINTS
# ============================================================================

@router.get("/products", response_model=ProductListResponse)
def get_current_product_data(
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch current product data: product_id, name, base_price, current_price, demand, inventory, competitor_price.
    
    Returns:
        ProductListResponse with all active products
    """
    
    products = db.query(Product)\
        .filter(Product.is_active == True)\
        .offset(offset)\
        .limit(limit)\
        .all()
    
    product_data = [
        ProductDataResponse(
            product_id=p.id,
            name=p.name,
            base_price=round(p.base_price, 2),
            current_price=round(p.current_price, 2),
            demand=round(p.demand_score, 2),
            inventory=p.stock_quantity,
            competitor_price=round(p.competitor_price, 2) if p.competitor_price else None
        )
        for p in products
    ]
    
    total = db.query(Product).filter(Product.is_active == True).count()
    
    logger.info(f"Fetched {len(product_data)} products for user {current_user.email}")
    
    return ProductListResponse(
        products=product_data,
        total_count=total,
        timestamp=datetime.utcnow().isoformat()
    )


@router.post("/optimize-output", response_model=PriceOptimizationResponse)
def optimize_prices(
    request: PriceOptimizationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculate optimized prices using formula:
    new_price = base_price × demand_factor × elasticity_factor
    
    Constraints:
    - max_price = 2 × base_price
    - min_price = 0.5 × base_price
    
    Can optionally apply optimizations to database.
    
    Returns:
        PriceOptimizationResponse with optimized prices for all requested products
    """
    
    try:
        result = PricingOptimizationService.batch_optimize(
            request.product_ids,
            db,
            apply=request.apply
        )
        
        logger.info(
            f"Price optimization completed for {result['total_optimized']} products "
            f"(apply={request.apply}) by user {current_user.email}"
        )
        
        return PriceOptimizationResponse(
            optimizations=result['optimizations'],
            total_optimized=result['total_optimized'],
            estimated_monthly_revenue_impact=result['estimated_monthly_revenue_impact'],
            timestamp=result['timestamp']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Price optimization failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Price optimization failed: {str(e)}"
        )


@router.get("/pricing-history", response_model=PricingHistoryResponse)
def get_pricing_history(
    product_id: Optional[int] = None,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch pricing history: product_id, old_price, new_price, timestamp, reason, demand_score, elasticity.
    
    Args:
        product_id: Optional filter by specific product
        limit: Maximum number of records to return
    
    Returns:
        PricingHistoryResponse with pricing change records
    """
    
    try:
        history_data = PricingOptimizationService.get_pricing_history(
            product_id=product_id,
            limit=limit,
            db=db
        )
        
        logger.info(
            f"Fetched {len(history_data)} pricing history records "
            f"(product_id={product_id}) for user {current_user.email}"
        )
        
        # Convert to PricingHistoryRecord objects
        records = [PricingHistoryRecord(**h) for h in history_data]
        
        return PricingHistoryResponse(
            records=records,
            total_count=len(records),
            product_id=product_id,
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Failed to fetch pricing history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch pricing history: {str(e)}"
        )


# ============================================================================
# DELETE UPLOADED CSV PRODUCTS
# ============================================================================

@router.delete("/uploaded-products", summary="Delete products imported via CSV")
def delete_uploaded_products(
    skus: Optional[List[str]] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete products that were imported via CSV upload.

    - If `skus` list is provided: deletes only those specific products by SKU.
    - If `skus` is omitted: deletes ALL products that have no category
      (i.e. were imported via CSV without a category field).

    Only admins can delete products.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete products"
        )

    try:
        if skus:
            # Delete specific SKUs
            products = db.query(Product).filter(Product.sku.in_(skus)).all()
        else:
            # Delete all products with no category (CSV-imported ones)
            products = db.query(Product).filter(
                (Product.category == None) | (Product.category == "")
            ).all()

        if not products:
            return {"deleted": 0, "message": "No matching products found"}

        deleted_skus = [p.sku for p in products]
        count = len(products)

        for p in products:
            db.delete(p)
        db.commit()

        logger.info(f"Deleted {count} CSV-imported products by {current_user.email}")
        return {
            "deleted": count,
            "deleted_skus": deleted_skus,
            "message": f"Deleted {count} product(s) successfully"
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete products: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete products: {str(e)}"
        )
