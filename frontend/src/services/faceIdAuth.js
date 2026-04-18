/**
 * Face ID Authentication Service using WebAuthn API
 * Provides biometric authentication for modern browsers
 */

// Check if WebAuthn is supported
export const isFaceIdSupported = () => {
  return (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === 'function' &&
    window.navigator.credentials &&
    typeof window.navigator.credentials.create === 'function'
  );
};

// Check if platform authenticator (Face ID/Touch ID) is available
export const isPlatformAuthenticatorAvailable = async () => {
  if (!isFaceIdSupported()) return false;
  
  try {
    const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    console.log('Platform authenticator available:', available);
    return available;
  } catch (error) {
    console.error('Error checking platform authenticator:', error);
    return false;
  }
};

// Check if conditional UI is supported (for better UX)
export const isConditionalUISupported = async () => {
  if (!isFaceIdSupported()) return false;
  
  try {
    const available = await window.PublicKeyCredential.isConditionalMediationAvailable();
    console.log('Conditional UI available:', available);
    return available;
  } catch (error) {
    console.error('Error checking conditional UI:', error);
    return false;
  }
};

// Generate a random challenge for authentication
const generateChallenge = () => {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return array;
};

// Convert ArrayBuffer to Base64
const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Convert Base64 to ArrayBuffer
const base64ToArrayBuffer = (base64) => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// Register Face ID for a user
export const registerFaceId = async (userId, userEmail) => {
  if (!isFaceIdSupported()) {
    throw new Error('Face ID is not supported on this device');
  }

  // Check if platform authenticator is available
  const isAvailable = await isPlatformAuthenticatorAvailable();
  if (!isAvailable) {
    throw new Error('Biometric authentication is not available on this device. Please enable Face ID, Touch ID, or Windows Hello in your device settings.');
  }

  const challenge = generateChallenge();
  
  const publicKeyCredentialCreationOptions = {
    challenge: challenge,
    rp: {
      name: "BMP.tn",
      id: window.location.hostname,
    },
    user: {
      id: new TextEncoder().encode(userId),
      name: userEmail,
      displayName: userEmail,
    },
    pubKeyCredParams: [
      {
        alg: -7, // ES256 (preferred for mobile devices)
        type: "public-key"
      },
      {
        alg: -257, // RS256 (fallback)
        type: "public-key"
      }
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform", // FORCE platform authenticator only (no external devices)
      userVerification: "required", // FORCE biometric verification (no PIN fallback)
      requireResidentKey: false, // Don't require resident key
      residentKey: "discouraged" // Explicitly discourage resident key to avoid PIN prompts
    },
    timeout: 120000, // Increased timeout to 2 minutes for better UX
    attestation: "none", // No attestation needed for faster registration
    excludeCredentials: [], // Don't exclude existing credentials
    extensions: {
      // Force biometric authentication, prevent PIN fallback
      uvm: true // Request user verification methods info
    }
  };

  try {
    console.log('Starting Face ID registration with options:', {
      ...publicKeyCredentialCreationOptions,
      challenge: '[hidden]',
      user: { ...publicKeyCredentialCreationOptions.user, id: '[hidden]' }
    });

    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions
    });

    if (!credential) {
      throw new Error('Failed to create credential - no credential returned');
    }

    console.log('Face ID credential created successfully');

    // Store credential info for later authentication
    const credentialData = {
      id: credential.id,
      rawId: arrayBufferToBase64(credential.rawId),
      type: credential.type,
      userId: userId,
      userEmail: userEmail,
      registeredAt: new Date().toISOString(),
      response: {
        attestationObject: arrayBufferToBase64(credential.response.attestationObject),
        clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON)
      }
    };

    // Store in localStorage with better key structure
    localStorage.setItem('faceId_credential', JSON.stringify(credentialData));
    localStorage.setItem('faceId_registered', 'true');
    localStorage.setItem('faceId_userId', userId);
    localStorage.setItem('faceId_userEmail', userEmail);

    console.log('Face ID credentials stored successfully');

    return {
      success: true,
      credentialId: credential.id,
      message: 'Face ID registered successfully'
    };

  } catch (error) {
    console.error('Face ID registration error:', error);
    
    let errorMessage = 'Failed to register Face ID';
    if (error.name === 'NotAllowedError') {
      errorMessage = 'Face ID registration was cancelled or denied. Please try again and allow biometric authentication.';
    } else if (error.name === 'NotSupportedError') {
      errorMessage = 'Face ID is not supported on this device or browser.';
    } else if (error.name === 'SecurityError') {
      errorMessage = 'Security error during Face ID registration. Please ensure you are on a secure (HTTPS) connection.';
    } else if (error.name === 'InvalidStateError') {
      errorMessage = 'Face ID is already registered for this account. Please remove existing registration first.';
    } else if (error.name === 'ConstraintError') {
      errorMessage = 'Device does not support the required biometric authentication method.';
    }

    throw new Error(errorMessage);
  }
};

