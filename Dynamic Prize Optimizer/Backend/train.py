import pandas as pd
import numpy as np
import pickle
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

def data_preprocessing_pipeline(df):

    # Define numeric columns
    numeric_features = [
        'Number_of_Riders',
        'Number_of_Drivers',
        'Expected_Ride_Duration'
    ]
    
    # Handle missing values
    for col in numeric_features:
        df[col] = df[col].fillna(df[col].mean())
    
    df = df.fillna(df.mode())
    
    # Outlier handling using IQR
    for col in numeric_features:
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        df[col] = np.where(df[col] < lower_bound, df[col].mean(), df[col])
        df[col] = np.where(df[col] > upper_bound, df[col].mean(), df[col])
    
    # Encoding categorical features
    df['Vehicle_Type'] = df['Vehicle_Type'].map({'Economy': 0, 'Premium': 1})
    
    # Target definition (derived dynamic price)
    # Using percentile-based logic to simulate historical dynamic pricing
    demand_p = df.quantile(0.75)
    supply_p = df.quantile(0.25)
    df['adjusted_ride_cost'] = (
    df['Number_of_Riders'] / df['Number_of_Drivers']
) * df['Expected_Ride_Duration'] * 10
    
    return df

def train():
    # Load dataset
    # In a real scenario, this would be: df = pd.read_csv('dynamic_pricing.csv')
    # For demonstration, we create a synthetic set
    data = {
        'Number_of_Riders': np.random.randint(1, 100, 1000),
        'Number_of_Drivers': np.random.randint(1, 50, 1000),
        'Expected_Ride_Duration': np.random.randint(5, 60, 1000),
        'Vehicle_Type': np.random.choice(['Economy', 'Premium'], 1000)
    }
    df = pd.DataFrame(data)
    
    # Process data
    processed_df = data_preprocessing_pipeline(df)
    
    # Feature selection
    X = processed_df
    y = processed_df['adjusted_ride_cost']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Model Initialization and Training
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Save model and artifacts
    with open('pricing_model.pkl', 'wb') as f:
        pickle.dump(model, f)
    
    print("Model Training Complete. Saved as pricing_model.pkl")

if __name__ == "__main__":
    train()
