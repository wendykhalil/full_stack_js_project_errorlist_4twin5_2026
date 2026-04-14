const apiResponse = require('../../utils/apiResponse');

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Get weather by coordinates
exports.getWeatherByCoords = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    // Validate coordinates
    if (!lat || !lon) {
      return apiResponse(res, 'La latitude et la longitude sont requises', null, 400);
    }

    // Validate API key
    if (!OPENWEATHER_API_KEY) {
      console.error('OpenWeatherMap API key not configured');
      return apiResponse(res, 'Service météo non configuré', null, 500);
    }

    // Call OpenWeatherMap API
    const url = `${OPENWEATHER_BASE_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      let errorMessage = 'Impossible de récupérer les données météo';
      
      if (response.status === 401) {
        errorMessage = 'La clé API est invalide ou pas encore active. Veuillez patienter quelques heures pour l’activation.';
      } else if (response.status === 429) {
        errorMessage = 'Limite de requêtes API dépassée. Veuillez réessayer plus tard.';
      } else if (response.status === 404) {
        errorMessage = 'Localisation introuvable.';
      }
      
      return apiResponse(res, errorMessage, null, response.status);
    }

    const data = await response.json();
    
    return apiResponse(res, 'Données météo récupérées avec succès', data);
  } catch (err) {
    console.error('Weather API Error:', err);
    return apiResponse(res, 'Échec de récupération des données météo', null, 500);
  }
};

// Get weather by city name
exports.getWeatherByCity = async (req, res) => {
  try {
    const { city } = req.query;

    // Validate city
    if (!city) {
      return apiResponse(res, 'Le nom de la ville est requis', null, 400);
    }

    // Validate API key
    if (!OPENWEATHER_API_KEY) {
      console.error('OpenWeatherMap API key not configured');
      return apiResponse(res, 'Service météo non configuré', null, 500);
    }

    // Call OpenWeatherMap API
    const url = `${OPENWEATHER_BASE_URL}?q=${city}&units=metric&appid=${OPENWEATHER_API_KEY}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      let errorMessage = 'Impossible de récupérer les données météo';
      
      if (response.status === 401) {
        errorMessage = 'La clé API est invalide ou pas encore active. Veuillez patienter quelques heures pour l’activation.';
      } else if (response.status === 429) {
        errorMessage = 'Limite de requêtes API dépassée. Veuillez réessayer plus tard.';
      } else if (response.status === 404) {
        errorMessage = 'Ville introuvable.';
      }
      
      return apiResponse(res, errorMessage, null, response.status);
    }

    const data = await response.json();
    
    return apiResponse(res, 'Données météo récupérées avec succès', data);
  } catch (err) {
    console.error('Weather API Error:', err);
    return apiResponse(res, 'Échec de récupération des données météo', null, 500);
  }
};
