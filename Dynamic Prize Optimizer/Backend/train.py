import pandas as pd
import numpy as np
import pickle
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split


def data_preprocessing_pipeline(df):
    """
    Cleans data and engineers features for the pricing model.
    """

    # Identify numeric columns
    numeric_features = [
        'Number_of_Riders',
        'Number_of_Drivers',
        'Expected_Ride_Duration'
    ]

    # Handle missing values for numeric columns
    for col in numeric_features:
        df[col] = df[col].fillna(df[col].mean())

    # Handle missing values for categorical columns
    df = df.fillna(df.mode().iloc[0])

    # Outlier handling using IQR
    for col in numeric_features:
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1

        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR

        df[col] = np.where(df[col] < lower_bound, df[col].mean(), df[col])
        df[col] = np.where(df[col] > upper_bound, df[col].mean(), df[col])

    # Encode categorical feature
    df['Vehicle_Type'] = df['Vehicle_Type'].map({'Economy': 0, 'Premium': 1})

    # Dynamic price calculation (Demand / Supply concept)
    df['adjusted_ride_cost'] = (
        df['Number_of_Riders'] /
        df['Number_of_Drivers']
    ) * df['Expected_Ride_Duration']

    # Scaling price for realism
    df['adjusted_ride_cost'] = df['adjusted_ride_cost'] * 10

    return df


def train():
    """
    Train Random Forest model for dynamic pricing
    """

    # Create synthetic dataset
    data = {
        'Number_of_Riders': np.random.randint(1, 100, 1000),
        'Number_of_Drivers': np.random.randint(1, 50, 1000),
        'Expected_Ride_Duration': np.random.randint(5, 60, 1000),
        'Vehicle_Type': np.random.choice(['Economy', 'Premium'], 1000)
    }

    df = pd.DataFrame(data)

    # Preprocess data
    processed_df = data_preprocessing_pipeline(df)

    # Feature selection
    X = processed_df.drop('adjusted_ride_cost', axis=1)
    y = processed_df['adjusted_ride_cost']

    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Model initialization
    model = RandomForestRegressor(
        n_estimators=100,
        random_state=42
    )

    # Train model
    model.fit(X_train, y_train)

    # Save model
    with open('pricing_model.pkl', 'wb') as f:
        pickle.dump(model, f)

    print("Model Training Complete.")
    print("Model saved as pricing_model.pkl")


if __name__ == "__main__":
    train()
