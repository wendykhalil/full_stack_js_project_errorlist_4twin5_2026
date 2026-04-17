"""
duration_dataset.py — Generate synthetic project duration data for training.

Features:
- project_type: house, renovation, commercial, landscaping
- size_sqm: project size in square meters
- num_workers: number of workers assigned
- location: urban, suburban, rural
- materials: basic, standard, premium
- complexity: 1-5 scale (1=simple, 5=very complex)

Target:
- duration_days: estimated project duration in days
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder

def generate_duration_data(n_samples=2000):
    """Generate synthetic project duration dataset."""
    np.random.seed(42)
    
    # Project types with base duration multipliers
    project_types = ['house', 'renovation', 'commercial', 'landscaping']
    type_multipliers = {'house': 1.5, 'renovation': 0.8, 'commercial': 2.0, 'landscaping': 0.6}
    
    # Location types with duration multipliers
    locations = ['urban', 'suburban', 'rural']
    location_multipliers = {'urban': 0.9, 'suburban': 1.0, 'rural': 1.2}  # urban faster, rural slower
    
    # Materials types with duration multipliers
    materials = ['basic', 'standard', 'premium']
    material_multipliers = {'basic': 0.9, 'standard': 1.0, 'premium': 1.3}  # premium takes longer
    
    data = []
    
    for _ in range(n_samples):
        project_type = np.random.choice(project_types)
        location = np.random.choice(locations)
        material = np.random.choice(materials)
        
        # Size varies by project type
        if project_type == 'house':
            size_sqm = np.random.normal(150, 50)
        elif project_type == 'renovation':
            size_sqm = np.random.normal(80, 30)
        elif project_type == 'commercial':
            size_sqm = np.random.normal(500, 200)
        else:  # landscaping
            size_sqm = np.random.normal(200, 80)
        
        size_sqm = max(20, size_sqm)  # minimum size
        
        num_workers = np.random.randint(1, 11)  # 1-10 workers
        complexity = np.random.randint(1, 6)    # 1-5 complexity
        
        # Calculate duration based on realistic factors
        # Base: 1 day per 20m² for houses, adjusted by type
        if project_type == 'house':
            base_days_per_sqm = 0.8  # 0.8 days per m²
        elif project_type == 'renovation':
            base_days_per_sqm = 0.5  # renovation faster
        elif project_type == 'commercial':
            base_days_per_sqm = 1.2  # commercial takes longer
        else:  # landscaping
            base_days_per_sqm = 0.3  # landscaping fastest
        
        # Base duration from size
        base_duration = size_sqm * base_days_per_sqm
        
        # Worker efficiency: more workers = faster (but with diminishing returns)
        worker_efficiency = 1.0 / (1 + (num_workers - 1) * 0.15)  # each extra worker adds 15% efficiency
        
        # Complexity factor: higher complexity = longer duration
        complexity_factor = 1 + (complexity - 1) * 0.4  # each complexity level adds 40%
        
        # Location factor: rural takes longer, urban faster
        location_factor = location_multipliers[location]
        
        # Material factor: premium materials take longer to install
        material_factor = material_multipliers[material]
        
        # Final calculation
        duration_days = base_duration * worker_efficiency * complexity_factor * location_factor * material_factor
        
        # Add some noise
        duration_days *= np.random.normal(1, 0.15)
        duration_days = max(1, round(duration_days))  # minimum 1 day
        
        data.append({
            'project_type': project_type,
            'size_sqm': round(size_sqm, 1),
            'num_workers': num_workers,
            'location': location,
            'materials': material,
            'complexity': complexity,
            'duration_days': duration_days
        })
    
    df = pd.DataFrame(data)
    
    # Encode categorical variables for ML
    le_type = LabelEncoder()
    le_location = LabelEncoder()
    le_materials = LabelEncoder()
    
    df['project_type_encoded'] = le_type.fit_transform(df['project_type'])
    df['location_encoded'] = le_location.fit_transform(df['location'])
    df['materials_encoded'] = le_materials.fit_transform(df['materials'])
    
    print(f"Generated {len(df)} duration samples")
    print(f"Duration range: {df['duration_days'].min()}-{df['duration_days'].max()} days")
    print(f"Project type distribution:\n{df['project_type'].value_counts()}")
    print(f"Location distribution:\n{df['location'].value_counts()}")
    print(f"Materials distribution:\n{df['materials'].value_counts()}")
    
    return df

if __name__ == "__main__":
    df = generate_duration_data()
    df.to_csv("duration_data.csv", index=False)
    print("Duration dataset saved to duration_data.csv")