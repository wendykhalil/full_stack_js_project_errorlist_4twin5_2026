const express = require('express');
const router = express.Router();
const searchController = require('./search.controller');

// Routes publiques
router.get('/artisans', searchController.searchArtisans);
router.get('/artisans/nearby', searchController.getNearbyArtisans);

module.exports = router;