const ArtisanProfile = require('../../models/ArtisanProfile');
const User = require('../../models/User');

// ============= VALIDATEURS =============
function validateUserId(userId) {
  if (!userId) {
    const error = new Error('User ID required');
    error.statusCode = 400;
    throw error;
  }
}

function validateCoordinates(coordinates) {
  if (coordinates && (!Array.isArray(coordinates) || coordinates.length !== 2)) {
    const error = new Error('Invalid coordinates format. Expected [longitude, latitude]');
    error.statusCode = 400;
    throw error;
  }
  return coordinates || [0, 0];
}

// ============= RECHERCHE DE BASE =============
async function findProfile(userId, populateOptions = false) {
  validateUserId(userId);
  
  let query = ArtisanProfile.findOne({ userId });
  
  if (populateOptions) {
    query = query.populate('userId', 'firstName lastName email')
                 .populate('portfolio');
  }
  
  const profile = await query;
  
  if (!profile) {
    const error = new Error('Profil artisan non trouvé');
    error.statusCode = 404;
    throw error;
  }
  
  return profile;
}

// ============= MISE À JOUR PROFIL =============
function updateProfileFields(profile, profileData) {
  const fieldsToUpdate = ['trade', 'region', 'phone', 'description', 'profileImage'];
  
  fieldsToUpdate.forEach(field => {
    if (profileData[field]) profile[field] = profileData[field];
  });
  
  if (profileData.address) {
    profile.address = { ...profile.address, ...profileData.address };
  }
  
  if (profileData.coordinates && profileData.coordinates.length === 2) {
    profile.location.coordinates = profileData.coordinates;
    profile.locationLastUpdated = new Date();
  }
}

function createNewProfile(userId, profileData) {
  return new ArtisanProfile({
    userId,
    ...profileData,
    location: {
      type: 'Point',
      coordinates: validateCoordinates(profileData.coordinates)
    }
  });
}

async function updateArtisanProfile(userId, profileData) {
  try {
    let profile = await ArtisanProfile.findOne({ userId });
    
    if (!profile) {
      profile = createNewProfile(userId, profileData);
    } else {
      updateProfileFields(profile, profileData);
    }
    
    await profile.save();
    await profile.populate('userId', 'firstName lastName email');
    
    return profile;
  } catch (error) {
    console.error('Error in updateArtisanProfile service:', error);
    throw error;
  }
}

// ============= RÉCUPÉRATION PROFIL =============
async function getArtisanProfile(artisanId) {
  try {
    return await findProfile(artisanId, true);
  } catch (error) {
    console.error('Error in getArtisanProfile service:', error);
    throw error;
  }
}

// ============= LOCALISATION =============
async function updateArtisanLocation(userId, coordinates) {
  try {
    validateCoordinates(coordinates);
    const profile = await findProfile(userId);
    
    profile.location.coordinates = coordinates;
    profile.locationLastUpdated = new Date();
    await profile.save();
    
    return profile;
  } catch (error) {
    console.error('Error in updateArtisanLocation service:', error);
    throw error;
  }
}

// ============= PROFIL PUBLIC =============
async function findArtisanByIdentifier(identifier) {
  let profile = await ArtisanProfile.findById(identifier)
    .populate('userId', 'firstName lastName email phone role status')
    .populate({
      path: 'portfolio',
      match: { isPublic: true },
      options: { sort: { date: -1 } }
    });
  
  if (!profile && identifier) {
    profile = await ArtisanProfile.findOne({ userId: identifier })
      .populate('userId', 'firstName lastName email phone role status')
      .populate({
        path: 'portfolio',
        match: { isPublic: true },
        options: { sort: { date: -1 } }
      });
  }
  
  return profile;
}

function formatProfileResponse(profile) {
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

function formatIncompleteProfile(user) {
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
}

async function getPublicArtisanProfile(identifier) {
  try {
    console.log('Searching public artisan profile with identifier:', identifier);
    
    const profile = await findArtisanByIdentifier(identifier);
    
    if (profile && profile.userId) {
      return formatProfileResponse(profile);
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
    
    return formatIncompleteProfile(user);
  } catch (error) {
    console.error('Error in getPublicArtisanProfile service:', error);
    throw error;
  }
}

// ============= FONCTIONS UTILITAIRES =============
async function resetArtisanTrialFeatures(userId) {
  try {
    const profile = await findProfile(userId);
    
    profile.trialFeatures = {
      projectCreated: false,
      portfolioCreated: false,
      quoteCreated: false,
      invoiceCreated: false
    };
    
    await profile.save();
    return profile;
  } catch (error) {
    console.error('Error in resetArtisanTrialFeatures service:', error);
    throw error;
  }
}

module.exports = {
  updateArtisanProfile,
  getArtisanProfile,
  updateArtisanLocation,
  getPublicArtisanProfile,
  resetArtisanTrialFeatures
};