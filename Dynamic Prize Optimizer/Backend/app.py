import streamlit as st
import plotly.express as px
import pandas as pd
from engine import DynamicPricingEngine

# Page Configuration
st.set_page_config(page_title="Dynamic Prize Optimizer", layout="wide")

st.title("🚀 Dynamic Prize Optimization Engine")
st.markdown("""
This application utilizes a **Random Forest Regressor** to predict optimal ride costs 
based on real-time demand and supply signals, mirroring the intelligent flow of ResolveX.
""")

# Load Engine
try:
    engine = DynamicPricingEngine('pricing_model.pkl')
except FileNotFoundError:
    st.error("Model file not found. Please run train.py first.")
    st.stop()

# Sidebar for Input Parameters
st.sidebar.header("Input Market Parameters")
num_riders = st.sidebar.slider("Number of Riders (Demand)", 1, 100, 20)
num_drivers = st.sidebar.slider("Number of Drivers (Supply)", 1, 50, 10)
duration = st.sidebar.number_input("Expected Duration (min)", 5, 120, 25)
vehicle = st.sidebar.selectbox("Vehicle Type", ["Economy", "Premium"])

# Price Prediction
if st.sidebar.button("Calculate Optimized Price"):
    predicted_price = engine.predict(num_riders, num_drivers, duration, vehicle)
    
    # Display Metrics
    col1, col2, col3 = st.columns(3)
    col1.metric("Predicted Fare", f"${predicted_price}")
    col2.metric("Demand-Supply Ratio", f"{round(num_riders/num_drivers, 2)}")
    col3.metric("Status", "High Demand" if num_riders > num_drivers else "Normal")
    
    # Visualization: Price Sensitivity
    st.subheader("Price Elasticity Visualization")
    
    # Generate range data for visualization
    range_riders = list(range(1, 101, 10))
    prices = [engine.predict(r, num_drivers, duration, vehicle) for r in range_riders]
    
    viz_df = pd.DataFrame({
        'Riders': range_riders,
        'Predicted Price': prices
    })
    
    fig = px.line(viz_df, x='Riders', y='Predicted Price', 
                  title=f"Price Variation for {vehicle} Vehicle given {num_drivers} Drivers")
    st.plotly_chart(fig, use_container_width=True)
else:
    st.info("Adjust the parameters in the sidebar and click 'Calculate Optimized Price' to begin.")

# Business Insights Section
st.divider()
st.subheader("Operational Insights")
st.write("""
By analyzing historical distributions, the system identifies the most profitable 
pricing windows. Similar to **ResolveX**, the 'Learning Flow' here ensures that 
we are not just applying static rules but are optimizing for long-term revenue.
""")