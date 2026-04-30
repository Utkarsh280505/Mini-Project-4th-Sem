"""Schemas for data import/export and pricing optimization."""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime


# CSV Upload Schemas
class CSVUploadResponse(BaseModel):
    imported: int = Field(..., description="Number of new products imported")
    updated: int = Field(..., description="Number of existing products updated")
    errors: List[str] = Field(default=[], description="List of errors encountered")
    total_processed: int = Field(..., description="Total rows processed")
    message: str = Field(..., description="Summary message")


# Simulated Real-Time Input
class SimulateInputRequest(BaseModel):
    product_ids: Optional[List[int]] = Field(None, description="Specific product IDs to simulate (None = all)")
    demand_variance: float = Field(0.3, description="Variance for demand changes (0-1)")
    inventory_variance: float = Field(0.2, description="Variance for inventory reduction (0-1)")


class SimulateInputResponse(BaseModel):
    updated_count: int = Field(..., description="Number of products updated")
    updates: List[Dict[str, Any]] = Field(..., description="Details of each update")
    timestamp: str = Field(..., description="Timestamp of simulation")


# Current Data Fetch
class ProductDataResponse(BaseModel):
    product_id: int
    name: str
    base_price: float
    current_price: float
    demand: float
    inventory: int
    competitor_price: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    products: List[ProductDataResponse]
    total_count: int
    timestamp: str


# Pricing Optimization
class PriceOptimizationRequest(BaseModel):
    product_ids: Optional[List[int]] = Field(None, description="Specific product IDs (None = all active)")
    apply: bool = Field(False, description="Whether to apply optimizations to database")
    use_actual_elasticity: bool = Field(True, description="Use stored elasticity data")


class OptimizedPriceOutput(BaseModel):
    product_id: int
    product_name: str
    old_price: float
    new_price: float
    demand_factor: float
    elasticity_factor: float
    price_change_percent: float
    inventory_level: int
    competitor_price: Optional[float] = None
    applied: bool = Field(False, description="Whether optimization was applied to DB")
    reason: Optional[str] = None


class PriceOptimizationResponse(BaseModel):
    optimizations: List[OptimizedPriceOutput]
    total_optimized: int
    estimated_monthly_revenue_impact: float
    timestamp: str


# Pricing History
class PricingHistoryRecord(BaseModel):
    id: int
    product_id: int
    product_name: str
    old_price: float
    new_price: float
    price_change: float
    demand_score: Optional[float] = None
    elasticity: Optional[float] = None
    reason: Optional[str] = None
    triggered_by: str
    timestamp: str
    
    model_config = ConfigDict(from_attributes=True)


class PricingHistoryResponse(BaseModel):
    records: List[PricingHistoryRecord]
    total_count: int
    product_id: Optional[int] = None
    timestamp: str


# Error Response
class ErrorResponse(BaseModel):
    detail: str
    status_code: int
    timestamp: str
