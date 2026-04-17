# Testing ML Predictions via Frontend

## New Features ✨

- **🔄 Two Prediction Modes**: New projects or existing artisan projects
- **💰 Tunisian Dinar Currency**: All pricing in DT instead of EUR
- **📁 Project Integration**: Auto-fill forms from existing projects
- **🎨 Enhanced UI**: Better navigation and user experience

## Prerequisites

1. **Start the ML Service**
   ```bash
   cd ml-service
   py -m pip install flask-cors  # Install CORS support
   py app.py
   ```
   The service should be running on `http://localhost:5001`

2. **Start the Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend should be running on `http://localhost:5173`

3. **Start the Backend** (for authentication and existing projects)
   ```bash
   cd backend
   npm start
   ```

## How to Test

### 1. Login to the Application
- Go to `http://localhost:5173`
- Login as either an **Artisan** or **Prescripteur** user
- Both roles have access to ML predictions

### 2. Navigate to ML Predictions
- **For Artisans**: Go to sidebar → "Gestion de projets" → "Prédictions IA" 🧠
- **For Prescripteurs**: Go to sidebar → "Prédictions IA" 🧠 (main menu)
- Or directly visit: `http://localhost:5173/artisan/ml-predictions` or `http://localhost:5173/prescripteur/ml-predictions`

### 3. Choose Prediction Mode

**Option A: Nouveau projet (New Project)**
- Click "Nouveau projet" button
- Fill in all project details manually
- Get predictions for hypothetical projects

**Option B: Projet existant (Existing Project)**
- Click "Projet existant" button
- Select from dropdown of your existing projects
- Form auto-fills with project data
- Get predictions based on real project information

### 4. Test Duration Prediction
1. Click on the "Prédiction Durée" tab
2. Fill in the form:
   - **Type de projet**: Choose from Maison, Rénovation, Commercial, Aménagement paysager
   - **Taille (m²)**: Enter project size (e.g., 150)
   - **Nombre d'ouvriers**: Enter number of workers (e.g., 4)
   - **Complexité**: Choose 1-5 scale
3. Click "Prédire la durée"
4. You should see the estimated duration in days

### 5. Test Pricing Prediction
1. Click on the "Prédiction Prix" tab
2. Fill in the form:
   - **Type de projet**: Choose project type
   - **Surface (m²)**: Enter surface area (e.g., 150)
   - **Matériaux**: Choose Basique, Standard, or Premium
   - **Localisation**: Choose Rural, Banlieue, or Urbain
   - **Complexité**: Choose 1-5 scale
3. Click "Prédire le prix"
4. You should see the estimated cost in **Tunisian Dinar (DT)** 💰

## Sample Test Data

### Duration Prediction Examples:
```
House Project:
- Type: Maison
- Size: 150 m²
- Workers: 4
- Complexity: 3
Expected: ~45-60 days

Renovation Project:
- Type: Rénovation
- Size: 80 m²
- Workers: 2
- Complexity: 2
Expected: ~25-35 days
```

### Pricing Prediction Examples:
```
Premium House:
- Type: Maison
- Surface: 150 m²
- Materials: Premium
- Location: Urbain
- Complexity: 4
Expected: 250,000-350,000 DT

Basic Renovation:
- Type: Rénovation
- Surface: 80 m²
- Materials: Basique
- Location: Rural
- Complexity: 2
Expected: 50,000-80,000 DT
```

## Troubleshooting

### ML Service Not Responding
- Check if `py app.py` is running in the ml-service directory
- Verify the service is accessible at `http://localhost:5001/health`
- Install CORS support: `py -m pip install flask-cors`
- Check browser console for CORS errors

### Frontend Errors
- Check browser console for JavaScript errors
- Verify the frontend is running on `http://localhost:5173`
- Make sure all dependencies are installed (`npm install`)

### Authentication Issues
- Make sure you're logged in as an Artisan or Prescripteur
- Check if the backend is running for user authentication
- Clear browser cache/cookies if needed

### Existing Projects Not Loading
- Ensure backend is running on `http://localhost:5000`
- Check if you have created projects in the "Projets" section
- Verify authentication token is valid

## Expected Results

The ML predictions should return:
- **Duration**: Realistic project completion times (1-400+ days)
- **Pricing**: Realistic project costs in Tunisian Dinar (1,000-1,000,000+ DT)
- **Response Time**: Under 2 seconds for predictions
- **Accuracy**: Models trained with 94%+ accuracy (R² scores)
- **Currency**: All prices displayed in DT (Dinar Tunisien)

## API Endpoints (for manual testing)

You can also test the API directly:

```bash
# Test duration prediction
curl -X POST http://localhost:5001/predict-duration \
  -H "Content-Type: application/json" \
  -d '{"project_type": "house", "size_sqm": 150, "num_workers": 4, "complexity": 3}'

# Test pricing prediction
curl -X POST http://localhost:5001/predict-pricing \
  -H "Content-Type: application/json" \
  -d '{"project_type": "house", "surface_area": 150, "materials": "premium", "location": "urban", "complexity": 4}'
```

## New Features in Action 🎉

1. **Project Mode Selection**: Toggle between new and existing projects
2. **Auto-fill from Existing Projects**: Select a project and watch the form populate
3. **Tunisian Dinar Display**: All pricing shown in DT currency
4. **Enhanced Navigation**: Brain icon 🧠 in sidebar for easy access
5. **Better Error Handling**: Clear error messages and loading states