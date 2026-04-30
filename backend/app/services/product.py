from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from fastapi import HTTPException, status
from app.models.product import Product
from app.models.pricing_history import PricingHistory
from app.schemas.product import ProductCreate, ProductUpdate
from app.core.logging import get_logger

logger = get_logger(__name__)


class ProductService:
    def __init__(self, db: Session):
        self.db = db

    def get_product(self, product_id: int) -> Optional[Product]:
        return self.db.query(Product).filter(Product.id == product_id).first()

    def get_product_by_sku(self, sku: str) -> Optional[Product]:
        return self.db.query(Product).filter(Product.sku == sku).first()

    def get_products(
        self,
        skip: int = 0,
        limit: int = 100,
        category: Optional[str] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None
    ) -> tuple[List[Product], int]:
        query = self.db.query(Product)

        if category:
            query = query.filter(Product.category == category)
        
        if is_active is not None:
            query = query.filter(Product.is_active == is_active)
        
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                (Product.name.ilike(search_filter)) |
                (Product.sku.ilike(search_filter)) |
                (Product.description.ilike(search_filter))
            )

        total = query.count()
        products = query.offset(skip).limit(limit).all()
        
        return products, total

    def get_all_active_products(self) -> List[Product]:
        return self.db.query(Product).filter(Product.is_active == True).all()

    def create_product(self, product_data: ProductCreate) -> Product:
        # Check if SKU already exists
        existing = self.get_product_by_sku(product_data.sku)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with SKU '{product_data.sku}' already exists"
            )

        db_product = Product(**product_data.model_dump())
        self.db.add(db_product)
        self.db.commit()
        self.db.refresh(db_product)
        
        logger.info(f"Product created", product_id=db_product.id, sku=db_product.sku)
        return db_product

    def update_product(self, product_id: int, product_update: ProductUpdate) -> Product:
        product = self.get_product(product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )

        update_data = product_update.model_dump(exclude_unset=True)
        
        # If price is changing, record history
        if "current_price" in update_data and update_data["current_price"] != product.current_price:
            self._record_price_change(
                product,
                product.current_price,
                update_data["current_price"],
                "User manual update"
            )

        for field, value in update_data.items():
            setattr(product, field, value)

        self.db.commit()
        self.db.refresh(product)
        
        logger.info(f"Product updated", product_id=product_id)
        return product

    def delete_product(self, product_id: int) -> bool:
        product = self.get_product(product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )

        self.db.delete(product)
        self.db.commit()
        
        logger.info(f"Product deleted", product_id=product_id)
        return True

    def get_categories(self) -> List[str]:
        categories = self.db.query(Product.category).distinct().filter(
            Product.category.isnot(None)
        ).all()
        return [c[0] for c in categories if c[0]]

    def _record_price_change(
        self,
        product: Product,
        old_price: float,
        new_price: float,
        reason: str,
        triggered_by: str = "system"
    ):
        history = PricingHistory(
            product_id=product.id,
            old_price=old_price,
            new_price=new_price,
            demand_score_at_change=product.demand_score,
            elasticity_at_change=product.price_elasticity,
            optimization_reason=reason,
            triggered_by=triggered_by
        )
        self.db.add(history)

    def apply_price_changes(self, changes: List[dict]):
        """Apply multiple price changes and record history"""
        applied_count = 0
        
        for change in changes:
            product = self.get_product(change["product_id"])
            if product:
                self._record_price_change(
                    product,
                    product.current_price,
                    change["new_price"],
                    change.get("reason", "Optimization applied"),
                    change.get("triggered_by", "optimization")
                )
                product.current_price = change["new_price"]
                applied_count += 1
        
        self.db.commit()
        logger.info(f"Applied {applied_count} price changes")
        return applied_count

    def get_product_stats(self) -> dict:
        """Get aggregate statistics for products"""
        total = self.db.query(Product).count()
        active = self.db.query(Product).filter(Product.is_active == True).count()
        
        avg_price = self.db.query(func.avg(Product.current_price)).scalar() or 0
        avg_demand = self.db.query(func.avg(Product.demand_score)).scalar() or 0
        
        low_stock = self.db.query(Product).filter(
            Product.stock_quantity < 10,
            Product.is_active == True
        ).count()

        return {
            "total_products": total,
            "active_products": active,
            "avg_price": round(avg_price, 2),
            "avg_demand_score": round(avg_demand, 2),
            "low_stock_products": low_stock
        }
