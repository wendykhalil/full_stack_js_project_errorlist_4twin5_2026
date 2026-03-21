const ArtisanProfile = require('../../models/ArtisanProfile');
const User = require('../../models/User');

// Créer ou mettre à jour le profil artisan
async function updateArtisanProfile(userId, profileData) {
  try {
    let profile = await ArtisanProfile.findOne({ userId });

    if (!profile) {
      profile = new ArtisanProfile({
        userId,
        ...profileData,
        location: {
          type: 'Point',
          coordinates: profileData.coordinates || [0, 0]
        }
      });
    } else {
      // Mettre à jour les champs
      if (profileData.trade) profile.trade = profileData.trade;
      if (profileData.region) profile.region = profileData.region;
      if (profileData.phone) profile.phone = profileData.phone;
      if (profileData.description) profile.description = profileData.description;
      if (profileData.profileImage) profile.profileImage = profileData.profileImage;
      
      // Mettre à jour l'adresse
      if (profileData.address) {
        profile.address = { ...profile.address, ...profileData.address };
      }

      // Mettre à jour la localisation si fournie
      if (profileData.coordinates && profileData.coordinates.length === 2) {
        profile.location.coordinates = profileData.coordinates;
        profile.locationLastUpdated = new Date();
      }
    }

    await profile.save();
    
    // Peupler les infos utilisateur
    await profile.populate('userId', 'firstName lastName email');
    
    return profile;
  } catch (error) {
    console.error('Error in updateArtisanProfile service:', error);
    throw error;
  }
}

// Récupérer le profil artisan
async function getArtisanProfile(artisanId) {
  try {
    const profile = await ArtisanProfile.findOne({ userId: artisanId })
      .populate('userId', 'firstName lastName email')
      .populate('portfolio');

    if (!profile) {
      const error = new Error('Profil artisan non trouvé');
      error.statusCode = 404;
      throw error;
    }

    return profile;
  } catch (error) {
    console.error('Error in getArtisanProfile service:', error);
    throw error;
  }
}

// Mettre à jour la localisation (appelé quotidiennement)
async function updateArtisanLocation(userId, coordinates) {
  try {
    const profile = await ArtisanProfile.findOne({ userId });
    if (!profile) {
      const error = new Error('Profil artisan non trouvé');
      error.statusCode = 404;
      throw error;
    }

    profile.location.coordinates = coordinates;
    profile.locationLastUpdated = new Date();
    await profile.save();

    return profile;
  } catch (error) {
    console.error('Error in updateArtisanLocation service:', error);
    throw error;
  }
}

// Obtenir le profil public d'un artisan (pour prescripteur)
// Obtenir le profil public d'un artisan (pour prescripteur)
async function getPublicArtisanProfile(identifier) {
  try {
    console.log('Searching public artisan profile with identifier:', identifier);

    let profile = await ArtisanProfile.findById(identifier)
      .populate('userId', 'firstName lastName email phone role status')
      .populate({
        path: 'portfolio',
        match: { isPublic: true },
        options: { sort: { date: -1 } }
      });

    if (!profile) {
      profile = await ArtisanProfile.findOne({ userId: identifier })
        .populate('userId', 'firstName lastName email phone role status')
        .populate({
          path: 'portfolio',
          match: { isPublic: true },
          options: { sort: { date: -1 } }
        });
    }

    if (profile && profile.userId) {
      return {
        _id: profile._id,
        userId: profile.userId._id,
        name: `${profile.userId.firstName} ${profile.userId.lastName}`,
        trade: profile.trade,
        region: profile.region,
        phone: profile.phone || profile.userId.phone || '',
        description: profile.description,
        profileImage: profile.profileImage,
        address: profile.address,
        portfolio: profile.portfolio,
        totalProjects: profile.portfolio?.length || 0,
        hasCompletedProfile: true,
      };
    }

    const user = await User.findOne({
      _id: identifier,
      role: 'ARTISAN',
      status: { $ne: 'BLOCKED' },
    }).select('firstName lastName email phone role status');

    if (!user) {
      const error = new Error('Artisan non trouvé');
      error.statusCode = 404;
      throw error;
    }

    return {
      _id: user._id,
      userId: user._id,
      name: `${user.firstName} ${user.lastName}`,
      trade: 'Profil en cours de completion',
      region: 'Region non renseignee',
      phone: user.phone || '',
      description: '',
      profileImage: '',
      address: null,
      portfolio: [],
      totalProjects: 0,
      hasCompletedProfile: false,
    };
  } catch (error) {
    console.error('Error in getPublicArtisanProfile service:', error);
    throw error;
  }
}

module.exports = {
  updateArtisanProfile,
  getArtisanProfile,
  updateArtisanLocation,
  getPublicArtisanProfile
};