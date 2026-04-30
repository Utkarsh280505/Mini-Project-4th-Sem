# Dynamic Pricing Optimization System

An AI-powered dynamic pricing system built with **FastAPI** + **React**. It ingests real-time market data, applies demand forecasting and price elasticity modeling, and outputs optimized prices with business rule constraints.

---

## Features

- **Real-time data ingestion** — JSON API (`POST /ingest`) and CSV bulk upload
- **Dynamic price optimization** — `new_price = base_price × demand_factor × elasticity_factor`
- **Price bounds** — min = 0.5 × base_price, max = 2.0 × base_price
- **Market simulation** — randomize demand (0.5–1.5) and inventory to test pricing responses
- **Pricing history** — every price change is logged with demand/elasticity context
- **Analytics dashboard** — revenue trend, demand by category, KPI cards
- **JWT authentication** — access + refresh tokens, admin/user roles
- **Dark / Light theme**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, SQLAlchemy, SQLite (dev) / PostgreSQL (prod) |
| Auth | JWT (python-jose), bcrypt (passlib) |
| ML / Data | scikit-learn, numpy, pandas |
| Frontend | React 18, TypeScript, Vite |
| UI | Tailwind CSS, shadcn/ui, Recharts |

---

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8001
```

API docs: http://localhost:8001/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

### 3. Login

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | admin123 |
| Demo | demo@example.com | demo123 |

---

## API Endpoints

### Core (spec-exact)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/ingest` | Ingest real-time JSON market data |
| `POST` | `/api/v1/update` | Simulate market changes (random demand 0.5–1.5) |
| `GET` | `/api/v1/prices` | Get optimized prices (no DB write) |
| `POST` | `/api/v1/run` | Recalculate + save prices to DB |

### Input / Output

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/io/upload-csv` | Bulk import products from CSV |
| `POST` | `/api/v1/io/simulate-input` | Simulate demand + inventory changes |
| `GET` | `/api/v1/io/products` | Fetch current product data |
| `POST` | `/api/v1/io/optimize-output` | Optimize prices (preview or apply) |
| `GET` | `/api/v1/io/pricing-history` | View all price change records |
| `DELETE` | `/api/v1/io/uploaded-products` | Delete CSV-imported products |

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new user |
| `POST` | `/api/v1/auth/login` | Login, returns JWT tokens |
| `POST` | `/api/v1/auth/refresh` | Refresh access token |
| `GET` | `/api/v1/auth/me` | Get current user |

---

## Pricing Formula

```
new_price = base_price × demand_factor × elasticity_factor

demand_factor  = 0.5 + (demand_score / 100) × 1.0   → range 0.5–1.5
elasticity_factor:
  inelastic (> -0.5)  → 1.08
  neutral   (> -1.5)  → 1.00
  elastic   (≤ -1.5)  → 0.95

bounds: min = 0.5 × base_price,  max = 2.0 × base_price
```

---

## CSV Upload Format

```csv
product_id,name,base_price,demand,inventory,competitor_price
SKU-101,Widget Alpha,49.99,1.2,150,52.00
SKU-102,Widget Beta,79.99,0.8,80,
```

- `product_id` — any string SKU
- `demand` — multiplier 0.5–1.5 (1.2 = high demand)
- `competitor_price` — optional

---

## Docker

```bash
docker-compose up -d
```

- Frontend: http://localhost:80
- Backend: http://localhost:8000
- Requires PostgreSQL (included in compose)

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── core/          # Config, DB, auth, security
│   │   ├── models/        # SQLAlchemy models
│   │   ├── routers/       # API route handlers
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   └── seed/          # Demo data seeding
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/    # UI components
│       ├── pages/         # Dashboard, Products, Pricing, Analytics, DataIO
│       ├── hooks/         # React data hooks
│       ├── services/      # API client
│       └── types/         # TypeScript types
└── docker-compose.yml
```
