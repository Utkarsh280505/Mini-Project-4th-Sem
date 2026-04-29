from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_cors import CORS
import pickle
import pandas as pd
import os

app = Flask(__name__, template_folder='templates', static_folder='static')
app.secret_key = 'super-secret-key-for-dynamic-pricing'
CORS(app)

@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response

# Load model
def load_model():
    try:
        model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pricing_model.pkl')
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
            feature_cols = ['Number_of_Riders', 'Number_of_Drivers', 'Expected_Ride_Duration', 'Vehicle_Type']
            return model, feature_cols
    except Exception as e:
        print(f"Error loading model: {e}")
        return None, None

model, feature_cols = load_model()

@app.route('/')
def index():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        if username == 'admin' and password == 'password':
            session['logged_in'] = True
            return redirect(url_for('index'))
        else:
            error = 'Invalid Credentials. Please try again.'
    return render_template('login.html', error=error)

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect(url_for('login'))

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        riders = int(data['riders'])
        drivers = int(data['drivers'])
        duration = int(data['duration'])
        vehicle = int(data['vehicle'])
        is_peak = int(data['is_peak'])
        traffic = int(data['traffic'])
        
        features = pd.DataFrame([{
            "Number_of_Riders": riders,
            "Number_of_Drivers": drivers,
            "Expected_Ride_Duration": duration,
            "Vehicle_Type": vehicle,
            "Is_Peak": is_peak,
            "Traffic_Level": traffic
        }])[feature_cols]
        
        base_price = duration * 8
        predicted_price = model.predict(features)[0]
        
        ratio = riders / max(drivers, 1)
        if ratio > 2:
            predicted_price *= 1.2
        elif ratio < 0.8:
            predicted_price *= 0.9
        
        if is_peak:
            predicted_price *= 1.1
        
        predicted_price *= (1 + traffic * 0.05)
        
        if vehicle == 1:
            predicted_price *= 1.15
        
        final_price = round(predicted_price, 2)
        
        return jsonify({
            'price': final_price,
            'base_price': base_price,
            'ratio': round(ratio, 2)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
