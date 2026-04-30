🚀 Dynamic Pricing Optimization System

An AI-powered Dynamic Pricing System built using FastAPI (backend) and React (frontend).
It leverages demand forecasting and price elasticity to generate optimized product pricing in real time.

✨ Key Features
⚡ Real-time Data Ingestion
JSON API (POST /ingest)
CSV bulk upload support
📈 Dynamic Price Optimization
Formula-driven pricing using demand & elasticity
🔒 Price Constraints
Minimum: 0.5 × base_price
Maximum: 2.0 × base_price
🎯 Market Simulation
Random demand (0.5–1.5)
Inventory fluctuation testing
🧾 Pricing History Tracking
Logs all price changes with context
📊 Analytics Dashboard
Revenue trends
Demand insights
KPI metrics
🔐 Authentication System
JWT-based login & refresh tokens
Role-based access (Admin/User)
🎨 Modern UI
Dark / Light theme
Responsive dashboard
🛠 Tech Stack
Layer	Technology
Backend	FastAPI, SQLAlchemy
Database	SQLite (Dev), PostgreSQL (Prod)
Auth	JWT (python-jose), bcrypt
ML / Data	scikit-learn, pandas, numpy
Frontend	React 18, TypeScript, Vite
UI	Tailwind CSS, shadcn/ui, Recharts
⚡ Quick Start
🔧 Backend Setup
cd backend
python -m venv .venv

# Activate environment
# Windows:
.venv\Scripts\activate

# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --port 8001

👉 API Docs: http://localhost:8001/docs

💻 Frontend Setup
cd frontend
npm install
npm run dev

👉 App: http://localhost:5173

🔑 Demo Credentials
Role	Email	Password
Admin	admin@example.com
	admin123
Demo	demo@example.com
	demo123
📡 API Endpoints
🔹 Core APIs
Method	Endpoint	Description
POST	/api/v1/ingest	Ingest real-time market data
POST	/api/v1/update	Simulate demand changes
GET	/api/v1/prices	Get optimized prices
POST	/api/v1/run	Calculate & store prices
🔹 Data Input / Output
Method	Endpoint	Description
POST	/api/v1/io/upload-csv	Upload product CSV
POST	/api/v1/io/simulate-input	Simulate demand/inventory
GET	/api/v1/io/products	Fetch products
POST	/api/v1/io/optimize-output	Optimize prices
GET	/api/v1/io/pricing-history	Pricing logs
DELETE	/api/v1/io/uploaded-products	Remove uploaded data
🔹 Authentication
Method	Endpoint	Description
POST	/api/v1/auth/register	Register user
POST	/api/v1/auth/login	Login (JWT tokens)
POST	/api/v1/auth/refresh	Refresh token
GET	/api/v1/auth/me	Current user
🧠 Pricing Logic
new_price = base_price × demand_factor × elasticity_factor
📊 Demand Factor
demand_factor = 0.5 + (demand_score / 100)
Range: 0.5 → 1.5
📉 Elasticity Factor
Type	Condition	Factor
Inelastic	> -0.5	1.08
Neutral	> -1.5	1.00
Elastic	≤ -1.5	0.95
🔒 Price Limits
min_price = 0.5 × base_price
max_price = 2.0 × base_price
📂 CSV Upload Format
product_id,name,base_price,demand,inventory,competitor_price
SKU-101,Widget Alpha,49.99,1.2,150,52.00
SKU-102,Widget Beta,79.99,0.8,80,
Fields:
product_id → Unique SKU
demand → Range (0.5 – 1.5)
competitor_price → Optional
🐳 Docker Setup
docker-compose up -d
Services:
Frontend → http://localhost:80
Backend → http://localhost:8000
PostgreSQL → Included
📁 Project Structure
.
├── backend/
│   ├── app/
│   │   ├── core/        # Config & security
│   │   ├── models/      # Database models
│   │   ├── routers/     # API routes
│   │   ├── schemas/     # Data validation
│   │   ├── services/    # Business logic
│   │   └── seed/        # Sample data
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── components/  # UI components
│       ├── pages/       # Application pages
│       ├── hooks/       # Custom hooks
│       ├── services/    # API calls
│       └── types/       # Type definitions
│
└── docker-compose.yml
📌 Future Improvements
🔮 Advanced ML pricing models
📡 Live market API integration
📊 More analytics (forecasting, anomaly detection)
☁️ Cloud deployment (AWS / Azure)
🤝 Contributing

Contributions are welcome!

fork → clone → create branch → commit → push → pull request
📜 License

This project is licensed under the MIT License.
