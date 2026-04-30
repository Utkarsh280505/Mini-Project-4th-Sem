import random

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.product import Product
from app.seed.data import (
    SAMPLE_PRODUCTS, generate_sku, generate_demand_score,
    generate_stock_quantity, generate_competitor_price, get_seasonality_factor
)
from app.core.logging import get_logger

logger = get_logger(__name__)


def seed_users(db: Session):
    """Seed initial users"""
    # Create admin user
    admin_email = settings.ADMIN_EMAIL or "admin@example.com"
    admin_password = (settings.ADMIN_PASSWORD or "admin123")[:72]  # bcrypt limit
    
    existing_admin = db.query(User).filter(User.email == admin_email).first()
    if not existing_admin:
        admin_user = User(
            email=admin_email,
            hashed_password=get_password_hash(admin_password),
            full_name="System Administrator",
            is_active=True,
            is_admin=True,
            role=UserRole.ADMIN
        )
        db.add(admin_user)
        db.commit()
        logger.info(f"Admin user created: {admin_email}")
    else:
        logger.info(f"Admin user already exists: {admin_email}")
    
    # Create demo user
    demo_email = "demo@example.com"
    existing_demo = db.query(User).filter(User.email == demo_email).first()
    if not existing_demo:
        demo_user = User(
            email=demo_email,
            hashed_password=get_password_hash("demo123"),
            full_name="Demo User",
            is_active=True,
            is_admin=False,
            role=UserRole.USER
        )
        db.add(demo_user)
        db.commit()
        logger.info(f"Demo user created: {demo_email}")
    else:
        logger.info(f"Demo user already exists: {demo_email}")


def seed_products(db: Session):
    """Seed sample products"""
    existing_count = db.query(Product).count()
    if existing_count > 0:
        logger.info(f"Products already exist ({existing_count} found), skipping product seeding")
        return
    
    products = []
    for i, product_data in enumerate(SAMPLE_PRODUCTS, start=1):
        base_price = product_data["base_price"]
        
        product = Product(
            name=product_data["name"],
            description=f"High-quality {product_data['name'].lower()} for your needs",
            sku=generate_sku(product_data["name"], i),
            base_price=base_price,
            current_price=base_price,  # Start at base price
            min_price=base_price * 0.5,  # 50% minimum
            max_price=base_price * 2.0,  # 200% maximum
            stock_quantity=generate_stock_quantity(),
            category=product_data["category"],
            is_active=True,
            demand_score=generate_demand_score(),
            price_elasticity=product_data["elasticity"],
            competitor_price=generate_competitor_price(base_price),
            historical_demand=random.randint(10, 500),  # Daily historical sales
            seasonality_factor=get_seasonality_factor(product_data["category"])
        )
        products.append(product)
    
    db.add_all(products)
    db.commit()
    logger.info(f"Created {len(products)} sample products")


def seed_all():
    """Run all seeders"""
    db = SessionLocal()
    try:
        logger.info("Starting database seeding...")
        seed_users(db)
        seed_products(db)
        logger.info("Database seeding completed successfully")
    except Exception as e:
        logger.error(f"Error during seeding: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_all()
