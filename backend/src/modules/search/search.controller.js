const searchService = require('./search.service');
const apiResponse = require('../../utils/apiResponse');

// Rechercher des artisans
async function searchArtisans(req, res) {
  try {
    const {
      specialty,
      region,
      lat,
      lng,
      distance,
      page,
      limit
    } = req.query;

    const filters = {
      specialty,
      region,
      latitude: lat,
      longitude: lng,
      maxDistance: distance ? parseFloat(distance) * 1000 : 20000, // Convertir km en mètres
      page,
      limit
    };

    const results = await searchService.searchArtisans(filters);
    return apiResponse(res, 'Recherche effectuée avec succès', results);
  } catch (error) {
    console.error('Error searching artisans:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Erreur lors de la recherche'
    });
  }
}

// Obtenir les artisans proches
async function getNearbyArtisans(req, res) {
  try {
    const { lat, lng, distance } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        message: 'Latitude et longitude requises'
      });
    }

    const artisans = await searchService.getNearbyArtisans(
      lat,
      lng,
      distance ? parseFloat(distance) * 1000 : 20000
    );

    return apiResponse(res, 'Artisans proches récupérés', artisans);
  } catch (error) {
    console.error('Error getting nearby artisans:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Erreur lors de la récupération des artisans proches'
    });
  }
}

module.exports = {
  searchArtisans,
  getNearbyArtisans
};