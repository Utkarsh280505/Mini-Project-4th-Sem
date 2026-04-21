import streamlit as st 
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import pickle
import numpy as np

# -----------------------------
# Page Configuration
# -----------------------------
st.set_page_config(
    page_title="Dynamic Price Optimizer",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# -----------------------------
# Global Custom CSS
# -----------------------------
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap');

html, body, [class*="css"] {
    font-family: 'Inter', sans-serif;
}

/* Dark gradient background */
.stApp {
    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
    color: #e0e0e0;
}

/* Sidebar styling */
[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
    border-right: 1px solid rgba(255,255,255,0.07);
}
[data-testid="stSidebar"] * {
    color: #c8d6e5 !important;
}
[data-testid="stSidebar"] .stRadio label {
    font-size: 15px;
    padding: 6px 10px;
    border-radius: 8px;
    transition: background 0.2s;
}
[data-testid="stSidebar"] .stRadio label:hover {
    background: rgba(255,255,255,0.08);
}

/* Metric cards */
[data-testid="metric-container"] {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 16px;
    padding: 18px 24px;
    backdrop-filter: blur(12px);
    transition: transform 0.2s;
}
[data-testid="metric-container"]:hover {
    transform: translateY(-3px);
}
[data-testid="stMetricValue"] {
    font-size: 2rem !important;
    font-weight: 800 !important;
    color: #a78bfa !important;
}
[data-testid="stMetricLabel"] {
    font-size: 0.85rem !important;
    color: #94a3b8 !important;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

/* Buttons */
.stButton > button {
    background: linear-gradient(135deg, #7c3aed, #4f46e5);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 10px 24px;
    font-weight: 600;
    font-size: 15px;
    letter-spacing: 0.02em;
    transition: all 0.25s ease;
    box-shadow: 0 4px 20px rgba(124,58,237,0.4);
}
.stButton > button:hover {
    background: linear-gradient(135deg, #6d28d9, #4338ca);
    transform: translateY(-2px);
    box-shadow: 0 6px 28px rgba(124,58,237,0.6);
}

/* Inputs */
.stTextInput input, .stNumberInput input, .stSelectbox select {
    background: rgba(255,255,255,0.06) !important;
    border: 1px solid rgba(255,255,255,0.15) !important;
    border-radius: 10px !important;
    color: #e2e8f0 !important;
    padding: 10px 14px !important;
}
.stTextInput input:focus, .stNumberInput input:focus {
    border-color: #7c3aed !important;
    box-shadow: 0 0 0 2px rgba(124,58,237,0.25) !important;
}

/* Slider */
.stSlider [data-baseweb="slider"] {
    padding: 6px 0;
}
.stSlider [data-baseweb="thumb"] {
    background: #7c3aed !important;
    border: 2px solid #a78bfa !important;
}

/* Divider */
hr {
    border-color: rgba(255,255,255,0.08) !important;
}

/* Info / Alert boxes */
.stAlert {
    border-radius: 12px !important;
    border-left-width: 4px !important;
}

/* Section headers */
h1 { color: #e2e8f0 !important; font-weight: 800 !important; letter-spacing: -0.02em; }
h2 { color: #cbd5e1 !important; font-weight: 700 !important; }
h3 { color: #94a3b8 !important; font-weight: 600 !important; }

/* Plotly chart background */
.js-plotly-plot .plotly .main-svg {
    border-radius: 16px;
}

/* Login card */
.login-card {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 24px;
    padding: 40px;
    backdrop-filter: blur(20px);
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}

/* Insight card */
.insight-card {
    background: rgba(124,58,237,0.1);
    border: 1px solid rgba(124,58,237,0.25);
    border-radius: 16px;
    padding: 20px 24px;
    margin: 8px 0;
}

/* Tag badges */
.badge {
    display: inline-block;
    background: rgba(124,58,237,0.2);
    color: #a78bfa;
    border: 1px solid rgba(124,58,237,0.4);
    border-radius: 20px;
    padding: 3px 12px;
    font-size: 0.78rem;
    font-weight: 600;
    margin: 3px;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.4); border-radius: 3px; }
</style>
""", unsafe_allow_html=True)

# -----------------------------
# Session State
# -----------------------------
if "logged_in" not in st.session_state:
    st.session_state.logged_in = False
if "prediction_made" not in st.session_state:
    st.session_state.prediction_made = False
if "last_result" not in st.session_state:
    st.session_state.last_result = {}

# -----------------------------
# Simple User Database
# -----------------------------
users = {
    "admin": "admin123",
    "user": "password123"
}

# -----------------------------
# Load Model
# -----------------------------
@st.cache_resource
def load_model():
    try:
        data = pickle.load(open("pricing_model.pkl", "rb"))
        return data["model"], data["features"]
    except:
        return None, None

# -----------------------------
# Login Page
# -----------------------------
def login():
    col_left, col_center, col_right = st.columns([1, 1.2, 1])
    with col_center:
        st.markdown("<br><br>", unsafe_allow_html=True)
        st.markdown("""
        <div style="text-align:center; margin-bottom: 30px;">
            <div style="font-size: 64px; margin-bottom: 12px;">⚡</div>
            <h1 style="font-size: 2.2rem; font-weight: 800; background: linear-gradient(135deg, #a78bfa, #60a5fa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">
                Dynamic Price Optimizer
            </h1>
            <p style="color: #64748b; font-size: 1rem; margin-top: 8px;">AI-Powered Ride Fare Intelligence</p>
        </div>
        """, unsafe_allow_html=True)

        st.markdown('<div class="login-card">', unsafe_allow_html=True)

        st.markdown("### 🔐 Sign In")
        username = st.text_input("Username", placeholder="Enter username...", label_visibility="collapsed")
        st.markdown('<p style="color:#64748b;font-size:0.82rem;margin:-8px 0 8px;">Username</p>', unsafe_allow_html=True)
        password = st.text_input("Password", type="password", placeholder="Enter password...", label_visibility="collapsed")
        st.markdown('<p style="color:#64748b;font-size:0.82rem;margin:-8px 0 16px;">Password</p>', unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)
        col_btn, _ = st.columns([2, 1])
        with col_btn:
            login_btn = st.button("🚀 Sign In", use_container_width=True)

        if login_btn:
            if username in users and users[username] == password:
                st.session_state.logged_in = True
                st.success("✅ Login Successful! Redirecting...")
                st.experimental_rerun()
            else:
                st.error("❌ Invalid username or password. Try: admin / admin123")

        st.markdown('</div>', unsafe_allow_html=True)

        st.markdown("""
        <p style="text-align:center; color:#475569; font-size:0.82rem; margin-top:20px;">
            Demo credentials: <code>admin</code> / <code>admin123</code>
        </p>
        """, unsafe_allow_html=True)


# -----------------------------
# Navigation
# -----------------------------
def navbar():
    st.sidebar.markdown("""
    <div style="text-align:center; padding: 16px 0 24px;">
        <div style="font-size:40px">⚡</div>
        <div style="font-weight:700; font-size:1.1rem; color:#a78bfa;">Price Optimizer</div>
        <div style="font-size:0.75rem; color:#475569; margin-top:4px;">AI-Powered Engine</div>
    </div>
    """, unsafe_allow_html=True)
    st.sidebar.divider()
    page = st.sidebar.radio("", ["📊 Dashboard", "📘 About", "🆘 Help", "📞 Contact"])
    return page


# -----------------------------
# Dashboard
# -----------------------------
def dashboard():
    st.markdown("""
    <h1 style="font-size:2.4rem; margin-bottom:4px;">🚀 Dynamic Price Optimization Engine</h1>
    <p style="color:#64748b; font-size:1.05rem; margin-bottom:28px;">
        Real-time fare intelligence powered by a Random Forest ML model
    </p>
    """, unsafe_allow_html=True)

    model, feature_cols = load_model()
    if model is None:
        st.error("⚠️ Model file not found. Please run `train.py` first.")
        return

    # ── Sidebar inputs ──────────────────────────────────
    st.sidebar.markdown("### ⚙️ Market Parameters")

    num_riders  = st.sidebar.slider("👥 Riders (Demand)", 1, 100, 20)
    num_drivers = st.sidebar.slider("🚗 Drivers (Supply)", 1, 50, 10)
    duration    = st.sidebar.number_input("⏱️ Ride Duration (min)", 5, 120, 25)

    vehicle     = st.sidebar.selectbox("🏎️ Vehicle Type", ["Economy", "Premium"])
    vehicle_type = 0 if vehicle == "Economy" else 1

    hour = st.sidebar.slider("🕒 Hour of Day", 0, 23, 12)
    traffic = st.sidebar.slider("🚦 Traffic Level", 1, 5, 2)

    is_peak = 1 if (8 <= hour <= 10 or 17 <= hour <= 20) else 0

    st.sidebar.divider()
    calc_btn = st.sidebar.button("⚡ Calculate Optimized Price", use_container_width=True)

    # ── Live demand indicator ──────────────────────────
    ratio = round(num_riders / num_drivers, 2)
    if ratio >= 2.5:
        demand_label = "🔴 Very High Demand"
        demand_color = "#ef4444"
    elif ratio >= 1.5:
        demand_label = "🟠 High Demand"
        demand_color = "#f97316"
    elif ratio >= 1.0:
        demand_label = "🟡 Moderate Demand"
        demand_color = "#eab308"
    else:
        demand_label = "🟢 Low Demand"
        demand_color = "#22c55e"

    # ── Prediction ─────────────────────────────────────
    features = pd.DataFrame([{
        "Number_of_Riders": num_riders,
        "Number_of_Drivers": num_drivers,
        "Expected_Ride_Duration": duration,
        "Vehicle_Type": vehicle_type,
        "Is_Peak": is_peak,
        "Traffic_Level": traffic
    }])[feature_cols]

    base_price = duration * 8
    predicted_price = model.predict(features)[0]

    # Business logic layer
    if ratio > 2:
        predicted_price *= 1.2
    elif ratio < 0.8:
        predicted_price *= 0.9

    live_price = round(predicted_price, 2)

    if calc_btn:
        st.session_state.prediction_made = True
        st.session_state.last_result = {
            "price": live_price,
            "ratio": ratio,
            "demand_label": demand_label,
            "demand_color": demand_color,
            "num_riders": num_riders,
            "num_drivers": num_drivers,
            "duration": duration,
            "vehicle_type": vehicle_type,
            "vehicle": vehicle,
        }

    if st.session_state.prediction_made:
        res = st.session_state.last_result

        # Metrics row
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("💰 Optimized Fare", f"₹{live_price}")
        c2.metric("📊 Base Price", f"₹{base_price}")
        c3.metric("📈 Demand/Supply", f"{ratio}x")
        c4.metric("🚦 Traffic Level", traffic)

        # ── Charts row ─────────────────────────────────
        col_chart1, col_chart2 = st.columns(2)

        with col_chart1:
            st.markdown("#### 📉 Fare vs. Rider Demand")
            range_riders = list(range(1, 101, 5))
            prices_line = [round(model.predict(pd.DataFrame([{"Number_of_Riders": r, "Number_of_Drivers": res['num_drivers'], "Expected_Ride_Duration": res['duration'], "Vehicle_Type": res['vehicle_type'], "Is_Peak": is_peak, "Traffic_Level": traffic}])[feature_cols])[0], 2) for r in range_riders]
            df_line = pd.DataFrame({"Riders": range_riders, "Predicted Fare (₹)": prices_line})
            fig_line = px.line(
                df_line, x="Riders", y="Predicted Fare (₹)",
                markers=True,
                color_discrete_sequence=["#a78bfa"]
            )
            fig_line.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(255,255,255,0.03)",
                font_color="#cbd5e1",
                margin=dict(l=10, r=10, t=10, b=10),
                xaxis=dict(gridcolor="rgba(255,255,255,0.06)"),
                yaxis=dict(gridcolor="rgba(255,255,255,0.06)"),
            )
            fig_line.add_vline(x=res['num_riders'], line_dash="dash", line_color="#f59e0b",
                               annotation_text=f"Current: {res['num_riders']} riders", annotation_font_color="#f59e0b")
            st.plotly_chart(fig_line, use_container_width=True)

        with col_chart2:
            st.markdown("#### 🚗 Fare vs. Driver Supply")
            range_drivers = list(range(1, 51, 3))
            prices_supply = [round(model.predict(pd.DataFrame([{"Number_of_Riders": res['num_riders'], "Number_of_Drivers": d, "Expected_Ride_Duration": res['duration'], "Vehicle_Type": res['vehicle_type'], "Is_Peak": is_peak, "Traffic_Level": traffic}])[feature_cols])[0], 2) for d in range_drivers]
            df_supply = pd.DataFrame({"Drivers": range_drivers, "Predicted Fare (₹)": prices_supply})
            fig_supply = px.area(
                df_supply, x="Drivers", y="Predicted Fare (₹)",
                color_discrete_sequence=["#60a5fa"]
            )
            fig_supply.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(255,255,255,0.03)",
                font_color="#cbd5e1",
                margin=dict(l=10, r=10, t=10, b=10),
                xaxis=dict(gridcolor="rgba(255,255,255,0.06)"),
                yaxis=dict(gridcolor="rgba(255,255,255,0.06)"),
            )
            fig_supply.add_vline(x=res['num_drivers'], line_dash="dash", line_color="#34d399",
                                 annotation_text=f"Current: {res['num_drivers']} drivers", annotation_font_color="#34d399")
            st.plotly_chart(fig_supply, use_container_width=True)

        # ── Duration heatmap ───────────────────────────
        st.markdown("#### 🔥 Fare Heatmap — Riders × Duration")
        rider_vals    = list(range(5, 101, 10))
        duration_vals = list(range(5, 121, 15))
        heat_data = []
        for r in rider_vals:
            row = []
            for d in duration_vals:
                p = round(model.predict(pd.DataFrame([{"Number_of_Riders": r, "Number_of_Drivers": res['num_drivers'], "Expected_Ride_Duration": d, "Vehicle_Type": res['vehicle_type'], "Is_Peak": is_peak, "Traffic_Level": traffic}])[feature_cols])[0], 2)
                row.append(p)
            heat_data.append(row)

        fig_heat = go.Figure(data=go.Heatmap(
            z=heat_data,
            x=[f"{d}m" for d in duration_vals],
            y=[f"{r} riders" for r in rider_vals],
            colorscale="Purples",
            colorbar=dict(title="Fare ₹", tickfont=dict(color="#cbd5e1"), titlefont=dict(color="#cbd5e1")),
            hoverongaps=False,
        ))
        fig_heat.update_layout(
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            font_color="#cbd5e1",
            margin=dict(l=10, r=10, t=10, b=10),
            height=320,
        )
        st.plotly_chart(fig_heat, use_container_width=True)

        # ── Insight cards ──────────────────────────────
        st.divider()
        st.markdown("#### 💡 Smart Insights")
        i1, i2, i3 = st.columns(3)
        with i1:
            st.markdown(f"""
            <div class="insight-card">
                <div style="font-size:1.6rem">{'🔴' if res['ratio']>1.5 else '🟢'}</div>
                <div style="font-weight:700; margin:6px 0 4px;">{res['demand_label']}</div>
                <div style="color:#94a3b8; font-size:0.85rem;">Demand-supply ratio is <b>{res['ratio']}x</b>.
                {'Prices surge during high demand.' if res['ratio']>1.5 else 'Supply meets demand. Stable pricing.'}</div>
            </div>""", unsafe_allow_html=True)
        with i2:
            st.markdown(f"""
            <div class="insight-card">
                <div style="font-size:1.6rem">🏎️</div>
                <div style="font-weight:700; margin:6px 0 4px;">{res['vehicle']} Mode</div>
                <div style="color:#94a3b8; font-size:0.85rem;">
                {'Premium vehicles attract higher base fares and surge multipliers.' if res['vehicle']=='Premium' else 'Economy mode offers budget-friendly rides with lower base pricing.'}
                </div>
            </div>""", unsafe_allow_html=True)
        with i3:
            est_surge = round((res['ratio'] - 1) * 100, 1)
            st.markdown(f"""
            <div class="insight-card">
                <div style="font-size:1.6rem">⚡</div>
                <div style="font-weight:700; margin:6px 0 4px;">Surge Factor</div>
                <div style="color:#94a3b8; font-size:0.85rem;">
                Estimated surge above base: <b>+{max(0, est_surge)}%</b>.
                Optimal booking window: {'Now or later' if res['ratio']<1.5 else 'Wait for supply to balance'}.
                </div>
            </div>""", unsafe_allow_html=True)

    else:
        st.markdown("""
        <div style="text-align:center; padding: 60px 20px;">
            <div style="font-size:72px; margin-bottom:16px;">⚡</div>
            <h2 style="color:#475569; font-weight:600;">Set Market Parameters & Calculate Price</h2>
            <p style="color:#334155; font-size:1rem;">
                Adjust the sliders in the sidebar and click <b>Calculate Optimized Price</b> to see predictions, charts, and insights.
            </p>
        </div>
        """, unsafe_allow_html=True)

    st.divider()
    st.markdown("""
    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:14px; padding:20px 24px;">
        <h4 style="margin:0 0 10px; color:#a78bfa;">⚙️ How the Model Works</h4>
        <p style="color:#94a3b8; font-size:0.9rem; margin:0;">
        The pricing engine uses a <b>Random Forest Regressor</b> trained on historical ride data. 
        It evaluates rider demand, driver supply, trip duration, and vehicle class to compute an 
        optimized fare — mimicking real-world surge pricing systems used by <b>Uber, Ola, and Lyft</b>.
        </p>
    </div>
    """, unsafe_allow_html=True)


# -----------------------------
# About Page
# -----------------------------
def about():
    st.markdown("""
    <h1>📘 About This Project</h1>
    <p style="color:#64748b; margin-bottom:28px;">Learn about the technology and purpose behind the engine.</p>
    """, unsafe_allow_html=True)

    col1, col2 = st.columns([1.6, 1])

    with col1:
        st.markdown("""
        <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.09); border-radius:18px; padding:28px;">
            <h3 style="color:#a78bfa; margin-top:0;">🎯 What is This?</h3>
            <p style="color:#94a3b8; line-height:1.7;">
            The <b>Dynamic Price Optimization Engine</b> is an ML-powered system that simulates 
            real-time ride pricing similar to modern ride-hailing platforms. It uses supply-demand 
            signals to compute a fair and optimized fare.
            </p>
            <h3 style="color:#a78bfa;">🧠 How It Works</h3>
            <p style="color:#94a3b8; line-height:1.7;">
            A <b>Random Forest Regressor</b> is trained on synthetic ride data encompassing 
            rider demand, driver supply, trip duration, and vehicle class. The model captures 
            non-linear relationships between these features to produce accurate fare predictions.
            </p>
        </div>
        """, unsafe_allow_html=True)

    with col2:
        st.markdown("""
        <div style="background:rgba(124,58,237,0.08); border:1px solid rgba(124,58,237,0.2); border-radius:18px; padding:28px;">
            <h3 style="color:#a78bfa; margin-top:0;">🛠️ Tech Stack</h3>
        """, unsafe_allow_html=True)

        techs = [
            ("🐍", "Python 3", "Core language"),
            ("🌊", "Streamlit", "Web framework"),
            ("🌲", "Scikit-Learn", "ML model training"),
            ("📊", "Plotly", "Interactive charts"),
            ("🐼", "Pandas & NumPy", "Data processing"),
        ]
        for icon, tech, desc in techs:
            st.markdown(f"""
            <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                <span style="font-size:1.4rem">{icon}</span>
                <div><div style="font-weight:600; color:#e2e8f0">{tech}</div><div style="font-size:0.78rem; color:#64748b">{desc}</div></div>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("</div>", unsafe_allow_html=True)


# -----------------------------
# Help Page
# -----------------------------
def help_page():
    st.markdown("""
    <h1>🆘 Help & Documentation</h1>
    <p style="color:#64748b; margin-bottom:28px;">Everything you need to use the system effectively.</p>
    """, unsafe_allow_html=True)

    steps = [
        ("1️⃣", "Login", "Use your credentials to access the dashboard. Demo: <code>admin / admin123</code>"),
        ("2️⃣", "Set Parameters", "Use the sidebar sliders to set rider demand, driver supply, duration, and vehicle type."),
        ("3️⃣", "Calculate Price", "Click the <b>Calculate Optimized Price</b> button to generate predictions."),
        ("4️⃣", "Explore Charts", "Analyze the Fare vs. Demand, Fare vs. Supply charts, and the heatmap."),
        ("5️⃣", "Read Insights", "Review the smart insight cards below the charts for actionable fare intelligence."),
    ]

    for icon, title, desc in steps:
        st.markdown(f"""
        <div style="display:flex; gap:18px; align-items:flex-start; background:rgba(255,255,255,0.04);
             border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:18px 22px; margin-bottom:12px;">
            <span style="font-size:2rem; flex-shrink:0">{icon}</span>
            <div>
                <div style="font-weight:700; font-size:1rem; color:#e2e8f0; margin-bottom:4px;">{title}</div>
                <div style="color:#94a3b8; font-size:0.9rem; line-height:1.6">{desc}</div>
            </div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown("#### 📋 Parameter Reference")
    param_data = {
        "Parameter": ["Riders (Demand)", "Drivers (Supply)", "Duration", "Vehicle Type"],
        "Range": ["1 – 100", "1 – 50", "5 – 120 min", "Economy / Premium"],
        "Impact": ["Higher → Higher Fare", "Higher → Lower Fare", "Longer → Higher Fare", "Premium → Higher Fare"],
    }
    st.dataframe(pd.DataFrame(param_data), use_container_width=True, hide_index=True)


# -----------------------------
# Contact Page
# -----------------------------
def contact():
    st.markdown("""
    <h1>📞 Contact</h1>
    <p style="color:#64748b; margin-bottom:28px;">Get in touch with the developer.</p>
    """, unsafe_allow_html=True)

    col1, col2 = st.columns([1, 1])

    with col1:
        st.markdown("""
        <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.09);
             border-radius:18px; padding:32px;">
            <div style="font-size:56px; text-align:center; margin-bottom:16px;">👨‍💻</div>
            <h3 style="text-align:center; color:#a78bfa; margin:0 0 6px;">Utkarsh Gupta</h3>
            <p style="text-align:center; color:#64748b; margin-bottom:24px;">B.Tech — AI &amp; Coding</p>
            <div style="display:flex; flex-direction:column; gap:14px;">
                <div style="display:flex; align-items:center; gap:12px; color:#94a3b8;">
                    <span style="font-size:1.3rem">📧</span>
                    <a href="mailto:utkarsh@example.com" style="color:#a78bfa; text-decoration:none;">utkarsh@example.com</a>
                </div>
                <div style="display:flex; align-items:center; gap:12px; color:#94a3b8;">
                    <span style="font-size:1.3rem">🌐</span>
                    <a href="https://github.com/yourgithub" style="color:#a78bfa; text-decoration:none;" target="_blank">github.com/yourgithub</a>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)

    with col2:
        st.markdown("""
        <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.09);
             border-radius:18px; padding:32px; height:100%;">
            <h3 style="color:#a78bfa; margin-top:0;">💬 Send a Message</h3>
        """, unsafe_allow_html=True)
        name    = st.text_input("Your Name")
        email   = st.text_input("Your Email")
        message = st.text_area("Message", height=110)
        if st.button("📨 Send Message"):
            if name and email and message:
                st.success("✅ Message sent successfully! We'll get back to you soon.")
            else:
                st.warning("Please fill in all fields.")
        st.markdown("</div>", unsafe_allow_html=True)


# -----------------------------
# Main App Logic
# -----------------------------
if not st.session_state.logged_in:
    login()
else:
    page = navbar()

    if "Dashboard" in page:
        dashboard()
    elif "About" in page:
        about()
    elif "Help" in page:
        help_page()
    elif "Contact" in page:
        contact()

    st.sidebar.divider()
    st.sidebar.markdown("<br>", unsafe_allow_html=True)
    if st.sidebar.button("🚪 Logout", use_container_width=True):
        st.session_state.logged_in = False
        st.session_state.prediction_made = False
        st.experimental_rerun()

    st.sidebar.markdown("""
    <div style="text-align:center; color:#334155; font-size:0.75rem; margin-top:16px;">
        Dynamic Price Optimizer v2.0<br>Powered by Random Forest ML
    </div>
    """, unsafe_allow_html=True)
