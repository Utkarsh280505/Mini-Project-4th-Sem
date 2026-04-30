from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Dynamic Pricing Optimization System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    
    # Database - defaults to SQLite for easy development
    DATABASE_URL: str = "sqlite:///./dynamic_pricing.db"
    
    # JWT - default dev keys (change in production!)
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    REFRESH_SECRET_KEY: str = "dev-refresh-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    FRONTEND_URL: str = "http://localhost:5173"
    
    # Admin
    ADMIN_EMAIL: Optional[str] = None
    ADMIN_PASSWORD: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
