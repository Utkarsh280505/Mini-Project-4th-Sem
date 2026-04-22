import pandas as pd
import numpy as np
import pickle
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score

def generate_data(n=5000):
    np.random.seed(42)
    df = pd.DataFrame({
        'Number_of_Riders': np.random.randint(1, 100, n),
        'Number_of_Drivers': np.random.randint(1, 50, n),
        'Expected_Ride_Duration': np.random.randint(5, 120, n),
        'Vehicle_Type': np.random.randint(0, 2, n),
        'Hour': np.random.randint(0, 24, n),
        'Traffic_Level': np.random.randint(1, 5, n)
    })

    df['Is_Peak'] = df['Hour'].apply(lambda x: 1 if (8 <= x <= 10 or 17 <= x <= 20) else 0)
    df['Base_Price'] = df['Expected_Ride_Duration'] * 8
    df['Demand_Supply_Ratio'] = df['Number_of_Riders'] / df['Number_of_Drivers']
    df['Surge_Multiplier'] = 1 + (
        0.5 * df['Is_Peak'] +
        0.3 * df['Traffic_Level'] +
        0.4 * (df['Demand_Supply_Ratio'] - 1).clip(lower=0)
    )
    df['Surge_Multiplier'] += df['Vehicle_Type'] * 0.3
    df['Adjusted_Price'] = df['Base_Price'] * df['Surge_Multiplier']

    return df

def train():
    df = generate_data()

    feature_cols = [
        'Number_of_Riders',
        'Number_of_Drivers',
        'Expected_Ride_Duration',
        'Vehicle_Type',
        'Is_Peak',
        'Traffic_Level'
    ]

    X = df[feature_cols]
    y = df['Adjusted_Price']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(n_estimators=200, max_depth=10, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    print("Model R2 Score:", r2_score(y_test, y_pred))

    # Save model + column order together
    with open('pricing_model.pkl', 'wb') as f:
        pickle.dump({"model": model, "features": feature_cols}, f)

    print("Model saved with metadata (model + feature columns)")

if __name__ == "__main__":
    train()
