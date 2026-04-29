import pickle
import numpy as np
import pandas as pd

class DynamicPricingEngine:
    def __init__(self, model_path):
        with open(model_path, 'rb') as f:
            self.model = pickle.load(f)
            
    def get_dynamic_multiplier(self, riders, drivers):
        """
        Calculates a real-time multiplier based on demand-supply ratios.
        This represents the 'Learning Flow' logic of adapting to context.
        """
        # Multipliers based on relative demand levels
        if riders > (drivers * 2):
            return 1.5 # High surge
        elif riders > drivers:
            return 1.2 # Moderate surge
        elif drivers > (riders * 2):
            return 0.8 # Discount to stimulate demand
        else:
            return 1.0 # Standard pricing
            
    def predict(self, riders, drivers, duration, vehicle_type):
        """
        Predicts the baseline cost and applies context-aware multipliers.
        """
        # Prepare input for the Random Forest Regressor
        v_map = 1 if vehicle_type == 'Premium' else 0
        features = pd.DataFrame([[riders, drivers, duration, v_map]], 
                                columns=['riders', 'drivers', 'duration', 'vehicle_type'])
        
        baseline_cost = self.model.predict(features)
        multiplier = self.get_dynamic_multiplier(riders, drivers)
        
        final_price = baseline_cost * multiplier
        return round(final_price, 2)
