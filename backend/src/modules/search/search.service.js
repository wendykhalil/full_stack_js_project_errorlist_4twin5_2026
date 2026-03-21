const ArtisanProfile = require('../../models/ArtisanProfile');
const User = require('../../models/User');

function safeRegex(value) {
  return new RegExp(String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

function formatArtisan(profile, user) {
  const firstName = user?.firstName || 'Artisan';
  const lastName = user?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();

  return {
    _id: profile?._id || user?._id,
    userId: user?._id,
    name: fullName,
    trade: profile?.trade || 'Profil en cours de completion',
    region: profile?.region || profile?.address?.city || 'Region non renseignee',
    phone: profile?.phone || user?.phone || '',
    profileImage: profile?.profileImage || '',
    description: profile?.description || '',
    address: profile?.address || null,
    location: profile?.location || null,
    totalProjects: profile?.totalProjects || profile?.portfolio?.length || 0,
    hasCompletedProfile: Boolean(profile),
    distance: profile?.dist
      ? {
          calculated: profile.dist.calculated,
          text: `${(profile.dist.calculated / 1000).toFixed(1)} km`,
        }
      : null,
  };
}

// Rechercher des artisans par specialite, region et distance
async function searchArtisans(filters) {
  try {
    const {
      specialty,
      region,
      latitude,
      longitude,
      maxDistance = 20000,
      limit = 20,
      page = 1,
    } = filters;

    const parsedLimit = parseInt(limit, 10) || 20;
    const parsedPage = parseInt(page, 10) || 1;
    const hasLocation = latitude && longitude;
    const hasProfileFilters = Boolean(specialty || region || hasLocation);

    const profileQuery = { isActive: true };

    if (specialty) {
      profileQuery.trade = { $regex: safeRegex(specialty) };
    }

    if (region) {
      profileQuery.$or = [
        { region: { $regex: safeRegex(region) } },
        { 'address.city': { $regex: safeRegex(region) } },
      ];
    }

    let profiles = [];
    let total = 0;

    if (hasLocation) {
      const coordinates = [parseFloat(longitude), parseFloat(latitude)];
      profiles = await ArtisanProfile.find({
        ...profileQuery,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates,
            },
            $maxDistance: parseInt(maxDistance, 10),
          },
        },
      })
        .populate('userId', 'firstName lastName phone role status')
        .limit(parsedLimit)
        .skip((parsedPage - 1) * parsedLimit)
        .lean();

      total = await ArtisanProfile.countDocuments({
        ...profileQuery,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates,
            },
            $maxDistance: parseInt(maxDistance, 10),
          },
        },
      });

      return {
        artisans: profiles
          .filter((profile) => profile.userId && profile.userId.role === 'ARTISAN' && profile.userId.status !== 'BLOCKED')
          .map((profile) => formatArtisan(profile, profile.userId)),
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total,
          pages: Math.ceil(total / parsedLimit) || 1,
        },
        filters: {
          specialty,
          region,
          hasGeolocation: true,
        },
      };
    }

    const activeArtisans = await User.find({
      role: 'ARTISAN',
      status: { $ne: 'BLOCKED' },
    })
      .select('firstName lastName phone role status')
      .sort({ createdAt: -1 })
      .lean();

    const userIds = activeArtisans.map((user) => user._id);
    const profileDocs = await ArtisanProfile.find({ userId: { $in: userIds }, isActive: true })
      .lean();

    const profileByUserId = new Map(profileDocs.map((profile) => [String(profile.userId), profile]));

    let merged = activeArtisans
      .map((user) => ({ user, profile: profileByUserId.get(String(user._id)) || null }))
      .filter(({ user, profile }) => {
        if (specialty && !profile) return false;
        if (specialty && profile && !safeRegex(specialty).test(profile.trade || '')) return false;

        if (region) {
          const regionRegex = safeRegex(region);
          const haystacks = [
            profile?.region,
            profile?.address?.city,
            user.firstName,
            user.lastName,
            `${user.firstName} ${user.lastName}`,
          ].filter(Boolean);
          if (!haystacks.some((value) => regionRegex.test(value))) return false;
        }

        return true;
      });

    if (!hasProfileFilters) {
      merged.sort((a, b) => {
        if (a.profile && !b.profile) return -1;
        if (!a.profile && b.profile) return 1;
        return `${a.user.firstName} ${a.user.lastName}`.localeCompare(`${b.user.firstName} ${b.user.lastName}`);
      });
    }

    total = merged.length;
    const paginated = merged.slice((parsedPage - 1) * parsedLimit, parsedPage * parsedLimit);

    return {
      artisans: paginated.map(({ profile, user }) => formatArtisan(profile, user)),
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit) || 1,
      },
      filters: {
        specialty,
        region,
        hasGeolocation: false,
      },
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
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseInt(maxDistance, 10),
        },
      },
    })
      .populate('userId', 'firstName lastName')
      .limit(50)
      .lean();

    return artisans.map((artisan) => ({
      _id: artisan._id,
      name: `${artisan.userId.firstName} ${artisan.userId.lastName}`,
      trade: artisan.trade,
      region: artisan.region,
      profileImage: artisan.profileImage,
      distance: artisan.dist ? (artisan.dist.calculated / 1000).toFixed(1) : null,
    }));
  } catch (error) {
    console.error('Error in getNearbyArtisans service:', error);
    throw error;
  }
}

module.exports = {
  searchArtisans,
  getNearbyArtisans,
};
