import random
from typing import List

# Sample product data for seeding
SAMPLE_PRODUCTS = [
    # Electronics
    {"name": "Wireless Bluetooth Headphones", "category": "Electronics", "base_price": 79.99, "elasticity": -1.2},
    {"name": "USB-C Charging Cable (6ft)", "category": "Electronics", "base_price": 12.99, "elasticity": -1.5},
    {"name": "Portable Power Bank 20000mAh", "category": "Electronics", "base_price": 49.99, "elasticity": -0.9},
    {"name": "Smart Home Assistant Speaker", "category": "Electronics", "base_price": 129.99, "elasticity": -0.8},
    {"name": "4K Webcam for Streaming", "category": "Electronics", "base_price": 89.99, "elasticity": -1.1},
    {"name": "Mechanical Gaming Keyboard", "category": "Electronics", "base_price": 119.99, "elasticity": -0.7},
    {"name": "Wireless Gaming Mouse", "category": "Electronics", "base_price": 59.99, "elasticity": -1.0},
    {"name": "27-inch 4K Monitor", "category": "Electronics", "base_price": 349.99, "elasticity": -0.6},
    {"name": "Noise Cancelling Earbuds", "category": "Electronics", "base_price": 149.99, "elasticity": -0.9},
    {"name": "Smart Watch Fitness Tracker", "category": "Electronics", "base_price": 199.99, "elasticity": -0.8},
    
    # Clothing
    {"name": "Premium Cotton T-Shirt", "category": "Clothing", "base_price": 24.99, "elasticity": -1.8},
    {"name": "Slim Fit Jeans", "category": "Clothing", "base_price": 59.99, "elasticity": -1.4},
    {"name": "Running Shoes", "category": "Clothing", "base_price": 89.99, "elasticity": -1.1},
    {"name": "Winter Jacket", "category": "Clothing", "base_price": 149.99, "elasticity": -0.7},
    {"name": "Athletic Shorts", "category": "Clothing", "base_price": 29.99, "elasticity": -1.6},
    {"name": "Wool Sweater", "category": "Clothing", "base_price": 69.99, "elasticity": -1.0},
    {"name": "Baseball Cap", "category": "Clothing", "base_price": 19.99, "elasticity": -2.0},
    {"name": "Leather Belt", "category": "Clothing", "base_price": 34.99, "elasticity": -1.3},
    {"name": "Sunglasses", "category": "Clothing", "base_price": 79.99, "elasticity": -1.2},
    {"name": "Backpack", "category": "Clothing", "base_price": 49.99, "elasticity": -1.1},
    
    # Home & Kitchen
    {"name": "Coffee Maker", "category": "Home & Kitchen", "base_price": 79.99, "elasticity": -0.9},
    {"name": "Stainless Steel Water Bottle", "category": "Home & Kitchen", "base_price": 24.99, "elasticity": -1.4},
    {"name": "Air Fryer 5.8QT", "category": "Home & Kitchen", "base_price": 99.99, "elasticity": -0.8},
    {"name": "Blender Pro", "category": "Home & Kitchen", "base_price": 149.99, "elasticity": -0.7},
    {"name": "Non-Stick Cookware Set", "category": "Home & Kitchen", "base_price": 129.99, "elasticity": -1.0},
    {"name": "Robot Vacuum Cleaner", "category": "Home & Kitchen", "base_price": 249.99, "elasticity": -0.6},
    {"name": "Electric Kettle", "category": "Home & Kitchen", "base_price": 39.99, "elasticity": -1.2},
    {"name": "LED Desk Lamp", "category": "Home & Kitchen", "base_price": 34.99, "elasticity": -1.5},
    {"name": "Bamboo Cutting Board", "category": "Home & Kitchen", "base_price": 19.99, "elasticity": -1.8},
    {"name": "Food Storage Containers Set", "category": "Home & Kitchen", "base_price": 29.99, "elasticity": -1.6},
    
    # Sports & Outdoors
    {"name": "Yoga Mat Premium", "category": "Sports & Outdoors", "base_price": 39.99, "elasticity": -1.3},
    {"name": "Resistance Bands Set", "category": "Sports & Outdoors", "base_price": 24.99, "elasticity": -1.7},
    {"name": "Tennis Racket", "category": "Sports & Outdoors", "base_price": 89.99, "elasticity": -0.9},
    {"name": "Camping Tent 4-Person", "category": "Sports & Outdoors", "base_price": 179.99, "elasticity": -0.6},
    {"name": "Bicycle Helmet", "category": "Sports & Outdoors", "base_price": 49.99, "elasticity": -1.1},
    {"name": "Fishing Rod", "category": "Sports & Outdoors", "base_price": 69.99, "elasticity": -1.0},
    {"name": "Basketball", "category": "Sports & Outdoors", "base_price": 29.99, "elasticity": -1.8},
    {"name": "Hiking Boots", "category": "Sports & Outdoors", "base_price": 119.99, "elasticity": -0.8},
    {"name": "Cooler Bag 30L", "category": "Sports & Outdoors", "base_price": 44.99, "elasticity": -1.2},
    {"name": "Fitness Tracker Watch", "category": "Sports & Outdoors", "base_price": 59.99, "elasticity": -1.1},
]


def generate_sku(name: str, index: int) -> str:
    """Generate a unique SKU from product name and index"""
    prefix = "".join(word[0].upper() for word in name.split()[:3])
    return f"{prefix}-{index:04d}"


def generate_demand_score() -> float:
    """Generate a realistic demand score (0-100)"""
    # Use a normal distribution centered around 50
    score = random.gauss(50, 20)
    return max(0, min(100, score))


def generate_stock_quantity() -> int:
    """Generate stock quantity with realistic distribution"""
    # 60% of products have healthy stock, 30% medium, 10% low
    r = random.random()
    if r < 0.6:
        return random.randint(50, 200)
    elif r < 0.9:
        return random.randint(10, 50)
    else:
        return random.randint(0, 10)


def generate_competitor_price(base_price: float) -> float:
    """Generate a competitor price around base price"""
    variance = random.uniform(-0.15, 0.15)  # +/- 15%
    return round(base_price * (1 + variance), 2)


def get_seasonality_factor(category: str) -> float:
    """Get seasonality factor based on category"""
    # Simulate different seasonality for different categories
    factors = {
        "Clothing": random.uniform(0.8, 1.2),
        "Electronics": random.uniform(0.95, 1.15),
        "Home & Kitchen": random.uniform(0.9, 1.1),
        "Sports & Outdoors": random.uniform(0.7, 1.3),  # More seasonal
    }
    return factors.get(category, 1.0)
