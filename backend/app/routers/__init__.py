from fastapi import APIRouter
from app.routers import auth, realtime, products, pricing, analytics, io

api_router = APIRouter()

# Auth
api_router.include_router(auth.router)

# Core realtime endpoints (ingest-data, update-market, optimized-prices, run-pricing)
api_router.include_router(realtime.router)

# Products CRUD
api_router.include_router(products.router)

# Pricing engine (optimize, apply, forecast, elasticity, simulate)
api_router.include_router(pricing.router)

# Analytics & dashboard
api_router.include_router(analytics.router)

# IO: CSV upload, simulate-input, /io/products, optimize-output, pricing-history
api_router.include_router(io.router)

__all__ = ["api_router"]
