"""
delay_dataset.py — Generate synthetic delay risk dataset for training.

Creates realistic project delay scenarios based on various risk factors.
"""

import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

def generate_delay_data(n_samples=2000):
    """Generate synthetic delay risk dataset."""
    
    np.random.seed(42)
    random.seed(42)
    
    data = []
    
    project_types = ['house', 'renovation', 'commercial', 'landscaping']
    locations = ['rural', 'suburban', 'urban']
    materials = ['basic', 'standard', 'premium']
    seasons = ['winter', 'spring', 'summer', 'autumn']
    
    for _ in range(n_samples):
        # Basic project features
        project_type = random.choice(project_types)
        size_sqm = np.random.uniform(30, 500)
        num_workers = np.random.randint(1, 8)
        location = random.choice(locations)
        materials_quality = random.choice(materials)
        complexity = np.random.uniform(1, 5)
        
        # Risk factors
        budget_tnd = np.random.uniform(5000, 200000)
        requested_duration = np.random.randint(7, 120)  # days
        artisan_experience = np.random.uniform(0.5, 15)  # years
        season = random.choice(seasons)
        
        # Weather risk (higher in winter)
        weather_risk = 0.8 if season == 'winter' else 0.3 if season == 'autumn' else 0.1
        
        # Calculate realistic duration based on project characteristics
        base_duration = size_sqm * 0.3  # base: 0.3 days per sqm
        
        # Adjust for project type
        type_multipliers = {'house': 1.2, 'renovation': 0.8, 'commercial': 1.5, 'landscaping': 0.6}
        base_duration *= type_multipliers[project_type]
        
        # Adjust for complexity and materials
        base_duration *= (complexity / 3.0)
        material_multipliers = {'basic': 0.8, 'standard': 1.0, 'premium': 1.3}
        base_duration *= material_multipliers[materials_quality]
        
        # Adjust for team size (more workers = faster, but diminishing returns)
        base_duration /= (1 + np.log(num_workers))
        
        # Location factor
        location_multipliers = {'rural': 1.2, 'suburban': 1.0, 'urban': 0.9}
        base_duration *= location_multipliers[location]
        
        # Experience factor (experienced artisans work faster)
        experience_factor = max(0.7, 1.2 - (artisan_experience / 15))
        base_duration *= experience_factor
        
        realistic_duration = max(5, int(base_duration))
        
        # Determine if project will be delayed
        delay_risk_score = 0
        
        # Timeline pressure (biggest factor)
        if requested_duration < realistic_duration * 0.7:
            delay_risk_score += 0.4  # Very tight deadline
        elif requested_duration < realistic_duration * 0.9:
            delay_risk_score += 0.2  # Tight deadline
        
        # Budget pressure
        estimated_cost = size_sqm * (50 + complexity * 20)  # rough cost estimate
        if budget_tnd < estimated_cost * 0.8:
            delay_risk_score += 0.25  # Low budget
        elif budget_tnd < estimated_cost * 1.1:
            delay_risk_score += 0.1   # Adequate budget
        
        # Experience factor
        if artisan_experience < 2:
            delay_risk_score += 0.2   # Inexperienced
        elif artisan_experience < 5:
            delay_risk_score += 0.1   # Moderate experience
        
        # Complexity factor
        if complexity > 4:
            delay_risk_score += 0.15  # High complexity
        elif complexity > 3:
            delay_risk_score += 0.05  # Medium complexity
        
        # Team size factor
        if num_workers < 2:
            delay_risk_score += 0.1   # Small team
        elif num_workers > 6:
            delay_risk_score += 0.05  # Coordination overhead
        
        # Weather/season factor
        delay_risk_score += weather_risk * 0.1
        
        # Material quality (premium materials can have supply delays)
        if materials_quality == 'premium':
            delay_risk_score += 0.05
        
        # Add some randomness
        delay_risk_score += np.random.uniform(-0.1, 0.1)
        delay_risk_score = max(0, min(1, delay_risk_score))
        
        # Determine delay classification
        if delay_risk_score > 0.6:
            delay_risk = 'HIGH'
            is_delayed = 1
        elif delay_risk_score > 0.35:
            delay_risk = 'MEDIUM'
            is_delayed = 1 if np.random.random() > 0.3 else 0
        else:
            delay_risk = 'LOW'
            is_delayed = 1 if np.random.random() > 0.8 else 0
        
        # Encode categorical variables
        project_type_encoded = project_types.index(project_type)
        location_encoded = locations.index(location)
        materials_encoded = materials.index(materials_quality)
        season_encoded = seasons.index(season)
        
        data.append({
            'project_type': project_type,
            'project_type_encoded': project_type_encoded,
            'size_sqm': round(size_sqm, 1),
            'num_workers': num_workers,
            'location': location,
            'location_encoded': location_encoded,
            'materials': materials_quality,
            'materials_encoded': materials_encoded,
            'complexity': round(complexity, 1),
            'budget_tnd': round(budget_tnd),
            'requested_duration': requested_duration,
            'realistic_duration': realistic_duration,
            'artisan_experience': round(artisan_experience, 1),
            'season': season,
            'season_encoded': season_encoded,
            'weather_risk': round(weather_risk, 2),
            'delay_risk_score': round(delay_risk_score, 3),
            'delay_risk': delay_risk,
            'is_delayed': is_delayed
        })
    
    df = pd.DataFrame(data)
    
    print(f"Generated {len(df)} delay risk samples")
    print(f"Delay risk distribution:")
    print(df['delay_risk'].value_counts())
    print(f"Delayed projects: {df['is_delayed'].sum()} ({df['is_delayed'].mean()*100:.1f}%)")
    
    return df

if __name__ == "__main__":
    df = generate_delay_data()
    df.to_csv("delay_data.csv", index=False)
    print("✅ delay_data.csv saved")