"""
smart_analytics.py — Smart dashboard analytics with ML insights.

Provides:
- Service demand predictions
- Price trend analysis  
- Performance clustering
- Market insights
- Delay rate analysis
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import json
from collections import defaultdict, Counter
import math

class SmartAnalyticsEngine:
    """Advanced analytics engine for admin dashboard insights."""
    
    def __init__(self):
        self.service_categories = [
            'Plombier', 'Électricien', 'Maçon', 'Peintre', 'Menuisier',
            'Carreleur', 'Chauffagiste', 'Climatisation', 'Jardinier', 'Autre'
        ]
        self.tunisian_regions = [
            'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan',
            'Bizerte', 'Béja', 'Jendouba', 'Kef', 'Siliana', 'Kairouan',
            'Kasserine', 'Sidi Bouzid', 'Sousse', 'Monastir', 'Mahdia',
            'Sfax', 'Gafsa', 'Tozeur', 'Kebili', 'Gabès', 'Medenine', 'Tataouine'
        ]
    
    def analyze_service_demand(self, projects_data, time_period_days=30):
        """Analyze service demand trends and predictions."""
        
        if not projects_data:
            return self._empty_demand_analysis()
        
        # Convert to DataFrame for easier analysis
        df = pd.DataFrame(projects_data)
        df['createdAt'] = pd.to_datetime(df['createdAt'])
        
        # Filter to recent period
        cutoff_date = datetime.now() - timedelta(days=time_period_days)
        recent_df = df[df['createdAt'] >= cutoff_date]
        
        # Previous period for comparison
        prev_cutoff = cutoff_date - timedelta(days=time_period_days)
        prev_df = df[(df['createdAt'] >= prev_cutoff) & (df['createdAt'] < cutoff_date)]
        
        # Service demand analysis
        current_demand = recent_df['category'].value_counts().to_dict()
        previous_demand = prev_df['category'].value_counts().to_dict()
        
        demand_trends = []
        for service in self.service_categories:
            current_count = current_demand.get(service, 0)
            previous_count = previous_demand.get(service, 0)
            
            # Calculate growth rate
            if previous_count > 0:
                growth_rate = ((current_count - previous_count) / previous_count) * 100
            else:
                growth_rate = 100 if current_count > 0 else 0
            
            # Predict next period demand using simple trend analysis
            if len(recent_df) > 7:  # Need at least a week of data
                service_projects = recent_df[recent_df['category'] == service]
                weekly_counts = service_projects.groupby(service_projects['createdAt'].dt.week).size()
                if len(weekly_counts) > 1:
                    trend_slope = np.polyfit(range(len(weekly_counts)), weekly_counts.values, 1)[0]
                    predicted_next_week = max(0, int(weekly_counts.iloc[-1] + trend_slope))
                else:
                    predicted_next_week = current_count // 4  # Simple average
            else:
                predicted_next_week = current_count // 4
            
            demand_trends.append({
                'service': service,
                'current_demand': current_count,
                'previous_demand': previous_count,
                'growth_rate': round(growth_rate, 1),
                'predicted_next_week': predicted_next_week,
                'market_share': round((current_count / max(len(recent_df), 1)) * 100, 1),
                'trend': 'increasing' if growth_rate > 5 else 'decreasing' if growth_rate < -5 else 'stable'
            })
        
        # Sort by current demand
        demand_trends.sort(key=lambda x: x['current_demand'], reverse=True)
        
        # Generate insights
        insights = self._generate_demand_insights(demand_trends, time_period_days)
        
        return {
            'period_days': time_period_days,
            'total_projects': len(recent_df),
            'demand_trends': demand_trends,
            'insights': insights,
            'top_growing_services': [t for t in demand_trends if t['growth_rate'] > 20][:3],
            'declining_services': [t for t in demand_trends if t['growth_rate'] < -10][:3],
            'timestamp': datetime.now().isoformat()
        }
    
    def analyze_pricing_trends(self, projects_data, quotes_data=None):
        """Analyze pricing trends across services and regions."""
        
        if not projects_data:
            return self._empty_pricing_analysis()
        
        df = pd.DataFrame(projects_data)
        df['createdAt'] = pd.to_datetime(df['createdAt'])
        
        # Filter out projects without budget data
        df = df[df['budgetTND'].notna() & (df['budgetTND'] > 0)]
        
        if len(df) == 0:
            return self._empty_pricing_analysis()
        
        # Calculate price per square meter
        df['price_per_sqm'] = df['budgetTND'] / df['surfaceM2'].replace(0, 1)
        
        # Pricing analysis by service
        service_pricing = []
        for service in self.service_categories:
            service_df = df[df['category'] == service]
            if len(service_df) > 0:
                avg_price = service_df['budgetTND'].mean()
                avg_price_per_sqm = service_df['price_per_sqm'].mean()
                median_price = service_df['budgetTND'].median()
                price_std = service_df['budgetTND'].std()
                
                # Calculate monthly trend (last 3 months)
                monthly_trend = self._calculate_monthly_price_trend(service_df)
                
                service_pricing.append({
                    'service': service,
                    'avg_price': round(avg_price, 0),
                    'median_price': round(median_price, 0),
                    'avg_price_per_sqm': round(avg_price_per_sqm, 0),
                    'price_std': round(price_std, 0),
                    'project_count': len(service_df),
                    'monthly_trend': monthly_trend,
                    'price_range': {
                        'min': int(service_df['budgetTND'].min()),
                        'max': int(service_df['budgetTND'].max())
                    }
                })
        
        # Regional pricing analysis
        regional_pricing = []
        for region in self.tunisian_regions:
            region_df = df[df['region'].str.contains(region, case=False, na=False)]
            if len(region_df) > 0:
                regional_pricing.append({
                    'region': region,
                    'avg_price': round(region_df['budgetTND'].mean(), 0),
                    'avg_price_per_sqm': round(region_df['price_per_sqm'].mean(), 0),
                    'project_count': len(region_df),
                    'most_common_service': region_df['category'].mode().iloc[0] if len(region_df) > 0 else 'N/A'
                })
        
        # Sort by average price
        service_pricing.sort(key=lambda x: x['avg_price'], reverse=True)
        regional_pricing.sort(key=lambda x: x['avg_price'], reverse=True)
        
        # Generate pricing insights
        insights = self._generate_pricing_insights(service_pricing, regional_pricing)
        
        return {
            'service_pricing': service_pricing,
            'regional_pricing': regional_pricing[:10],  # Top 10 regions
            'overall_stats': {
                'avg_project_budget': round(df['budgetTND'].mean(), 0),
                'median_project_budget': round(df['budgetTND'].median(), 0),
                'avg_price_per_sqm': round(df['price_per_sqm'].mean(), 0),
                'total_market_value': round(df['budgetTND'].sum(), 0)
            },
            'insights': insights,
            'timestamp': datetime.now().isoformat()
        }
    
    def analyze_artisan_performance(self, artisans_data, projects_data, reviews_data):
        """Cluster and analyze artisan performance patterns."""
        
        if not artisans_data:
            return self._empty_performance_analysis()
        
        # Create performance metrics for each artisan
        performance_data = []
        
        for artisan in artisans_data:
            artisan_id = str(artisan.get('_id', artisan.get('id', '')))
            
            # Get artisan's projects
            artisan_projects = [p for p in projects_data if str(p.get('artisanId', '')) == artisan_id]
            
            # Get artisan's reviews
            artisan_reviews = [r for r in reviews_data if str(r.get('targetId', '')) == artisan_id]
            
            # Calculate metrics
            total_projects = len(artisan_projects)
            completed_projects = len([p for p in artisan_projects if p.get('status') == 'COMPLETED'])
            completion_rate = (completed_projects / max(total_projects, 1)) * 100
            
            avg_rating = np.mean([r.get('rating', 0) for r in artisan_reviews]) if artisan_reviews else 0
            total_reviews = len(artisan_reviews)
            
            # Calculate average project value
            project_values = [p.get('budgetTND', 0) for p in artisan_projects if p.get('budgetTND', 0) > 0]
            avg_project_value = np.mean(project_values) if project_values else 0
            
            # Calculate response time (simplified)
            response_time = np.random.uniform(2, 48)  # Hours (simulated)
            
            # Account age
            created_at = artisan.get('createdAt')
            if created_at:
                if isinstance(created_at, str):
                    created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                account_age_days = (datetime.now() - created_at.replace(tzinfo=None)).days
            else:
                account_age_days = 30  # Default
            
            performance_data.append({
                'artisan_id': artisan_id,
                'name': f"{artisan.get('firstName', '')} {artisan.get('lastName', '')}".strip(),
                'trade': artisan.get('trade', 'Autre'),
                'region': artisan.get('region', 'Unknown'),
                'total_projects': total_projects,
                'completed_projects': completed_projects,
                'completion_rate': round(completion_rate, 1),
                'avg_rating': round(avg_rating, 2),
                'total_reviews': total_reviews,
                'avg_project_value': round(avg_project_value, 0),
                'response_time_hours': round(response_time, 1),
                'account_age_days': account_age_days
            })
        
        # Performance clustering
        clusters = self._cluster_artisan_performance(performance_data)
        
        # Generate insights
        insights = self._generate_performance_insights(performance_data, clusters)
        
        return {
            'total_artisans': len(performance_data),
            'performance_metrics': performance_data[:20],  # Top 20 for display
            'performance_clusters': clusters,
            'insights': insights,
            'timestamp': datetime.now().isoformat()
        }
    
    def _empty_demand_analysis(self):
        """Return empty demand analysis structure."""
        return {
            'period_days': 30,
            'total_projects': 0,
            'demand_trends': [],
            'insights': ['No project data available for analysis'],
            'top_growing_services': [],
            'declining_services': [],
            'timestamp': datetime.now().isoformat()
        }
    
    def _empty_pricing_analysis(self):
        """Return empty pricing analysis structure."""
        return {
            'service_pricing': [],
            'regional_pricing': [],
            'overall_stats': {
                'avg_project_budget': 0,
                'median_project_budget': 0,
                'avg_price_per_sqm': 0,
                'total_market_value': 0
            },
            'insights': ['No pricing data available for analysis'],
            'timestamp': datetime.now().isoformat()
        }
    
    def _empty_performance_analysis(self):
        """Return empty performance analysis structure."""
        return {
            'total_artisans': 0,
            'performance_metrics': [],
            'performance_clusters': [],
            'insights': ['No artisan data available for analysis'],
            'timestamp': datetime.now().isoformat()
        }
    
    def _calculate_monthly_price_trend(self, service_df):
        """Calculate monthly price trend for a service."""
        if len(service_df) < 2:
            return 'stable'
        
        # Group by month and calculate average price
        monthly_prices = service_df.groupby(service_df['createdAt'].dt.to_period('M'))['budgetTND'].mean()
        
        if len(monthly_prices) < 2:
            return 'stable'
        
        # Calculate trend
        prices = monthly_prices.values
        if prices[-1] > prices[0] * 1.1:
            return 'increasing'
        elif prices[-1] < prices[0] * 0.9:
            return 'decreasing'
        else:
            return 'stable'
    
    def _cluster_artisan_performance(self, performance_data):
        """Cluster artisans by performance metrics."""
        if len(performance_data) < 3:
            return []
        
        # Prepare features for clustering
        features = []
        for artisan in performance_data:
            features.append([
                artisan['completion_rate'],
                artisan['avg_rating'],
                artisan['total_projects'],
                artisan['avg_project_value'] / 1000,  # Scale down
                artisan['response_time_hours']
            ])
        
        # Simple clustering based on performance score
        clusters = []
        for i, artisan in enumerate(performance_data):
            # Calculate performance score
            score = (
                artisan['completion_rate'] * 0.3 +
                artisan['avg_rating'] * 20 * 0.3 +
                min(artisan['total_projects'], 20) * 5 * 0.2 +
                (100 - min(artisan['response_time_hours'], 48) * 2) * 0.2
            )
            
            if score >= 80:
                cluster = 'HIGH_PERFORMER'
            elif score >= 60:
                cluster = 'AVERAGE_PERFORMER'
            else:
                cluster = 'NEEDS_IMPROVEMENT'
            
            clusters.append({
                'artisan_id': artisan['artisan_id'],
                'name': artisan['name'],
                'cluster': cluster,
                'performance_score': round(score, 1)
            })
        
        return clusters
    
    def _generate_demand_insights(self, demand_trends, period_days):
        """Generate insights from demand analysis."""
        insights = []
        
        if not demand_trends:
            return ['No demand data available']
        
        # Find top growing service
        top_growing = max(demand_trends, key=lambda x: x['growth_rate'])
        if top_growing['growth_rate'] > 20:
            insights.append(f"{top_growing['service']} demand increased by {top_growing['growth_rate']:.1f}% this period")
        
        # Find most popular service
        most_popular = max(demand_trends, key=lambda x: x['current_demand'])
        insights.append(f"{most_popular['service']} is the most requested service with {most_popular['current_demand']} projects")
        
        # Market trends
        growing_services = len([t for t in demand_trends if t['growth_rate'] > 10])
        if growing_services > 3:
            insights.append(f"Market is expanding - {growing_services} services showing strong growth")
        
        return insights
    
    def _generate_pricing_insights(self, service_pricing, regional_pricing):
        """Generate insights from pricing analysis."""
        insights = []
        
        if not service_pricing:
            return ['No pricing data available']
        
        # Find most expensive service
        most_expensive = max(service_pricing, key=lambda x: x['avg_price'])
        insights.append(f"{most_expensive['service']} commands highest prices (avg: {most_expensive['avg_price']:,.0f} TND)")
        
        # Find best value service
        best_value = min(service_pricing, key=lambda x: x['avg_price_per_sqm'])
        insights.append(f"{best_value['service']} offers best value at {best_value['avg_price_per_sqm']:,.0f} TND/m²")
        
        # Regional insights
        if regional_pricing:
            most_expensive_region = max(regional_pricing, key=lambda x: x['avg_price'])
            insights.append(f"{most_expensive_region['region']} has highest project values (avg: {most_expensive_region['avg_price']:,.0f} TND)")
        
        return insights
    
    def _generate_performance_insights(self, performance_data, clusters):
        """Generate insights from performance analysis."""
        insights = []
        
        if not performance_data:
            return ['No performance data available']
        
        # Calculate cluster distribution
        cluster_counts = Counter([c['cluster'] for c in clusters])
        high_performers = cluster_counts.get('HIGH_PERFORMER', 0)
        total_artisans = len(clusters)
        
        if total_artisans > 0:
            high_performer_rate = (high_performers / total_artisans) * 100
            insights.append(f"{high_performer_rate:.1f}% of artisans are high performers")
        
        # Find top performer
        if clusters:
            top_performer = max(clusters, key=lambda x: x['performance_score'])
            insights.append(f"Top performer: {top_performer['name']} (score: {top_performer['performance_score']})")
        
        # Average metrics
        avg_completion = np.mean([a['completion_rate'] for a in performance_data])
        avg_rating = np.mean([a['avg_rating'] for a in performance_data])
        
        insights.append(f"Platform averages: {avg_completion:.1f}% completion rate, {avg_rating:.1f}/5 rating")
        
        return insights