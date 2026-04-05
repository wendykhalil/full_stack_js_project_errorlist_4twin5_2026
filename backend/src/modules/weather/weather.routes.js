const express = require('express');
const router = express.Router();
const { authRequired } = require('../../middleware/authMiddleware');
const { getWeatherByCoords, getWeatherByCity } = require('./weather.controller');

// Get weather by coordinates (latitude, longitude)
router.get('/by-coords', authRequired, getWeatherByCoords);

// Get weather by city name
router.get('/by-city', authRequired, getWeatherByCity);

module.exports = router;
