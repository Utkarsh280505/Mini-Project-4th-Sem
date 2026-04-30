"""Data import and validation service for CSV uploads and real-time simulation."""

import io
from typing import List, Dict, Tuple
import pandas as pd
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.product import Product
from app.core.logging import get_logger

logger = get_logger(__name__)


class DataImportService:
    """Handles CSV parsing, validation, and data import."""

    # Required columns — competitor_price is optional (can be blank/missing)
    REQUIRED_CSV_FIELDS = {'product_id', 'name', 'base_price', 'demand', 'inventory'}
    OPTIONAL_CSV_FIELDS = {'competitor_price'}

    @staticmethod
    def validate_csv_content(file_content: bytes) -> Tuple[pd.DataFrame, List[str]]:
        """
        Parse and validate CSV content.
        Accepts any column order. competitor_price is optional.
        """
        errors = []

        # ── Parse ──────────────────────────────────────────────────────────────
        try:
            df = pd.read_csv(io.BytesIO(file_content))
        except Exception as e:
            logger.error(f"CSV parsing failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to parse CSV: {str(e)}"
            )

        # Strip whitespace from column names
        df.columns = [c.strip().lower() for c in df.columns]

        # ── Required field check ───────────────────────────────────────────────
        missing_fields = DataImportService.REQUIRED_CSV_FIELDS - set(df.columns)
        if missing_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required fields: {', '.join(sorted(missing_fields))}. "
                       f"Required: product_id, name, base_price, demand, inventory. "
                       f"Optional: competitor_price"
            )

        # Add competitor_price column with NaN if not present
        if 'competitor_price' not in df.columns:
            df['competitor_price'] = None

        # ── Type validation ────────────────────────────────────────────────────
        df, validation_errors = DataImportService._validate_data_types(df)
        if validation_errors:
            errors.extend(validation_errors)

        # Duplicate product_id check
        if df['product_id'].duplicated().any():
            errors.append("CSV contains duplicate product_id values")

        # Missing required values check (not competitor_price — it's optional)
        required_cols = list(DataImportService.REQUIRED_CSV_FIELDS)
        missing_rows = df[df[required_cols].isnull().any(axis=1)]
        if not missing_rows.empty:
            errors.append(f"{len(missing_rows)} row(s) have missing required values")

        if errors:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"CSV validation failed: {'; '.join(errors)}"
            )

        return df, errors

    @staticmethod
    def _validate_data_types(df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
        """Validate and coerce data types."""
        errors = []

        # product_id — allow numeric or string SKU
        df['product_id'] = df['product_id'].astype(str).str.strip()

        # Numeric fields
        for field in ['base_price', 'demand', 'inventory']:
            try:
                df[field] = pd.to_numeric(df[field], errors='coerce')
                if df[field].isnull().any():
                    errors.append(f"'{field}' contains non-numeric values")
            except Exception as e:
                errors.append(f"Invalid '{field}' format: {str(e)}")

        # competitor_price — optional, coerce silently
        try:
            df['competitor_price'] = pd.to_numeric(df['competitor_price'], errors='coerce')
        except Exception:
            df['competitor_price'] = None

        # Range checks
        if 'base_price' in df.columns and df['base_price'].notna().any():
            if (df['base_price'].dropna() <= 0).any():
                errors.append("base_price must be positive")
        if 'demand' in df.columns and df['demand'].notna().any():
            if (df['demand'].dropna() < 0).any():
                errors.append("demand cannot be negative")
        if 'inventory' in df.columns and df['inventory'].notna().any():
            if (df['inventory'].dropna() < 0).any():
                errors.append("inventory cannot be negative")

        return df, errors

    @staticmethod
    def import_csv_to_db(df: pd.DataFrame, db: Session) -> Dict:
        """
        Import CSV data into database.
        Matches by SKU (product_id column treated as SKU string).
        """
        imported = 0
        updated = 0
        errors = []

        for idx, row in df.iterrows():
            try:
                sku = str(row['product_id']).strip()
                base_price = float(row['base_price'])
                demand_raw = float(row['demand'])          # 0.5–1.5 multiplier from CSV
                demand_score = min(100.0, max(0.0, demand_raw * 100))  # normalise to 0–100
                inventory = int(row['inventory'])
                comp_price = (
                    float(row['competitor_price'])
                    if pd.notna(row.get('competitor_price')) and float(row['competitor_price']) > 0
                    else None
                )
                name = str(row.get('name', f'Product {sku}')).strip()

                # Match by SKU
                product = db.query(Product).filter(Product.sku == sku).first()

                if product:
                    product.name = name
                    product.base_price = base_price
                    product.current_price = base_price
                    product.min_price = base_price * 0.5
                    product.max_price = base_price * 2.0
                    product.demand_score = demand_score
                    product.stock_quantity = inventory
                    product.competitor_price = comp_price
                    product.historical_demand = demand_raw
                    updated += 1
                    logger.info(f"Updated product SKU={sku}")
                else:
                    product = Product(
                        name=name,
                        sku=sku,
                        base_price=base_price,
                        current_price=base_price,
                        min_price=base_price * 0.5,
                        max_price=base_price * 2.0,
                        demand_score=demand_score,
                        stock_quantity=inventory,
                        competitor_price=comp_price,
                        historical_demand=demand_raw,
                        is_active=True,
                    )
                    db.add(product)
                    imported += 1
                    logger.info(f"Created product SKU={sku}")

            except Exception as e:
                error_msg = f"Row {idx + 2}: {str(e)}"
                errors.append(error_msg)
                logger.error(error_msg)
                continue

        try:
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Database commit failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save to database: {str(e)}"
            )

        return {
            "imported": imported,
            "updated": updated,
            "errors": errors,
            "total_processed": imported + updated + len(errors),
        }
