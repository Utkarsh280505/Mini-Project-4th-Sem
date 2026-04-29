from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import pickle
import pandas as pd
import os

app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)

# Load model
def load_model():
    try:
        with open('pricing_model.pkl', 'rb') as f:
            data = pickle.load(f)
            return data['model'], data['features']
    except:
        return None, None

model, feature_cols = load_model()

@app.route('/')
def index():
    return render_template('index.html')

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
