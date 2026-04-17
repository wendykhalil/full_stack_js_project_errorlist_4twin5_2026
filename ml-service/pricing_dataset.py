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
    
    # Base costs per sqm by project type (in euros) - more realistic
    project_types = ['house', 'renovation', 'commercial', 'landscaping']
    base_costs = {
        'house': 1500,      # €1500/m² for new house construction
        'renovation': 800,   # €800/m² for renovation
        'commercial': 1800,  # €1800/m² for commercial (higher standards)
        'landscaping': 200   # €200/m² for landscaping
    }
    
    materials = ['basic', 'standard', 'premium']
    material_multipliers = {'basic': 0.75, 'standard': 1.0, 'premium': 1.5}  # bigger difference
    
    # Tunisia-specific location pricing (realistic for construction market)
    locations = ['urban', 'suburban', 'rural']
    location_multipliers = {
        'urban': 1.4,    # Tunis/major cities 40% more expensive
        'suburban': 1.0,  # baseline pricing
        'rural': 0.7     # rural areas 30% cheaper
    }
    
    data = []
    
    for _ in range(n_samples):
        project_type = np.random.choice(project_types)
        materials_choice = np.random.choice(materials)
        location = np.random.choice(locations)
        
        # Surface area varies by project type (more realistic ranges)
        if project_type == 'house':
            surface_area = np.random.normal(120, 40)  # 80-160m² typical
        elif project_type == 'renovation':
            surface_area = np.random.normal(70, 25)   # 45-95m² typical
        elif project_type == 'commercial':
            surface_area = np.random.normal(300, 150) # 150-450m² typical
        else:  # landscaping
            surface_area = np.random.normal(250, 100) # 150-350m² typical
        
        surface_area = max(20, surface_area)  # minimum area
        
        complexity = np.random.randint(1, 6)  # 1-5 complexity
        
        # Calculate cost based on realistic factors
        base_cost = base_costs[project_type] * surface_area
        
        # Material impact (significant difference)
        material_cost = base_cost * material_multipliers[materials_choice]
        
        # Location impact (major factor in Tunisia)
        location_cost = material_cost * location_multipliers[location]
        
        # Complexity impact (each level adds 25%)
        complexity_multiplier = 1 + (complexity - 1) * 0.25
        complexity_cost = location_cost * complexity_multiplier
        
        # Add market variation (±20%)
        final_cost = complexity_cost * np.random.normal(1, 0.2)
        final_cost = max(5000, round(final_cost))  # minimum €5000
        
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
    print(f"Location cost averages:")
    for loc in locations:
        avg_cost = df[df['location'] == loc]['estimated_cost'].mean()
        print(f"  {loc}: €{avg_cost:,.0f}")
    
    return df

if __name__ == "__main__":
    df = generate_pricing_data()
    df.to_csv("pricing_data.csv", index=False)
    print("Pricing dataset saved to pricing_data.csv")