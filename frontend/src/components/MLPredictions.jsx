import React, { useState, useEffect } from 'react';
import { Clock, DollarSign, Calculator, AlertCircle, FolderOpen, Plus, AlertTriangle, TrendingUp } from 'lucide-react';

const MLPredictions = () => {
  const [activeTab, setActiveTab] = useState('combined'); // 'combined' or 'delay'
  const [predictionMode, setPredictionMode] = useState('new'); // 'new' or 'existing'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [existingProjects, setExistingProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');

  // Duration prediction form state
  const [durationForm, setDurationForm] = useState({
    project_type: 'house',
    size_sqm: '',
    num_workers: '',
    location: 'suburban',
    materials: 'standard',
    complexity: '3'
  });

  // Pricing prediction form state
  const [pricingForm, setPricingForm] = useState({
    project_type: 'house',
    surface_area: '',
    materials: 'standard',
    location: 'suburban',
    complexity: '3'
  });

  // Delay risk prediction form state
  const [delayForm, setDelayForm] = useState({
    project_type: 'house',
    size_sqm: '',
    num_workers: '',
    location: 'suburban',
    materials: 'standard',
    complexity: '3',
    budget_tnd: '',
    requested_duration: '',
    artisan_experience: '3',
    season: 'summer'
  });

  const projectTypes = [
    { value: 'house', label: 'Maison' },
    { value: 'renovation', label: 'Rénovation' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'landscaping', label: 'Aménagement paysager' }
  ];

  const materials = [
    { value: 'basic', label: 'Basique' },
    { value: 'standard', label: 'Standard' },
    { value: 'premium', label: 'Premium' }
  ];

  const locations = [
    { value: 'rural', label: 'Rural' },
    { value: 'suburban', label: 'Banlieue' },
    { value: 'urban', label: 'Urbain' }
  ];

  const complexityLevels = [
    { value: '1', label: '1 - Très simple' },
    { value: '2', label: '2 - Simple' },
    { value: '3', label: '3 - Moyen' },
    { value: '4', label: '4 - Complexe' },
    { value: '5', label: '5 - Très complexe' }
  ];

  const seasons = [
    { value: 'spring', label: 'Printemps' },
    { value: 'summer', label: 'Été' },
    { value: 'autumn', label: 'Automne' },
    { value: 'winter', label: 'Hiver' }
  ];

  const experienceLevels = [
    { value: '0.5', label: '6 mois' },
    { value: '1', label: '1 an' },
    { value: '2', label: '2 ans' },
    { value: '3', label: '3 ans' },
    { value: '5', label: '5 ans' },
    { value: '8', label: '8 ans' },
    { value: '10', label: '10+ ans' }
  ];

  // Load existing projects on component mount
  useEffect(() => {
    const loadExistingProjects = async () => {
      try {
        const token = localStorage.getItem('bmptn_token');
        const user = JSON.parse(localStorage.getItem('bmptn_user') || '{}');
        
        if (!token) return;

        // Prescripteurs can see all projects, artisans see only their own
        const endpoint = user.role === 'PRESCRIPTEUR' 
          ? 'http://localhost:5000/api/projects'  // All projects for prescripteurs
          : 'http://localhost:5000/api/projects/my';  // Only own projects for artisans

        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setExistingProjects(data.items || []);
        }
      } catch (error) {
        console.error('Could not load existing projects:', error);
        // Silently fail - don't break the component
        setExistingProjects([]);
      }
    };

    loadExistingProjects();
  }, []);

  // Handle existing project selection
  const handleProjectSelection = (projectId) => {
    const project = existingProjects.find(p => p._id === projectId);
    if (project) {
      console.log('Selected project:', project); // Debug log
      
      // Enhanced project type mapping with more categories
      const projectTypeMap = {
        // Construction types
        'Villa': 'house',
        'Appartement': 'house', 
        'Maison': 'house',
        'Construction neuve': 'house',
        
        // Commercial types
        'Bureau': 'commercial',
        'Magasin': 'commercial',
        'Restaurant': 'commercial',
        'Immeuble': 'commercial',
        'Entrepôt': 'commercial',
        'Usine': 'commercial',
        
        // Renovation types
        'Rénovation': 'renovation',
        'Extension': 'renovation',
        'Aménagement intérieur': 'renovation',
        'Façade': 'renovation',
        'Toiture': 'renovation',
        'Peinture': 'renovation',
        'Plomberie': 'renovation',
        'Électricité': 'renovation',
        'Carrelage': 'renovation',
        'Menuiserie': 'renovation',
        'Climatisation': 'renovation',
        'Isolation': 'renovation',
        
        // Landscaping types
        'Piscine/Jardin': 'landscaping',
        'Aménagement paysager': 'landscaping',
        'Jardin': 'landscaping'
      };

      // Enhanced location mapping with more precise categorization
      const locationMap = {
        // Major urban centers
        'Tunis': 'urban',
        'Ariana': 'urban',
        'Ben Arous': 'urban',
        'Sfax': 'urban',
        'Sousse': 'urban',
        
        // Suburban/medium cities
        'Manouba': 'suburban',
        'Nabeul': 'suburban',
        'Monastir': 'suburban',
        'Mahdia': 'suburban',
        'Bizerte': 'suburban',
        'Gabès': 'suburban',
        'Kairouan': 'suburban',
        
        // Rural areas
        'Beja': 'rural',
        'Jendouba': 'rural',
        'Le Kef': 'rural',
        'Siliana': 'rural',
        'Zaghouan': 'rural',
        'Kasserine': 'rural',
        'Sidi Bouzid': 'rural',
        'Gafsa': 'rural',
        'Tozeur': 'rural',
        'Kébili': 'rural',
        'Medenine': 'rural',
        'Tataouine': 'rural'
      };

      // Smart materials quality estimation based on budget and project type
      const budget = project.budgetTND || 0;
      const projectCategory = project.category || '';
      
      let materialsQuality = 'standard'; // default
      
      // Budget-based material quality
      if (budget > 300000) {
        materialsQuality = 'premium';
      } else if (budget > 150000) {
        materialsQuality = 'standard';
      } else if (budget < 80000) {
        materialsQuality = 'basic';
      }
      
      // Adjust based on project type
      if (projectCategory.includes('Villa') || projectCategory.includes('Usine') || projectCategory.includes('Restaurant')) {
        // High-end projects typically use better materials
        materialsQuality = materialsQuality === 'basic' ? 'standard' : 'premium';
      } else if (projectCategory.includes('Peinture') || projectCategory.includes('Carrelage')) {
        // Simple renovations might use basic materials
        materialsQuality = materialsQuality === 'premium' ? 'standard' : materialsQuality;
      }

      // Smart complexity estimation based on multiple factors
      let complexity = '3'; // default medium
      
      // Base complexity on project category
      if (projectCategory.includes('Usine') || projectCategory.includes('Immeuble') || projectCategory.includes('Commercial')) {
        complexity = '4'; // complex for industrial/commercial
      } else if (projectCategory.includes('Villa') || projectCategory.includes('Construction neuve')) {
        complexity = '3'; // medium for new construction
      } else if (projectCategory.includes('Peinture') || projectCategory.includes('Carrelage') || projectCategory.includes('Jardin')) {
        complexity = '2'; // simpler for basic work
      } else if (projectCategory.includes('Électricité') || projectCategory.includes('Plomberie') || projectCategory.includes('Climatisation')) {
        complexity = '4'; // technical work is complex
      }
      
      // Adjust complexity based on size
      const size = project.surfaceM2 || 0;
      if (size > 500) {
        complexity = Math.min(5, parseInt(complexity) + 1).toString(); // larger = more complex
      } else if (size < 50) {
        complexity = Math.max(1, parseInt(complexity) - 1).toString(); // smaller = less complex
      }
      
      // Adjust complexity based on budget (higher budget often means more complex requirements)
      if (budget > 500000) {
        complexity = Math.min(5, parseInt(complexity) + 1).toString();
      }

      // Smart worker estimation based on project size and type
      let estimatedWorkers = '4'; // default
      
      if (size > 300) {
        estimatedWorkers = '6'; // large projects need more workers
      } else if (size > 150) {
        estimatedWorkers = '4'; // medium projects
      } else if (size < 80) {
        estimatedWorkers = '2'; // small projects
      }
      
      // Adjust based on project type
      if (projectCategory.includes('Peinture') || projectCategory.includes('Carrelage')) {
        estimatedWorkers = '2'; // specialized work, fewer workers
      } else if (projectCategory.includes('Construction neuve') || projectCategory.includes('Immeuble')) {
        estimatedWorkers = Math.max(parseInt(estimatedWorkers), 6).toString(); // construction needs more workers
      }

      // Get the actual city from the project
      const projectCity = project.location?.city || '';
      const locationCategory = locationMap[projectCity] || 'suburban'; // default to suburban if city not found

      const formData = {
        project_type: projectTypeMap[projectCategory] || 'house',
        size_sqm: project.surfaceM2 || '',
        num_workers: estimatedWorkers,
        location: locationCategory,
        materials: materialsQuality,
        complexity: complexity
      };

      const pricingData = {
        project_type: projectTypeMap[projectCategory] || 'house',
        surface_area: project.surfaceM2 || '',
        materials: materialsQuality,
        location: locationCategory,
        complexity: complexity
      };

      const delayData = {
        project_type: projectTypeMap[projectCategory] || 'house',
        size_sqm: project.surfaceM2 || '',
        num_workers: estimatedWorkers,
        location: locationCategory,
        materials: materialsQuality,
        complexity: complexity,
        budget_tnd: budget,
        requested_duration: project.endDate && project.startDate ? 
          Math.ceil((new Date(project.endDate) - new Date(project.startDate)) / (1000 * 60 * 60 * 24)) : '',
        artisan_experience: '3', // default
        season: 'summer' // default
      };

      console.log('🎯 Smart mapping results:');
      console.log('- Project:', project.title);
      console.log('- Category:', projectCategory, '→', projectTypeMap[projectCategory] || 'house');
      console.log('- City:', projectCity, '→', locationCategory);
      console.log('- Budget:', budget, '→ Materials:', materialsQuality);
      console.log('- Size:', size, '→ Workers:', estimatedWorkers);
      console.log('- Final complexity:', complexity);
      console.log('- Duration form:', formData);
      console.log('- Pricing form:', pricingData);
      console.log('- Delay form:', delayData);

      setDurationForm(formData);
      setPricingForm(pricingData);
      setDelayForm(delayData);
      setSelectedProject(projectId);
    }
  };

  const predictCombined = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const [durationRes, pricingRes] = await Promise.all([
        fetch('http://localhost:5001/predict-duration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...durationForm,
            size_sqm: parseFloat(durationForm.size_sqm),
            num_workers: parseInt(durationForm.num_workers),
            complexity: parseInt(durationForm.complexity)
          }),
        }),
        fetch('http://localhost:5001/predict-pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_type: durationForm.project_type,
            surface_area: parseFloat(durationForm.size_sqm),
            materials: durationForm.materials,
            location: durationForm.location,
            complexity: parseInt(durationForm.complexity)
          }),
        }),
      ]);

      const durationData = await durationRes.json();
      const pricingData = await pricingRes.json();

      if (durationRes.ok && pricingRes.ok) {
        setResult({ ...durationData, ...pricingData, type: 'combined' });
      } else {
        setError((durationData.error || pricingData.error) || 'Erreur lors de la prédiction');
      }
    } catch (err) {
      setError('Service ML indisponible. Assurez-vous que le service Python ML est démarré sur le port 5001.');
    } finally {
      setLoading(false);
    }
  };

  const predictDuration = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:5001/predict-duration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...durationForm,
          size_sqm: parseFloat(durationForm.size_sqm),
          num_workers: parseInt(durationForm.num_workers),
          complexity: parseInt(durationForm.complexity)
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Erreur lors de la prédiction');
      }
    } catch (err) {
      setError('Service ML indisponible. Assurez-vous que le service Python ML est démarré sur le port 5001.');
      console.error('ML Service error:', err);
    } finally {
      setLoading(false);
    }
  };

  const predictPricing = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:5001/predict-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...pricingForm,
          surface_area: parseFloat(pricingForm.surface_area),
          complexity: parseInt(pricingForm.complexity)
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Erreur lors de la prédiction');
      }
    } catch (err) {
      setError('Service ML indisponible. Assurez-vous que le service Python ML est démarré sur le port 5001.');
      console.error('ML Service error:', err);
    } finally {
      setLoading(false);
    }
  };

  const predictDelayRisk = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:5001/predict-delay-risk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...delayForm,
          size_sqm: parseFloat(delayForm.size_sqm),
          num_workers: parseInt(delayForm.num_workers),
          complexity: parseInt(delayForm.complexity),
          budget_tnd: parseFloat(delayForm.budget_tnd),
          requested_duration: parseInt(delayForm.requested_duration),
          artisan_experience: parseFloat(delayForm.artisan_experience)
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Erreur lors de la prédiction');
      }
    } catch (err) {
      setError('Service ML indisponible. Assurez-vous que le service Python ML est démarré sur le port 5001.');
      console.error('ML Service error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'combined') {
      predictCombined();
    } else if (activeTab === 'duration') {
      predictDuration();
    } else if (activeTab === 'pricing') {
      predictPricing();
    } else if (activeTab === 'delay') {
      predictDelayRisk();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Prédictions IA pour Projets
        </h2>
        <p className="text-gray-600">
          Utilisez l'intelligence artificielle pour estimer la durée et le coût de vos projets
        </p>
      </div>

      {/* Project Mode Selection */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Mode de prédiction</h3>
        <div className="flex gap-4">
          <button
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
              predictionMode === 'new'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => {
              setPredictionMode('new');
              setSelectedProject('');
              setResult(null);
              setError(null);
            }}
          >
            <Plus size={16} />
            Nouveau projet
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
              predictionMode === 'existing'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => {
              setPredictionMode('existing');
              setResult(null);
              setError(null);
            }}
          >
            <FolderOpen size={16} />
            Projet existant
          </button>
        </div>
      </div>

      {/* Existing Project Selection */}
      {predictionMode === 'existing' && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <label className="block text-sm font-medium text-blue-800 mb-2">
            Sélectionner un projet existant
          </label>
          <select
            value={selectedProject}
            onChange={(e) => handleProjectSelection(e.target.value)}
            className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">-- Choisir un projet --</option>
            {existingProjects.map(project => (
              <option key={project._id} value={project._id}>
                {project.title} - {project.category} ({project.surfaceM2}m²)
              </option>
            ))}
          </select>
          {existingProjects.length === 0 && (
            <p className="text-sm text-blue-600 mt-2">
              Aucun projet existant trouvé. Créez d'abord un projet dans la section "Projets".
            </p>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex mb-6 border-b">
        <button
          className={`px-6 py-3 font-medium flex items-center gap-2 ${
            activeTab === 'combined'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => { setActiveTab('combined'); setResult(null); setError(null); }}
        >
          <TrendingUp size={20} />
          Durée &amp; Coût
        </button>
        <button
          className={`px-6 py-3 font-medium flex items-center gap-2 ${
            activeTab === 'delay'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => { setActiveTab('delay'); setResult(null); setError(null); }}
        >
          <AlertTriangle size={20} />
          Risque de Retard
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === 'combined' || activeTab === 'duration' ? (
          // Duration / Combined Form
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de projet
              </label>
              <select
                value={durationForm.project_type}
                onChange={(e) => setDurationForm({...durationForm, project_type: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {projectTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taille (m²)
              </label>
              <input
                type="number"
                value={durationForm.size_sqm}
                onChange={(e) => setDurationForm({...durationForm, size_sqm: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="150"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre d'ouvriers
              </label>
              <input
                type="number"
                value={durationForm.num_workers}
                onChange={(e) => setDurationForm({...durationForm, num_workers: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="4"
                min="1"
                max="20"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localisation
              </label>
              <select
                value={durationForm.location}
                onChange={(e) => setDurationForm({...durationForm, location: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {locations.map(location => (
                  <option key={location.value} value={location.value}>{location.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Matériaux
              </label>
              <select
                value={durationForm.materials}
                onChange={(e) => setDurationForm({...durationForm, materials: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {materials.map(material => (
                  <option key={material.value} value={material.value}>{material.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complexité
              </label>
              <select
                value={durationForm.complexity}
                onChange={(e) => setDurationForm({...durationForm, complexity: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {complexityLevels.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
          </div>
        ) : activeTab === 'pricing' ? (
          // Pricing Form
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de projet
              </label>
              <select
                value={pricingForm.project_type}
                onChange={(e) => setPricingForm({...pricingForm, project_type: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {projectTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Surface (m²)
              </label>
              <input
                type="number"
                value={pricingForm.surface_area}
                onChange={(e) => setPricingForm({...pricingForm, surface_area: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="150"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Matériaux
              </label>
              <select
                value={pricingForm.materials}
                onChange={(e) => setPricingForm({...pricingForm, materials: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {materials.map(material => (
                  <option key={material.value} value={material.value}>{material.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localisation
              </label>
              <select
                value={pricingForm.location}
                onChange={(e) => setPricingForm({...pricingForm, location: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {locations.map(location => (
                  <option key={location.value} value={location.value}>{location.label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complexité
              </label>
              <select
                value={pricingForm.complexity}
                onChange={(e) => setPricingForm({...pricingForm, complexity: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {complexityLevels.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          // Delay Risk Form
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de projet
              </label>
              <select
                value={delayForm.project_type}
                onChange={(e) => setDelayForm({...delayForm, project_type: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {projectTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taille (m²)
              </label>
              <input
                type="number"
                value={delayForm.size_sqm}
                onChange={(e) => setDelayForm({...delayForm, size_sqm: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="150"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre d'ouvriers
              </label>
              <input
                type="number"
                value={delayForm.num_workers}
                onChange={(e) => setDelayForm({...delayForm, num_workers: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="4"
                min="1"
                max="20"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget (TND)
              </label>
              <input
                type="number"
                value={delayForm.budget_tnd}
                onChange={(e) => setDelayForm({...delayForm, budget_tnd: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="50000"
                min="1000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée demandée (jours)
              </label>
              <input
                type="number"
                value={delayForm.requested_duration}
                onChange={(e) => setDelayForm({...delayForm, requested_duration: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="30"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expérience artisan
              </label>
              <select
                value={delayForm.artisan_experience}
                onChange={(e) => setDelayForm({...delayForm, artisan_experience: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {experienceLevels.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localisation
              </label>
              <select
                value={delayForm.location}
                onChange={(e) => setDelayForm({...delayForm, location: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {locations.map(location => (
                  <option key={location.value} value={location.value}>{location.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Saison
              </label>
              <select
                value={delayForm.season}
                onChange={(e) => setDelayForm({...delayForm, season: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {seasons.map(season => (
                  <option key={season.value} value={season.value}>{season.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Matériaux
              </label>
              <select
                value={delayForm.materials}
                onChange={(e) => setDelayForm({...delayForm, materials: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {materials.map(material => (
                  <option key={material.value} value={material.value}>{material.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complexité
              </label>
              <select
                value={delayForm.complexity}
                onChange={(e) => setDelayForm({...delayForm, complexity: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {complexityLevels.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Calculator size={20} />
          {loading ? 'Calcul en cours...' : `Prédire ${activeTab === 'combined' ? 'la durée et le coût' : activeTab === 'duration' ? 'la durée' : activeTab === 'pricing' ? 'le prix' : 'le risque de retard'}`}
        </button>
      </form>

      {/* Results */}
      {result && (
        <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-3">
            Résultat de la prédiction
          </h3>
          {activeTab === 'combined' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-green-200">
                <Clock className="text-blue-600 shrink-0" size={28} />
                <div>
                  <p className="text-2xl font-bold text-blue-800">
                    {result.estimated_duration_days} jours
                  </p>
                  <p className="text-sm text-blue-600">Durée estimée</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-green-200">
                <DollarSign className="text-emerald-600 shrink-0" size={28} />
                <div>
                  <p className="text-2xl font-bold text-emerald-800">
                    {result.estimated_cost_euros?.toLocaleString()} DT
                  </p>
                  <p className="text-sm text-emerald-600">Coût estimé (TND)</p>
                </div>
              </div>
            </div>
          ) : activeTab === 'duration' ? (
            <div className="flex items-center gap-3">
              <Clock className="text-green-600" size={24} />
              <div>
                <p className="text-2xl font-bold text-green-800">
                  {result.estimated_duration_days} jours
                </p>
                <p className="text-green-600">Durée estimée pour ce projet</p>
              </div>
            </div>
          ) : activeTab === 'pricing' ? (
            <div className="flex items-center gap-3">
              <DollarSign className="text-green-600" size={24} />
              <div>
                <p className="text-2xl font-bold text-green-800">
                  {result.estimated_cost_euros?.toLocaleString()} DT
                </p>
                <p className="text-green-600">Coût estimé pour ce projet (Dinar Tunisien)</p>
              </div>
            </div>
          ) : (
            // Delay Risk Results
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className={`${
                  result.delay_risk === 'HIGH' ? 'text-red-600' : 
                  result.delay_risk === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'
                }`} size={24} />
                <div>
                  <p className={`text-2xl font-bold ${
                    result.delay_risk === 'HIGH' ? 'text-red-800' : 
                    result.delay_risk === 'MEDIUM' ? 'text-yellow-800' : 'text-green-800'
                  }`}>
                    Risque {result.delay_risk === 'HIGH' ? 'ÉLEVÉ' : result.delay_risk === 'MEDIUM' ? 'MOYEN' : 'FAIBLE'}
                  </p>
                  <p className="text-gray-600">
                    Confiance: {(result.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              
              {result.risk_factors && result.risk_factors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-800 mb-2">Facteurs de risque identifiés:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {result.risk_factors.map((factor, index) => (
                      <li key={index}>{factor}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {result.recommendation && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-1">Recommandation:</h4>
                  <p className="text-sm text-blue-700">{result.recommendation}</p>
                </div>
              )}
              
              {result.probabilities && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-800 mb-2">Probabilités détaillées:</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2 bg-green-100 rounded">
                      <div className="font-medium text-green-800">FAIBLE</div>
                      <div className="text-green-600">{(result.probabilities.LOW * 100).toFixed(1)}%</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-100 rounded">
                      <div className="font-medium text-yellow-800">MOYEN</div>
                      <div className="text-yellow-600">{(result.probabilities.MEDIUM * 100).toFixed(1)}%</div>
                    </div>
                    <div className="text-center p-2 bg-red-100 rounded">
                      <div className="font-medium text-red-800">ÉLEVÉ</div>
                      <div className="text-red-600">{(result.probabilities.HIGH * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export default MLPredictions;
