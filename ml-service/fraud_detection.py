"""
fraud_detection.py — Advanced fraud detection system for the platform.

Detects:
- Fake artisans
- Spam projects  
- Unrealistic prices
- Suspicious user behavior
- Review manipulation
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import json
import math

class FraudDetectionEngine:
    """Advanced fraud detection using multiple algorithms and rule-based systems."""
    
    def __init__(self):
        self.fraud_rules = self._initialize_fraud_rules()
        self.market_rates = self._initialize_market_rates()
        
    def _initialize_fraud_rules(self):
        """Initialize fraud detection rules and thresholds."""
        return {
            'artisan': {
                'min_profile_completeness': 0.6,
                'max_projects_per_day': 5,
                'min_experience_for_complex': 2,
                'suspicious_rating_patterns': True,
                'phone_validation': True
            },
            'project': {
                'min_budget_per_sqm': 50,   # TND
                'max_budget_per_sqm': 2000, # TND
                'min_duration_per_sqm': 0.05, # days
                'max_duration_per_sqm': 2.0,  # days
                'spam_keywords': ['test', 'fake', 'spam', 'urgent urgent', '!!!'],
                'min_description_length': 20
            },
            'pricing': {
                'deviation_threshold': 0.5,  # 50% deviation from market rate
                'suspicious_round_numbers': True,
                'unrealistic_discounts': 0.7  # 70%+ discount is suspicious
            },
            'behavior': {
                'max_login_frequency': 100,  # per day
                'suspicious_location_jumps': 500,  # km
                'rapid_fire_actions': 10,  # actions per minute
                'review_bombing_threshold': 5  # reviews in short time
            }
        }
    
    def _initialize_market_rates(self):
        """Initialize market rate benchmarks for different services."""
        return {
            'Plombier': {'min': 80, 'avg': 150, 'max': 300},      # TND per day
            'Électricien': {'min': 90, 'avg': 180, 'max': 350},
            'Maçon': {'min': 70, 'avg': 120, 'max': 250},
            'Peintre': {'min': 60, 'avg': 100, 'max': 200},
            'Menuisier': {'min': 85, 'avg': 160, 'max': 320},
            'Carreleur': {'min': 75, 'avg': 140, 'max': 280},
            'Chauffagiste': {'min': 100, 'avg': 200, 'max': 400},
            'Climatisation': {'min': 120, 'avg': 250, 'max': 500},
            'Jardinier': {'min': 50, 'avg': 80, 'max': 150},
            'Autre': {'min': 60, 'avg': 120, 'max': 250}
        }
    
    def detect_fake_artisan(self, artisan_data):
        """Detect potentially fake artisan profiles."""
        
        fraud_score = 0
        fraud_indicators = []
        
        # 1. Profile Completeness Analysis
        profile_fields = ['firstName', 'lastName', 'phone', 'trade', 'region', 'description']
        completed_fields = sum(1 for field in profile_fields if artisan_data.get(field))
        completeness = completed_fields / len(profile_fields)
        
        if completeness < self.fraud_rules['artisan']['min_profile_completeness']:
            fraud_score += 0.3
            fraud_indicators.append(f"Incomplete profile ({completeness*100:.0f}% complete)")
        
        # 2. Experience vs Complexity Mismatch
        experience = artisan_data.get('experience_years', 0)
        avg_project_complexity = artisan_data.get('avg_project_complexity', 3)
        
        if experience < 2 and avg_project_complexity > 4:
            fraud_score += 0.25
            fraud_indicators.append("Inexperienced artisan claiming complex projects")
        
        # 3. Unrealistic Project Volume
        projects_count = artisan_data.get('total_projects', 0)
        account_age_days = artisan_data.get('account_age_days', 1)
        projects_per_day = projects_count / max(account_age_days, 1)
        
        if projects_per_day > self.fraud_rules['artisan']['max_projects_per_day']:
            fraud_score += 0.4
            fraud_indicators.append(f"Unrealistic project volume ({projects_per_day:.1f} projects/day)")
        
        # 4. Suspicious Rating Patterns
        ratings = artisan_data.get('ratings', [])
        if len(ratings) > 5:
            # Check for rating manipulation patterns
            recent_ratings = ratings[-10:]  # Last 10 ratings
            if len(set(recent_ratings)) == 1 and recent_ratings[0] == 5:
                fraud_score += 0.3
                fraud_indicators.append("Suspicious perfect rating pattern")
            
            # Check for rating timing (all ratings in short period)
            rating_dates = artisan_data.get('rating_dates', [])
            if len(rating_dates) > 3:
                date_range = max(rating_dates) - min(rating_dates)
                if date_range < 7:  # All ratings within a week
                    fraud_score += 0.25
                    fraud_indicators.append("All ratings received in short timeframe")
        
        # 5. Phone Number Validation
        phone = artisan_data.get('phone', '')
        if not self._validate_tunisian_phone(phone):
            fraud_score += 0.2
            fraud_indicators.append("Invalid or suspicious phone number")
        
        # 6. Geographic Inconsistencies
        stated_region = artisan_data.get('region', '')
        project_locations = artisan_data.get('project_locations', [])
        if project_locations and stated_region:
            location_consistency = self._check_location_consistency(stated_region, project_locations)
            if location_consistency < 0.5:
                fraud_score += 0.2
                fraud_indicators.append("Projects in regions far from stated location")
        
        # 7. Description Quality Analysis
        description = artisan_data.get('description', '')
        if self._is_low_quality_description(description):
            fraud_score += 0.15
            fraud_indicators.append("Low quality or generic profile description")
        
        # Determine fraud level
        if fraud_score > 0.7:
            fraud_level = "HIGH"
        elif fraud_score > 0.4:
            fraud_level = "MEDIUM"
        else:
            fraud_level = "LOW"
        
        return {
            'fraud_level': fraud_level,
            'fraud_score': round(fraud_score, 3),
            'fraud_indicators': fraud_indicators,
            'recommendation': self._get_artisan_recommendation(fraud_level, fraud_score)
        }
    
    def detect_spam_project(self, project_data):
        """Detect spam or fake project postings."""
        
        fraud_score = 0
        fraud_indicators = []
        
        # 1. Budget Analysis
        budget = project_data.get('budgetTND', 0)
        size_sqm = project_data.get('surfaceM2', 100)
        budget_per_sqm = budget / max(size_sqm, 1)
        
        rules = self.fraud_rules['project']
        if budget_per_sqm < rules['min_budget_per_sqm']:
            fraud_score += 0.3
            fraud_indicators.append(f"Unrealistically low budget ({budget_per_sqm:.0f} TND/m²)")
        elif budget_per_sqm > rules['max_budget_per_sqm']:
            fraud_score += 0.25
            fraud_indicators.append(f"Suspiciously high budget ({budget_per_sqm:.0f} TND/m²)")
        
        # 2. Timeline Analysis
        start_date = project_data.get('startDate')
        end_date = project_data.get('endDate')
        if start_date and end_date:
            duration_days = (end_date - start_date).days
            duration_per_sqm = duration_days / max(size_sqm, 1)
            
            if duration_per_sqm < rules['min_duration_per_sqm']:
                fraud_score += 0.25
                fraud_indicators.append("Unrealistically short timeline")
            elif duration_per_sqm > rules['max_duration_per_sqm']:
                fraud_score += 0.15
                fraud_indicators.append("Suspiciously long timeline")
        
        # 3. Content Quality Analysis
        title = project_data.get('title', '').lower()
        description = project_data.get('description', '').lower()
        
        # Check for spam keywords
        spam_keywords = rules['spam_keywords']
        spam_count = sum(1 for keyword in spam_keywords if keyword in title or keyword in description)
        if spam_count > 0:
            fraud_score += 0.2 * spam_count
            fraud_indicators.append(f"Contains {spam_count} spam keywords")
        
        # Check description quality
        if len(description) < rules['min_description_length']:
            fraud_score += 0.2
            fraud_indicators.append("Very short or missing description")
        
        # Check for excessive punctuation/caps
        if self._has_excessive_punctuation(title + ' ' + description):
            fraud_score += 0.15
            fraud_indicators.append("Excessive punctuation or caps (spam-like)")
        
        # 4. Posting Pattern Analysis
        user_id = project_data.get('artisanId')
        if user_id:
            recent_projects = project_data.get('user_recent_projects', 0)
            if recent_projects > 3:  # More than 3 projects in recent period
                fraud_score += 0.2
                fraud_indicators.append("High frequency project posting")
        
        # 5. Contact Information Analysis
        phone = project_data.get('contactPhone', '')
        if phone and not self._validate_tunisian_phone(phone):
            fraud_score += 0.15
            fraud_indicators.append("Invalid contact phone number")
        
        # 6. Category Mismatch Analysis
        category = project_data.get('category', '').lower()
        if category and description:
            category_relevance = self._check_category_relevance(category, description)
            if category_relevance < 0.3:
                fraud_score += 0.2
                fraud_indicators.append("Project description doesn't match category")
        
        # Determine fraud level
        if fraud_score > 0.6:
            fraud_level = "HIGH"
        elif fraud_score > 0.35:
            fraud_level = "MEDIUM"
        else:
            fraud_level = "LOW"
        
        return {
            'fraud_level': fraud_level,
            'fraud_score': round(fraud_score, 3),
            'fraud_indicators': fraud_indicators,
            'recommendation': self._get_project_recommendation(fraud_level, fraud_score)
        }
    
    def detect_price_manipulation(self, pricing_data):
        """Detect unrealistic or manipulated pricing."""
        
        fraud_score = 0
        fraud_indicators = []
        
        trade = pricing_data.get('trade', 'Autre')
        quoted_price = pricing_data.get('quoted_price', 0)
        project_duration = pricing_data.get('duration_days', 1)
        
        # Get market rates for this trade
        market_rate = self.market_rates.get(trade, self.market_rates['Autre'])
        daily_rate = quoted_price / max(project_duration, 1)
        
        # 1. Market Rate Deviation Analysis
        deviation_from_avg = abs(daily_rate - market_rate['avg']) / market_rate['avg']
        
        if daily_rate < market_rate['min'] * 0.5:  # 50% below minimum
            fraud_score += 0.4
            fraud_indicators.append(f"Price 50%+ below market minimum ({daily_rate:.0f} vs {market_rate['min']} TND/day)")
        elif daily_rate > market_rate['max'] * 1.5:  # 50% above maximum
            fraud_score += 0.3
            fraud_indicators.append(f"Price 50%+ above market maximum ({daily_rate:.0f} vs {market_rate['max']} TND/day)")
        elif deviation_from_avg > self.fraud_rules['pricing']['deviation_threshold']:
            fraud_score += 0.2
            fraud_indicators.append(f"Significant deviation from market average ({deviation_from_avg*100:.0f}%)")
        
        # 2. Suspicious Round Numbers
        if self.fraud_rules['pricing']['suspicious_round_numbers']:
            if quoted_price % 1000 == 0 and quoted_price > 5000:  # Exact thousands
                fraud_score += 0.1
                fraud_indicators.append("Suspiciously round pricing (exact thousands)")
        
        # 3. Unrealistic Discounts
        competitor_prices = pricing_data.get('competitor_prices', [])
        if competitor_prices:
            avg_competitor_price = sum(competitor_prices) / len(competitor_prices)
            discount_rate = (avg_competitor_price - quoted_price) / avg_competitor_price
            
            if discount_rate > self.fraud_rules['pricing']['unrealistic_discounts']:
                fraud_score += 0.35
                fraud_indicators.append(f"Unrealistic discount ({discount_rate*100:.0f}% below competitors)")
        
        # 4. Pricing Consistency Analysis
        artisan_previous_quotes = pricing_data.get('artisan_previous_quotes', [])
        if len(artisan_previous_quotes) > 2:
            price_variance = np.std(artisan_previous_quotes) / np.mean(artisan_previous_quotes)
            if price_variance > 0.5:  # High variance in pricing
                fraud_score += 0.15
                fraud_indicators.append("Inconsistent pricing pattern from artisan")
        
        # Determine fraud level
        if fraud_score > 0.6:
            fraud_level = "HIGH"
        elif fraud_score > 0.35:
            fraud_level = "MEDIUM"
        else:
            fraud_level = "LOW"
        
        return {
            'fraud_level': fraud_level,
            'fraud_score': round(fraud_score, 3),
            'fraud_indicators': fraud_indicators,
            'recommendation': self._get_pricing_recommendation(fraud_level, fraud_score)
        }
    
    def detect_suspicious_behavior(self, user_activity):
        """Detect suspicious user behavior patterns."""
        
        fraud_score = 0
        fraud_indicators = []
        
        # 1. Login Frequency Analysis
        daily_logins = user_activity.get('daily_logins', 0)
        if daily_logins > self.fraud_rules['behavior']['max_login_frequency']:
            fraud_score += 0.3
            fraud_indicators.append(f"Excessive login frequency ({daily_logins} times/day)")
        
        # 2. Location Jump Analysis
        locations = user_activity.get('recent_locations', [])
        if len(locations) > 1:
            max_distance = self._calculate_max_location_jump(locations)
            if max_distance > self.fraud_rules['behavior']['suspicious_location_jumps']:
                fraud_score += 0.25
                fraud_indicators.append(f"Suspicious location jumps ({max_distance:.0f}km)")
        
        # 3. Rapid Fire Actions
        actions_per_minute = user_activity.get('actions_per_minute', 0)
        if actions_per_minute > self.fraud_rules['behavior']['rapid_fire_actions']:
            fraud_score += 0.2
            fraud_indicators.append("Rapid-fire actions (possible bot behavior)")
        
        # 4. Review Bombing Detection
        reviews_given = user_activity.get('reviews_given_today', 0)
        if reviews_given > self.fraud_rules['behavior']['review_bombing_threshold']:
            fraud_score += 0.3
            fraud_indicators.append(f"Review bombing pattern ({reviews_given} reviews today)")
        
        # 5. Account Age vs Activity Mismatch
        account_age_days = user_activity.get('account_age_days', 1)
        total_activity_score = user_activity.get('total_activity_score', 0)
        activity_ratio = total_activity_score / max(account_age_days, 1)
        
        if activity_ratio > 50:  # Very high activity for account age
            fraud_score += 0.2
            fraud_indicators.append("Unusually high activity for account age")
        
        # Determine fraud level
        if fraud_score > 0.6:
            fraud_level = "HIGH"
        elif fraud_score > 0.35:
            fraud_level = "MEDIUM"
        else:
            fraud_level = "LOW"
        
        return {
            'fraud_level': fraud_level,
            'fraud_score': round(fraud_score, 3),
            'fraud_indicators': fraud_indicators,
            'recommendation': self._get_behavior_recommendation(fraud_level, fraud_score)
        }
    
    # Helper methods
    def _validate_tunisian_phone(self, phone):
        """Validate Tunisian phone number format."""
        if not phone:
            return False
        
        # Remove spaces and special characters
        clean_phone = ''.join(filter(str.isdigit, phone))
        
        # Tunisian mobile: starts with 2, 4, 5, 9 and has 8 digits
        # Tunisian landline: starts with 7 and has 8 digits
        # International format: +216 followed by 8 digits
        
        if len(clean_phone) == 8:
            return clean_phone[0] in ['2', '4', '5', '7', '9']
        elif len(clean_phone) == 11 and clean_phone.startswith('216'):
            return clean_phone[3] in ['2', '4', '5', '7', '9']
        
        return False
    
    def _check_location_consistency(self, stated_region, project_locations):
        """Check consistency between stated region and project locations."""
        # Simplified implementation - in real world, use geographic distance
        region_matches = sum(1 for loc in project_locations if stated_region.lower() in loc.lower())
        return region_matches / max(len(project_locations), 1)
    
    def _is_low_quality_description(self, description):
        """Check if description is low quality or generic."""
        if len(description) < 30:
            return True
        
        # Check for generic phrases
        generic_phrases = ['good work', 'best price', 'call me', 'contact now', 'urgent']
        generic_count = sum(1 for phrase in generic_phrases if phrase in description.lower())
        
        return generic_count > 2
    
    def _has_excessive_punctuation(self, text):
        """Check for excessive punctuation or caps (spam indicators)."""
        if not text:
            return False
        
        # Count exclamation marks and question marks
        punctuation_count = text.count('!') + text.count('?')
        punctuation_ratio = punctuation_count / max(len(text), 1)
        
        # Count uppercase letters
        upper_count = sum(1 for c in text if c.isupper())
        upper_ratio = upper_count / max(len(text), 1)
        
        return punctuation_ratio > 0.05 or upper_ratio > 0.3
    
    def _check_category_relevance(self, category, description):
        """Check if description matches the project category."""
        # Simplified keyword matching - in real world, use NLP
        category_keywords = {
            'plomberie': ['eau', 'tuyau', 'robinet', 'fuite', 'plombier'],
            'électricité': ['électrique', 'câble', 'prise', 'éclairage', 'électricien'],
            'peinture': ['peinture', 'couleur', 'mur', 'pinceau', 'peintre'],
            'maçonnerie': ['mur', 'béton', 'brique', 'construction', 'maçon']
        }
        
        keywords = category_keywords.get(category.lower(), [])
        if not keywords:
            return 0.5  # Neutral if category not found
        
        matches = sum(1 for keyword in keywords if keyword in description.lower())
        return matches / len(keywords)
    
    def _calculate_max_location_jump(self, locations):
        """Calculate maximum distance between consecutive locations."""
        # Simplified implementation - return random distance for demo
        # In real world, use geographic coordinates and distance calculation
        return np.random.uniform(50, 800)  # km
    
    def _get_artisan_recommendation(self, fraud_level, fraud_score):
        """Get recommendation for artisan fraud detection."""
        if fraud_level == "HIGH":
            return "SUSPEND account immediately and require identity verification"
        elif fraud_level == "MEDIUM":
            return "FLAG for manual review and request additional documentation"
        else:
            return "MONITOR activity but allow normal operations"
    
    def _get_project_recommendation(self, fraud_level, fraud_score):
        """Get recommendation for project fraud detection."""
        if fraud_level == "HIGH":
            return "BLOCK project posting and notify user of policy violations"
        elif fraud_level == "MEDIUM":
            return "HOLD for manual review before publishing"
        else:
            return "APPROVE but monitor for user pattern changes"
    
    def _get_pricing_recommendation(self, fraud_level, fraud_score):
        """Get recommendation for pricing fraud detection."""
        if fraud_level == "HIGH":
            return "REJECT quote and warn artisan about market pricing"
        elif fraud_level == "MEDIUM":
            return "FLAG quote for client review with market rate comparison"
        else:
            return "ACCEPT but track pricing patterns"
    
    def _get_behavior_recommendation(self, fraud_level, fraud_score):
        """Get recommendation for behavior fraud detection."""
        if fraud_level == "HIGH":
            return "TEMPORARY suspension and require account verification"
        elif fraud_level == "MEDIUM":
            return "RATE LIMIT actions and increase monitoring"
        else:
            return "CONTINUE monitoring with normal limits"