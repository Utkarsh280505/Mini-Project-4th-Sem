# 🚀 Dynamic Pricing Optimization System

<p align="center">
  <b>AI-powered real-time pricing engine using demand forecasting & elasticity modeling</b><br>
  Built with FastAPI ⚡ + React ⚛️
</p>

---

## 🏷️ Badges

![Build](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Backend](https://img.shields.io/badge/backend-FastAPI-009688)
![Frontend](https://img.shields.io/badge/frontend-React-61DAFB)
![Database](https://img.shields.io/badge/database-PostgreSQL-blue)
![ML](https://img.shields.io/badge/ML-scikit--learn-orange)
![Auth](https://img.shields.io/badge/auth-JWT-yellow)
![Status](https://img.shields.io/badge/status-active-success)

---

## 💡 Problem Statement

Static pricing fails in dynamic markets. Businesses need **adaptive pricing strategies** that respond to:

* Changing demand 📈
* Inventory fluctuations 📦
* Competitor pricing 🏷️

---

## 🎯 Solution

This system dynamically computes **optimized product prices in real time** using:

* Demand-driven multipliers
* Price elasticity modeling
* Constraint-based optimization

📌 Result: **Better revenue optimization + smarter pricing decisions**

---

## 🔥 Key Highlights (Recruiter Focus)

* ⚡ **Real-time pricing engine** with API-driven architecture
* 📊 **Analytics dashboard** with actionable insights
* 🧠 **ML-integrated logic** using demand & elasticity
* 🔐 **Production-ready authentication (JWT + RBAC)**
* 🐳 **Dockerized full-stack deployment**
* 📁 **Clean modular architecture (scalable design)**

---

## 🛠 Tech Stack

| Layer         | Technology                        |
| ------------- | --------------------------------- |
| **Backend**   | FastAPI, SQLAlchemy               |
| **Database**  | SQLite (Dev), PostgreSQL (Prod)   |
| **Auth**      | JWT (python-jose), bcrypt         |
| **ML / Data** | scikit-learn, pandas, numpy       |
| **Frontend**  | React 18, TypeScript, Vite        |
| **UI**        | Tailwind CSS, shadcn/ui, Recharts |

---

## ⚡ Quick Start

### 🔧 Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

👉 API Docs: [http://localhost:8001/docs](http://localhost:8001/docs)

---

### 💻 Frontend

```bash
cd frontend
npm install
npm run dev
```

👉 App: [http://localhost:5173](http://localhost:5173)

---

## 🧠 Core Pricing Logic

```
new_price = base_price × demand_factor × elasticity_factor
```

### Demand Factor

```
demand_factor = 0.5 + (demand_score / 100)
```

### Elasticity Rules

| Type      | Condition | Factor |
| --------- | --------- | ------ |
| Inelastic | > -0.5    | 1.08   |
| Neutral   | > -1.5    | 1.00   |
| Elastic   | ≤ -1.5    | 0.95   |

### Constraints

```
0.5 × base_price ≤ new_price ≤ 2.0 × base_price
```

---

## 📊 Features

* ⚡ Real-time data ingestion (API + CSV)
* 📈 Dynamic price optimization
* 🔒 Price constraints enforcement
* 🎯 Market simulation engine
* 🧾 Pricing history tracking
* 📊 Analytics dashboard (KPIs, trends)
* 🔐 JWT authentication + role-based access
* 🎨 Modern responsive UI

---

## 📡 API Overview

### Core APIs

* `POST /api/v1/ingest`
* `POST /api/v1/update`
* `GET /api/v1/prices`
* `POST /api/v1/run`

### Authentication

* `POST /api/v1/auth/login`
* `POST /api/v1/auth/register`
* `GET /api/v1/auth/me`

---

## 🐳 Docker Deployment

```bash
docker-compose up -d
```

| Service  | URL                                            |
| -------- | ---------------------------------------------- |
| Frontend | [http://localhost:80](http://localhost:80)     |
| Backend  | [http://localhost:8000](http://localhost:8000) |

---

## 📁 Project Structure

```
backend/
  ├── core/
  ├── models/
  ├── routers/
  ├── services/
frontend/
  ├── components/
  ├── pages/
  ├── services/
```

---

## 📈 Impact / Use Cases

* 🛒 E-commerce dynamic pricing
* 🏨 Hotel & airline pricing systems
* 📦 Inventory-aware pricing strategies
* 📊 Business intelligence tools

---

## 🔮 Future Scope

* AI-based demand forecasting models
* Real-time competitor price scraping
* Advanced anomaly detection
* Cloud deployment (AWS / Azure)

---

## 🤝 Contributing

```bash
fork → clone → branch → commit → push → PR
```

---

## 📜 License

MIT License

---

## ⭐ Why This Project Stands Out

* Combines **AI + Backend + Frontend + DevOps**
* Demonstrates **real-world system design**
* Shows **production-ready engineering practices**
* Strong fit for roles in:

  * Software Development 💻
  * Data Science 📊
  * ML Engineering 🤖

---
<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/729d73a7-07cd-4265-ba85-3133dc411330" />



