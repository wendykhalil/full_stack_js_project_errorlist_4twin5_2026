const ArtisanProfile = require('../../models/ArtisanProfile');
const User = require('../../models/User');

// Rechercher des artisans par spécialité, région et distance
async function searchArtisans(filters) {
  try {
    const {
      specialty,
      region,
      latitude,
      longitude,
      maxDistance = 20000, // 20 km par défaut (en mètres)
      limit = 20,
      page = 1
    } = filters;

    // Construire la requête
    let query = { isActive: true };

    // Filtrer par spécialité
    if (specialty) {
      query.trade = { $regex: new RegExp(specialty, 'i') };
    }

    // Filtrer par région (recherche textuelle)
    if (region) {
      query.$or = [
        { region: { $regex: new RegExp(region, 'i') } },
        { 'address.city': { $regex: new RegExp(region, 'i') } }
      ];
    }

    let artisans = [];
    let total = 0;

    // Si on a des coordonnées, faire une recherche géospatiale
    if (latitude && longitude) {
      const coordinates = [parseFloat(longitude), parseFloat(latitude)];
      
      // Recherche avec géolocalisation
      artisans = await ArtisanProfile.find({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: coordinates
            },
            $maxDistance: parseInt(maxDistance)
          }
        }
      })
      .populate('userId', 'firstName lastName')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

      // Compter le total (pour pagination)
      total = await ArtisanProfile.countDocuments({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: coordinates
            },
            $maxDistance: parseInt(maxDistance)
          }
        }
      });

    } else {
      // Recherche sans géolocalisation
      artisans = await ArtisanProfile.find(query)
        .populate('userId', 'firstName lastName')
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean();

      total = await ArtisanProfile.countDocuments(query);
    }

    // Formater les résultats
    const formattedArtisans = artisans.map(artisan => ({
      _id: artisan._id,
      userId: artisan.userId._id,
      name: `${artisan.userId.firstName} ${artisan.userId.lastName}`,
      trade: artisan.trade,
      region: artisan.region,
      phone: artisan.phone,
      profileImage: artisan.profileImage,
      description: artisan.description,
      address: artisan.address,
      location: artisan.location,
      totalProjects: artisan.totalProjects,
      distance: artisan.dist ? {
        calculated: artisan.dist.calculated,
        text: `${(artisan.dist.calculated / 1000).toFixed(1)} km`
      } : null
    }));

    return {
      artisans: formattedArtisans,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      filters: {
        specialty,
        region,
        hasGeolocation: !!(latitude && longitude)
      }
    };
  } catch (error) {
    console.error('Error in searchArtisans service:', error);
    throw error;
  }
}

// Obtenir les artisans proches d'un point
async function getNearbyArtisans(latitude, longitude, maxDistance = 20000) {
  try {
    const artisans = await ArtisanProfile.find({
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    })
    .populate('userId', 'firstName lastName')
    .limit(50)
    .lean();

    return artisans.map(artisan => ({
      _id: artisan._id,
      name: `${artisan.userId.firstName} ${artisan.userId.lastName}`,
      trade: artisan.trade,
      region: artisan.region,
      profileImage: artisan.profileImage,
      distance: artisan.dist ? (artisan.dist.calculated / 1000).toFixed(1) : null
    }));
  } catch (error) {
    console.error('Error in getNearbyArtisans service:', error);
    throw error;
  }
}

module.exports = {
  searchArtisans,
  getNearbyArtisans
};