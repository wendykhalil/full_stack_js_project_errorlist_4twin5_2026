// Profile update service to handle location updates across different roles
export const updateProfileLocation = (profileData, locationData) => {
  const { latitude, longitude, address } = locationData;
  
  // Create updated profile data with new location and address info
  const updatedProfile = {
    ...profileData,
    location: { latitude, longitude },
    region: address.region || address.city || profileData.region || '',
    address: {
      ...profileData.address,
      city: address.city || profileData.address?.city || '',
      street: address.street || address.suburb || profileData.address?.street || '',
      postalCode: address.postalCode || profileData.address?.postalCode || '',
      country: address.country || profileData.address?.country || 'Tunisia',
    }
  };

  return updatedProfile;
};

// Store location data in localStorage for cross-component access
export const storeLocationUpdate = (locationData) => {
  const updateData = {
    ...locationData,
    timestamp: Date.now()
  };
  
  localStorage.setItem('pendingLocationUpdate', JSON.stringify(updateData));
  
  // Dispatch custom event to notify components
  window.dispatchEvent(new CustomEvent('locationUpdated', { 
    detail: updateData 
  }));
};

// Get and clear stored location data
export const getStoredLocationUpdate = () => {
  const stored = localStorage.getItem('pendingLocationUpdate');
  if (stored) {
    localStorage.removeItem('pendingLocationUpdate');
    return JSON.parse(stored);
  }
  return null;
};

// Check if location update is recent (within 30 seconds)
export const isRecentLocationUpdate = (timestamp) => {
  return timestamp && (Date.now() - timestamp) < 30000;
};