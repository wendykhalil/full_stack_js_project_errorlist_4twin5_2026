const artisanProfileService = require('./artisanProfile.service');
const apiResponse = require('../../utils/apiResponse');
const { uploadBufferToCloudinary } = require('../../config/cloudinary');

// Mettre à jour le profil artisan
async function updateProfile(req, res) {
  try {
    console.log('Updating artisan profile for user:', req.user._id);
    console.log('Profile data:', req.body);

    const profileData = req.body;
    
    // Gérer l'upload d'image si présent
    if (req.file) {
      const uploaded = await uploadBufferToCloudinary(req.file.buffer, {
        folder: 'bmp/artisan/profile',
        resourceType: 'image',
      });
      profileData.profileImage = uploaded.secure_url;
    }

    // Parser les coordonnées si fournies
    if (req.body.coordinates) {
      try {
        profileData.coordinates = JSON.parse(req.body.coordinates);
      } catch (e) {
        console.error('Error parsing coordinates:', e);
      }
    }

    const profile = await artisanProfileService.updateArtisanProfile(
      req.user._id,
      profileData
    );

    return apiResponse(res, 'Profil mis à jour avec succès', profile);
  } catch (error) {
    console.error('Error updating artisan profile:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Erreur lors de la mise à jour du profil'
    });
  }
}

// Récupérer le profil de l'artisan connecté
async function getMyProfile(req, res) {
  try {
    const profile = await artisanProfileService.getArtisanProfile(req.user._id);
    return apiResponse(res, 'Profil récupéré', profile);
  } catch (error) {
    console.error('Error getting artisan profile:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Erreur lors du chargement du profil'
    });
  }
}

// Mettre à jour la localisation
async function updateLocation(req, res) {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude et longitude requises' });
    }

    const profile = await artisanProfileService.updateArtisanLocation(
      req.user._id,
      [longitude, latitude] // GeoJSON format: [longitude, latitude]
    );

    return apiResponse(res, 'Localisation mise à jour', profile);
  } catch (error) {
    console.error('Error updating location:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Erreur lors de la mise à jour de la localisation'
    });
  }
}

// Récupérer le profil public d'un artisan
async function getPublicProfile(req, res) {
  try {
    const { id } = req.params;
    const profile = await artisanProfileService.getPublicArtisanProfile(id);
    return apiResponse(res, 'Profil artisan récupéré', profile);
  } catch (error) {
    console.error('Error getting public profile:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Erreur lors du chargement du profil'
    });
  }
}

// DEBUG/TEST: Reset trial features for current artisan
async function resetTrialFeatures(req, res) {
  try {
    const profile = await artisanProfileService.resetArtisanTrialFeatures(req.user._id);
    return apiResponse(res, 'Trial features réinitialisés', profile);
  } catch (error) {
    console.error('Error resetting trial features:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Erreur lors de la réinitialisation des essais'
    });
  }
}

module.exports = {
  updateProfile,
  getMyProfile,
  updateLocation,
  getPublicProfile,
  resetTrialFeatures
};