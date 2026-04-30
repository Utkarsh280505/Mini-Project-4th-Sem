from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.user import User
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse, ProductListResponse,
    BulkPriceUpdate
)
from app.services.product import ProductService

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=ProductListResponse)
def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get paginated list of products with optional filtering"""
    product_service = ProductService(db)
    products, total = product_service.get_products(
        skip=skip, limit=limit, category=category, 
        is_active=is_active, search=search
    )
    
    # Calculate suggested prices for each product
    from app.services.pricing_engine import PricingEngine
    pricing_engine = PricingEngine(db)
    
    product_responses = []
    for product in products:
        # Get optimization suggestion
        optimization = pricing_engine._optimize_single_product(
            product, strategy="balanced", min_margin_percent=10.0
        )
        
        product_dict = {
            **{c.name: getattr(product, c.name) for c in product.__table__.columns},
            "suggested_price": optimization.suggested_price if optimization else None,
            "price_change_percent": (
                ((optimization.suggested_price - product.current_price) / product.current_price * 100)
                if optimization else None
            )
        }
        product_responses.append(ProductResponse(**product_dict))
    
    pages = (total + limit - 1) // limit
    current_page = (skip // limit) + 1
    
    return ProductListResponse(
        items=product_responses,
        total=total,
        page=current_page,
        page_size=limit,
        pages=pages
    )


@router.get("/categories")
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all unique product categories"""
    product_service = ProductService(db)
    categories = product_service.get_categories()
    return {"categories": categories}


@router.get("/stats")
def get_product_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get product statistics"""
    product_service = ProductService(db)
    return product_service.get_product_stats()


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single product by ID"""
    product_service = ProductService(db)
    product = product_service.get_product(product_id)
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Get suggested price
    from app.services.pricing_engine import PricingEngine
    pricing_engine = PricingEngine(db)
    optimization = pricing_engine._optimize_single_product(
        product, strategy="balanced", min_margin_percent=10.0
    )
    
    product_dict = {
        **{c.name: getattr(product, c.name) for c in product.__table__.columns},
        "suggested_price": optimization.suggested_price if optimization else None,
        "price_change_percent": (
            ((optimization.suggested_price - product.current_price) / product.current_price * 100)
            if optimization else None
        )
    }
    
    return ProductResponse(**product_dict)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Create a new product (admin only)"""
    product_service = ProductService(db)
    product = product_service.create_product(product_data)
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Update a product (admin only)"""
    product_service = ProductService(db)
    product = product_service.update_product(product_id, product_update)
    return product


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Delete a product (admin only)"""
    product_service = ProductService(db)
    product_service.delete_product(product_id)
    return {"message": "Product deleted successfully"}


@router.post("/bulk-update")
def bulk_price_update(
    update_data: BulkPriceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Bulk update prices for multiple products (admin only)"""
    product_service = ProductService(db)
    
    changes = []
    for product_id in update_data.product_ids:
        product = product_service.get_product(product_id)
        if product:
            new_price = product.current_price * (1 + update_data.price_adjustment_percent / 100)
            
            # Apply bounds
            if update_data.min_price is not None:
                new_price = max(new_price, update_data.min_price)
            if update_data.max_price is not None:
                new_price = min(new_price, update_data.max_price)
            
            changes.append({
                "product_id": product_id,
                "new_price": round(new_price, 2),
                "reason": f"Bulk update: {update_data.price_adjustment_percent}% adjustment",
                "triggered_by": "admin_bulk"
            })
    
    applied = product_service.apply_price_changes(changes)
    
    return {
        "message": f"Updated {applied} products",
        "products_updated": applied
    }
