# 🚀 Dynamic Pricing Optimization Engine

![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)
![ML](https://img.shields.io/badge/Machine%20Learning-Random%20Forest-green)
![Framework](https://img.shields.io/badge/Framework-Streamlit-red)
![License](https://img.shields.io/badge/License-MIT-yellow)

An **enterprise-inspired Dynamic Pricing System** that predicts optimal ride prices using **Machine Learning** and simulates **real-time pricing adjustments** based on demand and supply conditions.

This project mimics the architecture used in **ride-hailing, airline ticketing, and e-commerce pricing engines**.

---

# 🎯 System Execution & Workflow Architecture

The system is designed to be:

✔ **Deterministic**
✔ **Reproducible**
✔ **Modular**
✔ **Production-ready**

The architecture mirrors real-world **dynamic pricing engines used in companies like Uber, Amazon, and airline booking systems**.

---

# 🔄 Operational Workflow

## 📥 1️⃣ Data Ingestion Layer

**Input Source:** CSV Dataset Interface

The system accepts **historical ride transaction data**, including:

* Ride distance
* Time of booking
* Demand level
* Supply availability
* Ride price

### Features

* Bulk dataset upload
* Schema validation
* Standardized data formatting

🎯 **Goal:** Create a reliable data foundation for pricing predictions.

---

# 🧹 2️⃣ Data Preprocessing & Transformation

Before model training, the dataset goes through a **data refinement pipeline**.

### Processing Steps

#### 🧼 Data Cleaning

* Handles missing values
* Removes corrupted records

#### 📊 Outlier Treatment (IQR Method)

* Detects abnormal ride costs
* Removes extreme demand spikes

#### 🔢 Categorical Encoding

Converts non-numeric features into machine-readable format.

Examples:

* Location
* Time slot
* Ride category

#### 📏 Feature Scaling *(if required)*

Ensures consistent feature ranges.

🎯 **Outcome:** Clean and structured **ML-ready dataset**.

---

# 🤖 3️⃣ Model Training Phase

### Machine Learning Core

The system trains a **Random Forest Regressor** to predict ride prices.

The model learns relationships between:

* Demand
* Supply
* Distance
* Time
* Market conditions

### Why Random Forest?

✔ Captures **non-linear relationships**
✔ **Reduces overfitting** using ensemble learning
✔ Handles **mixed-type features**
✔ Robust against **noisy data**

🎯 **Output:** A trained ML model capable of predicting optimal ride prices.

---

# 💾 4️⃣ Model Serialization

After training, the model is saved for deployment.

### Saved Artifacts

```
pricing_model.pkl
preprocessing_pipeline.pkl
```

### Benefits

⚡ Fast loading
🔁 Reproducible predictions
🧠 No retraining required during inference

This allows **plug-and-play deployment** in production environments.

---

# ⚡ 5️⃣ Inference Engine

### `DynamicPricingEngine` Class

The inference engine loads the trained model and performs **real-time pricing predictions**.

### Pricing Formula

```
Final Price = ML Predicted Price × Dynamic Multiplier
```

### Dynamic Multiplier Factors

📈 Current demand
📉 Available supply
🔄 Demand–Supply ratio

🎯 **Result:** Real-time adaptive pricing simulation.

---

# 🖥 6️⃣ Interactive Interface

The application interface is built using **Streamlit**.

### Dashboard Features

📊 Interactive sliders
📈 Real-time price visualization
🧪 Sensitivity analysis
🔍 What-if simulations

The dashboard allows **non-technical users and business teams** to experiment with pricing strategies.

---

# 🔁 7️⃣ Feedback Loop *(Future Enhancement)*

To enable **continuous learning**, the system can incorporate a feedback mechanism.

### Feedback Data

* Actual ride prices
* Customer acceptance/rejection
* Ride completion data

### Workflow

1. New ride data is logged
2. Dataset is updated
3. Model retraining is triggered
4. Updated model is redeployed

🎯 **Outcome:** A continuously improving **adaptive pricing engine**.

---

# 🛠 Running the Project Locally

Follow these steps to run the project on your system.

---

## 1️⃣ Clone the Repository

```bash
git clone <repository-url>
cd <project-folder>
```

---

## 2️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

This installs required libraries such as:

* pandas
* scikit-learn
* streamlit
* plotly

---

## 3️⃣ Train the Model

```bash
python train.py
```

This step will generate:

```
pricing_model.pkl
preprocessing_pipeline.pkl
```

⚠️ **Important:**
The frontend application will not work without this step.

---

## 4️⃣ Run the Application

```bash
streamlit run app.py
```

This will:

* Launch the local Streamlit server
* Open the dashboard in your browser
* Enable real-time pricing simulations

---

# 🏗 System Architecture

```
Raw Dataset
     │
     ▼
Data Cleaning & Preprocessing
     │
     ▼
Feature Engineering
     │
     ▼
Random Forest Model Training
     │
     ▼
Model Serialization (.pkl)
     │
     ▼
Dynamic Pricing Inference Engine
     │
     ▼
Streamlit Interactive Dashboard
     │
     ▼
User Simulation
     │
     ▼
Future Feedback Loop
```

---

# 📊 Tech Stack

| Component            | Technology              |
| -------------------- | ----------------------- |
| Programming Language | Python                  |
| ML Framework         | Scikit-Learn            |
| Model                | Random Forest Regressor |
| Data Processing      | Pandas                  |
| Visualization        | Plotly                  |
| UI Framework         | Streamlit               |

---

# 📌 Future Improvements

* Real-time API integration
* Online model retraining
* Demand forecasting models
* Deployment using Docker
* Cloud hosting (AWS/GCP)

---

# 👨‍💻 Author

Utkarsh Gupta
Jayant Kumar
Kapish Sharma

---

These **massively increase GitHub project quality.**
