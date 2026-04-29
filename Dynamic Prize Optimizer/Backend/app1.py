import streamlit as st
import plotly.express as px
import pandas as pd
import pickle
import numpy as np

# Page Configuration
st.set_page_config(page_title="Dynamic Price Optimizer", layout="wide")

st.title("🚀 Dynamic Price Optimization Engine")

st.markdown("""
This application uses a **Random Forest Regressor** to predict optimal ride costs 
based on **demand and supply conditions** similar to ride-hailing platforms.
""")

# Load trained model
try:
    model = pickle.load(open("pricing_model.pkl", "rb"))
except FileNotFoundError:
    st.error("Model file not found. Please run train.py first.")
    st.stop()

# Sidebar Inputs
st.sidebar.header("Input Market Parameters")

num_riders = st.sidebar.slider("Number of Riders (Demand)", 1, 100, 20)
num_drivers = st.sidebar.slider("Number of Drivers (Supply)", 1, 50, 10)
duration = st.sidebar.number_input("Expected Ride Duration (minutes)", 5, 120, 25)
vehicle = st.sidebar.selectbox("Vehicle Type", ["Economy", "Premium"])

# Encode vehicle type
vehicle_type = 0 if vehicle == "Economy" else 1

# Prediction
if st.sidebar.button("Calculate Optimized Price"):

    features = np.array([[num_riders, num_drivers, duration, vehicle_type]])

    predicted_price = model.predict(features)[0]

    # Metrics
    col1, col2, col3 = st.columns(3)

    col1.metric("Predicted Fare", f"₹{round(predicted_price,2)}")
    col2.metric("Demand-Supply Ratio", f"{round(num_riders/num_drivers,2)}")
    col3.metric("Status", "High Demand" if num_riders > num_drivers else "Normal")

    # Visualization
    st.subheader("Price Elasticity Visualization")

    range_riders = list(range(1, 101, 10))

    prices = []
    for r in range_riders:
        data = np.array([[r, num_drivers, duration, vehicle_type]])
        price = model.predict(data)[0]
        prices.append(price)

    viz_df = pd.DataFrame({
        "Riders": range_riders,
        "Predicted Price": prices
    })

    fig = px.line(
        viz_df,
        x="Riders",
        y="Predicted Price",
        title=f"Price Variation for {vehicle} Vehicle given {num_drivers} Drivers"
    )

    st.plotly_chart(fig, use_container_width=True)

else:
    st.info("Adjust the parameters in the sidebar and click 'Calculate Optimized Price'.")

# Business Insights
st.divider()

st.subheader("Operational Insights")

st.write("""
The pricing model analyzes the **demand-supply balance** in real time.

Higher rider demand compared to available drivers results in **higher ride prices**, 
while balanced supply keeps pricing stable. This mimics the **dynamic pricing systems 
used by ride-hailing platforms like Uber and Ola.**
""")
