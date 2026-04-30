from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    sku: str = Field(..., min_length=1, max_length=100)
    base_price: float = Field(..., gt=0)
    current_price: float = Field(..., gt=0)
    min_price: float = Field(default=0.0, ge=0)
    max_price: Optional[float] = None
    stock_quantity: int = Field(default=0, ge=0)
    category: Optional[str] = None
    is_active: bool = True


class ProductCreate(ProductBase):
    demand_score: float = Field(default=50.0, ge=0, le=100)
    price_elasticity: float = Field(default=-1.0)
    competitor_price: Optional[float] = None
    historical_demand: float = Field(default=0.0)
    seasonality_factor: float = Field(default=1.0)


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    base_price: Optional[float] = Field(None, gt=0)
    current_price: Optional[float] = Field(None, gt=0)
    min_price: Optional[float] = Field(None, ge=0)
    max_price: Optional[float] = None
    stock_quantity: Optional[int] = Field(None, ge=0)
    category: Optional[str] = None
    is_active: Optional[bool] = None
    demand_score: Optional[float] = Field(None, ge=0, le=100)
    price_elasticity: Optional[float] = None
    competitor_price: Optional[float] = None


class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    demand_score: float
    price_elasticity: float
    competitor_price: Optional[float]
    historical_demand: float
    seasonality_factor: float
    created_at: datetime
    updated_at: Optional[datetime] = None
    suggested_price: Optional[float] = None
    price_change_percent: Optional[float] = None


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    page_size: int
    pages: int


class PriceOptimizationRequest(BaseModel):
    product_ids: Optional[List[int]] = None  # None = optimize all
    optimization_strategy: str = Field(default="revenue", pattern="^(revenue|demand|balanced)$")
    min_margin_percent: float = Field(default=10.0, ge=0, le=100)


class OptimizedPrice(BaseModel):
    product_id: int
    old_price: float
    suggested_price: float
    confidence_score: float
    expected_revenue_change: float
    expected_demand_change: float
    optimization_reason: str


class PriceOptimizationResponse(BaseModel):
    optimizations: List[OptimizedPrice]
    total_revenue_impact: float
    products_optimized: int
    timestamp: datetime


class ApplyOptimizationRequest(BaseModel):
    optimization_ids: List[int]
    apply_all: bool = False


class BulkPriceUpdate(BaseModel):
    product_ids: List[int]
    price_adjustment_percent: float
    min_price: Optional[float] = None
    max_price: Optional[float] = None
