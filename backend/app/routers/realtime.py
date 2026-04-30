from typing import List, Optional
import random

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.product import Product
from app.models.pricing_history import PricingHistory

router = APIRouter(tags=["realtime"])


class IngestDataRequest(BaseModel):
    product_id: str = Field(..., description="Unique product identifier")
    base_price: float = Field(..., gt=0)
    demand: float = Field(..., description="Demand multiplier (e.g., 0.5-1.5)")
    inventory: int = Field(..., ge=0)
    competitor_price: Optional[float] = Field(None, gt=0)


class UpdateMarketRequest(BaseModel):
    product_ids: Optional[List[str]] = Field(None, description="If omitted, update all products")
    demand_min: float = Field(0.5, description="Minimum demand multiplier")
    demand_max: float = Field(1.5, description="Maximum demand multiplier")


class OptimizedPriceResponse(BaseModel):
    product_id: str
    base_price: float
    demand: float
    optimized_price: float


def _do_ingest(payload: IngestDataRequest, db: Session):
    """Core ingest logic — shared by /ingest-data and /ingest."""
    sku = str(payload.product_id)
    product = db.query(Product).filter(Product.sku == sku).first()
    if not product:
        product = Product(
            name=f"product-{sku}",
            sku=sku,
            base_price=payload.base_price,
            current_price=payload.base_price,
            min_price=0.5 * payload.base_price,
            max_price=2.0 * payload.base_price,
            stock_quantity=payload.inventory,
            demand_score=payload.demand,
            competitor_price=payload.competitor_price,
        )
        db.add(product)
        db.commit()
        db.refresh(product)
        return {"status": "created", "product_id": sku}

    product.base_price = payload.base_price
    product.current_price = min(
        max(payload.base_price * payload.demand, 0.5 * payload.base_price),
        2.0 * payload.base_price,
    )
    product.min_price = 0.5 * payload.base_price
    product.max_price = 2.0 * payload.base_price
    product.stock_quantity = payload.inventory
    product.demand_score = payload.demand
    product.competitor_price = payload.competitor_price
    db.add(product)
    db.commit()
    return {"status": "updated", "product_id": sku}


def _do_update(payload: UpdateMarketRequest, db: Session):
    """Core update logic — shared by /update-market and /update."""
    query = db.query(Product)
    if payload.product_ids:
        skus = [str(p) for p in payload.product_ids]
        query = query.filter(Product.sku.in_(skus))

    products = query.all()
    if not products:
        raise HTTPException(status_code=404, detail="No products found to update")

    updated = []
    for p in products:
        mult = random.uniform(payload.demand_min, payload.demand_max)
        p.demand_score = float(round(mult, 4))

        if p.stock_quantity > 0:
            change = int(round(p.stock_quantity * random.uniform(-0.05, 0.0)))
            p.stock_quantity = max(0, p.stock_quantity + change)
        else:
            p.stock_quantity = p.stock_quantity + random.randint(0, 2)

        if p.competitor_price:
            pct = random.uniform(-0.02, 0.02)
            p.competitor_price = round(p.competitor_price * (1 + pct), 2)

        db.add(p)
        updated.append(p.sku)

    db.commit()
    return {"updated_count": len(updated), "updated_products": updated}


def _compute_optimized_price(base_price: float, demand: float) -> float:
    raw = base_price * demand
    min_price = 0.5 * base_price
    max_price = 2.0 * base_price
    return float(round(max(min_price, min(raw, max_price)), 2))


def _get_prices(db: Session):
    """Core price fetch logic."""
    products = db.query(Product).all()
    return [
        OptimizedPriceResponse(
            product_id=str(p.sku),
            base_price=p.base_price,
            demand=float(p.demand_score or 1.0),
            optimized_price=_compute_optimized_price(p.base_price, float(p.demand_score or 1.0)),
        )
        for p in products
    ]


def _run_pricing(db: Session):
    """Core run-pricing logic."""
    products = db.query(Product).all()
    results = []
    for p in products:
        demand = float(p.demand_score or 1.0)
        new_price = _compute_optimized_price(p.base_price, demand)
        old_price = p.current_price
        if old_price != new_price:
            history = PricingHistory(
                product_id=p.id,
                old_price=old_price,
                new_price=new_price,
                demand_score_at_change=demand,
                elasticity_at_change=None,
                optimization_reason="real-time-multiplier",
                triggered_by="system",
            )
            db.add(history)
        p.current_price = new_price
        db.add(p)
        results.append(
            OptimizedPriceResponse(
                product_id=str(p.sku),
                base_price=p.base_price,
                demand=demand,
                optimized_price=new_price,
            )
        )
    db.commit()
    return results


# ── Original endpoints (kept for backward compat) ────────────────────────────

@router.post("/ingest-data")
def ingest_data(payload: IngestDataRequest, db: Session = Depends(get_db)):
    """Ingest real-time market data for a single product."""
    return _do_ingest(payload, db)


@router.post("/update-market")
def update_market(payload: UpdateMarketRequest, db: Session = Depends(get_db)):
    """Simulate market changes across products."""
    return _do_update(payload, db)


@router.get("/optimized-prices", response_model=List[OptimizedPriceResponse])
def get_optimized_prices(db: Session = Depends(get_db)):
    """Return optimized prices computed from latest data (no DB changes)."""
    return _get_prices(db)


@router.post("/run-pricing", response_model=List[OptimizedPriceResponse])
def run_pricing(db: Session = Depends(get_db)):
    """Recalculate prices and persist to DB with history."""
    return _run_pricing(db)


# ── Spec-named endpoints: /ingest  /update  /prices  /run ────────────────────

@router.post("/ingest", summary="POST /ingest — Real-time JSON data ingestion")
def ingest(payload: IngestDataRequest, db: Session = Depends(get_db)):
    """
    INPUT — Real-Time Data Ingestion.

    Accept live market data as JSON and store/update in SQLite.
    Fields: product_id, base_price, demand, inventory, competitor_price
    """
    return _do_ingest(payload, db)


@router.post("/update", summary="POST /update — Simulate market changes")
def update(payload: UpdateMarketRequest, db: Session = Depends(get_db)):
    """
    DYNAMIC UPDATE — Simulation of Real-Time Behavior.

    Randomly changes demand (0.5–1.5), slightly reduces inventory,
    optionally updates competitor_price. Saves updated values.
    """
    return _do_update(payload, db)


@router.get("/prices", response_model=List[OptimizedPriceResponse],
            summary="GET /prices — Optimized price output")
def get_prices(db: Session = Depends(get_db)):
    """
    OUTPUT — Get Optimized Prices.

    Applies: new_price = base_price × demand
    Limits:  max = 2 × base_price,  min = 0.5 × base_price
    Returns: product_id, base_price, demand, optimized_price
    """
    return _get_prices(db)


@router.post("/run", response_model=List[OptimizedPriceResponse],
             summary="POST /run — Run pricing engine")
def run(db: Session = Depends(get_db)):
    """
    OUTPUT — Run Pricing Engine.

    Recalculates prices using latest data, persists to DB,
    records pricing history, returns updated optimized prices.
    """
    return _run_pricing(db)