// Authenticate with Face ID (now checks server for user account)
export const authenticateWithFaceId = async () => {
  if (!isFaceIdSupported()) {
    throw new Error('Face ID is not supported on this device');
  }

  // Check if platform authenticator is available
  const isAvailable = await isPlatformAuthenticatorAvailable();
  if (!isAvailable) {
    throw new Error('Biometric authentication is not available. Please enable Face ID, Touch ID, or Windows Hello in your device settings.');
  }

  // Check if Face ID is registered locally
  const isRegistered = localStorage.getItem('faceId_registered');
  if (!isRegistered) {
    throw new Error('Face ID is not registered for this device. Please set up Face ID in your profile settings first.');
  }

  const storedCredential = localStorage.getItem('faceId_credential');
  
  if (!storedCredential) {
    throw new Error('No Face ID credentials found for this device. Please re-register Face ID in your profile.');
  }

  let credentialData;
  try {
    credentialData = JSON.parse(storedCredential);
  } catch (error) {
    throw new Error('Invalid Face ID credentials stored. Please re-register Face ID in your profile.');
  }

  const challenge = generateChallenge();

  const publicKeyCredentialRequestOptions = {
    challenge: challenge,
    allowCredentials: [{
      id: base64ToArrayBuffer(credentialData.rawId),
      type: 'public-key',
      transports: ['internal'] // Platform authenticator only
    }],
    userVerification: 'required', // FORCE biometric verification (no PIN fallback)
    timeout: 120000, // Increased timeout to 2 minutes
    rpId: window.location.hostname,
    extensions: {
      // Force biometric authentication, prevent PIN fallback
      uvm: true // Request user verification methods info
    }
  };

  try {
    console.log('Starting Face ID authentication...');
    
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions
    });

    if (!assertion) {
      throw new Error('Face ID authentication failed - no assertion returned');
    }

    console.log('Face ID authentication successful, verifying with server...');

    // Prepare authentication data for server verification
    const authData = {
      credentialId: assertion.id,
      signature: arrayBufferToBase64(assertion.response.signature),
      authenticatorData: arrayBufferToBase64(assertion.response.authenticatorData),
      clientDataJSON: arrayBufferToBase64(assertion.response.clientDataJSON),
      userHandle: assertion.response.userHandle ? arrayBufferToBase64(assertion.response.userHandle) : null,
      // Include stored user info for server verification
      storedUserId: credentialData.userId,
      storedUserEmail: credentialData.userEmail
    };

    // Send to server for verification and get user account
    const response = await fetch('/api/faceid/authenticate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(authData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Server error' }));
      console.error('Server authentication failed:', errorData);
      throw new Error(errorData.message || 'Face ID authentication failed on server');
    }

    const result = await response.json();
    console.log('Server authentication successful:', result);
    
    return {
      success: true,
      user: result.user,
      token: result.token,
      message: result.message || 'Face ID authentication successful'
    };

  } catch (error) {
    console.error('Face ID authentication error:', error);
    
    let errorMessage = 'Face ID authentication failed';
    if (error.name === 'NotAllowedError') {
      errorMessage = 'Face ID authentication was cancelled or denied. Please try again and complete the biometric prompt.';
    } else if (error.name === 'InvalidStateError') {
      errorMessage = 'Face ID is not available or configured properly on this device.';
    } else if (error.name === 'SecurityError') {
      errorMessage = 'Security error during Face ID authentication. Please ensure you are on a secure connection.';
    } else if (error.name === 'AbortError') {
      errorMessage = 'Face ID authentication timed out. Please try again.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

// Check if Face ID is registered for current device
export const isFaceIdRegistered = () => {
  return localStorage.getItem('faceId_registered') === 'true';
};

// Remove Face ID registration
export const removeFaceIdRegistration = () => {
  // Remove all Face ID related data
  localStorage.removeItem('faceId_credential');
  localStorage.removeItem('faceId_registered');
  localStorage.removeItem('faceId_userId');
  localStorage.removeItem('faceId_userEmail');
  
  // Also remove old format data (for backward compatibility)
  const userId = localStorage.getItem('faceId_userId');
  if (userId) {
    localStorage.removeItem(`faceId_${userId}`);
  }
  
  console.log('Face ID registration removed from local storage');
};

// Get device info for Face ID
export const getFaceIdDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  let deviceType = 'Unknown';
  let biometricType = 'Face ID';

  if (/iPhone|iPad|iPod/.test(userAgent)) {
    deviceType = 'iOS';
    biometricType = 'Face ID / Touch ID';
  } else if (/Android/.test(userAgent)) {
    deviceType = 'Android';
    biometricType = 'Fingerprint / Face Unlock';
  } else if (/Windows/.test(userAgent)) {
    deviceType = 'Windows';
    biometricType = 'Windows Hello';
  } else if (/Mac/.test(userAgent)) {
    deviceType = 'macOS';
    biometricType = 'Touch ID / Face ID';
  }

  return {
    deviceType,
    biometricType,
    isSupported: isFaceIdSupported()
  };
};