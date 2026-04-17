"""
pricing_dataset.py — Generate synthetic project pricing data for training.

Features:
- project_type: house, renovation, commercial, landscaping
- surface_area: project surface area in square meters
- materials: basic, standard, premium
- location: urban, suburban, rural
- complexity: 1-5 scale

Target:
- estimated_cost: project cost in euros
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder

def generate_pricing_data(n_samples=2000):
    """Generate synthetic project pricing dataset."""
    np.random.seed(42)
    
    # Base costs per sqm by project type (in euros)
    project_types = ['house', 'renovation', 'commercial', 'landscaping']
    base_costs = {'house': 1200, 'renovation': 800, 'commercial': 1500, 'landscaping': 150}
    
    materials = ['basic', 'standard', 'premium']
    material_multipliers = {'basic': 0.8, 'standard': 1.0, 'premium': 1.4}
    
    locations = ['urban', 'suburban', 'rural']
    location_multipliers = {'urban': 1.3, 'suburban': 1.0, 'rural': 0.8}
    
    data = []
    
    for _ in range(n_samples):
        project_type = np.random.choice(project_types)
        materials_choice = np.random.choice(materials)
        location = np.random.choice(locations)
        
        # Surface area varies by project type
        if project_type == 'house':
            surface_area = np.random.normal(150, 50)
        elif project_type == 'renovation':
            surface_area = np.random.normal(80, 30)
        elif project_type == 'commercial':
            surface_area = np.random.normal(500, 200)
        else:  # landscaping
            surface_area = np.random.normal(300, 100)
        
        surface_area = max(20, surface_area)  # minimum area
        
        complexity = np.random.randint(1, 6)  # 1-5 complexity
        
        # Calculate cost based on realistic factors
        base_cost = base_costs[project_type] * surface_area
        material_cost = base_cost * material_multipliers[materials_choice]
        location_cost = material_cost * location_multipliers[location]
        complexity_cost = location_cost * (1 + (complexity - 1) * 0.2)
        
        # Add some market variation
        final_cost = complexity_cost * np.random.normal(1, 0.1)
        final_cost = max(1000, round(final_cost))  # minimum cost
        
        data.append({
            'project_type': project_type,
            'surface_area': round(surface_area, 1),
            'materials': materials_choice,
            'location': location,
            'complexity': complexity,
            'estimated_cost': final_cost
        })
    
    df = pd.DataFrame(data)
    
    # Encode categorical variables for ML
    le_type = LabelEncoder()
    le_materials = LabelEncoder()
    le_location = LabelEncoder()
    
    df['project_type_encoded'] = le_type.fit_transform(df['project_type'])
    df['materials_encoded'] = le_materials.fit_transform(df['materials'])
    df['location_encoded'] = le_location.fit_transform(df['location'])
    
    print(f"Generated {len(df)} pricing samples")
    print(f"Cost range: €{df['estimated_cost'].min():,}-€{df['estimated_cost'].max():,}")
    print(f"Project type distribution:\n{df['project_type'].value_counts()}")
    
    return df

if __name__ == "__main__":
    df = generate_pricing_data()
    df.to_csv("pricing_data.csv", index=False)
    print("Pricing dataset saved to pricing_data.csv")