const apiResponse = require('../../utils/apiResponse');

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Get weather by coordinates
exports.getWeatherByCoords = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    // Validate coordinates
    if (!lat || !lon) {
      return apiResponse(res, 'Latitude and longitude are required', null, 400);
    }

    // Validate API key
    if (!OPENWEATHER_API_KEY) {
      console.error('OpenWeatherMap API key not configured');
      return apiResponse(res, 'Weather service not configured', null, 500);
    }

    // Call OpenWeatherMap API
    const url = `${OPENWEATHER_BASE_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      let errorMessage = 'Unable to fetch weather data';
      
      if (response.status === 401) {
        errorMessage = 'API key is invalid or not yet active. Please wait a few hours for activation.';
      } else if (response.status === 429) {
        errorMessage = 'API rate limit exceeded. Please try again later.';
      } else if (response.status === 404) {
        errorMessage = 'Location not found.';
      }
      
      return apiResponse(res, errorMessage, null, response.status);
    }

    const data = await response.json();
    
    return apiResponse(res, 'Weather data fetched successfully', data);
  } catch (err) {
    console.error('Weather API Error:', err);
    return apiResponse(res, 'Failed to fetch weather data', null, 500);
  }
};

// Get weather by city name
exports.getWeatherByCity = async (req, res) => {
  try {
    const { city } = req.query;

    // Validate city
    if (!city) {
      return apiResponse(res, 'City name is required', null, 400);
    }

    // Validate API key
    if (!OPENWEATHER_API_KEY) {
      console.error('OpenWeatherMap API key not configured');
      return apiResponse(res, 'Weather service not configured', null, 500);
    }

    // Call OpenWeatherMap API
    const url = `${OPENWEATHER_BASE_URL}?q=${city}&units=metric&appid=${OPENWEATHER_API_KEY}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      let errorMessage = 'Unable to fetch weather data';
      
      if (response.status === 401) {
        errorMessage = 'API key is invalid or not yet active. Please wait a few hours for activation.';
      } else if (response.status === 429) {
        errorMessage = 'API rate limit exceeded. Please try again later.';
      } else if (response.status === 404) {
        errorMessage = 'City not found.';
      }
      
      return apiResponse(res, errorMessage, null, response.status);
    }

    const data = await response.json();
    
    return apiResponse(res, 'Weather data fetched successfully', data);
  } catch (err) {
    console.error('Weather API Error:', err);
    return apiResponse(res, 'Failed to fetch weather data', null, 500);
  }
};
