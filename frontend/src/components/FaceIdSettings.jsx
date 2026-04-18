import React, { useState, useEffect } from 'react';
import { 
  Scan, 
  Shield, 
  Smartphone, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings,
  Trash2,
  Plus,
  Lock,
  Info,
  Camera,
  Key
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { 
  isFaceIdSupported, 
  isPlatformAuthenticatorAvailable, 
  registerFaceId, 
  isFaceIdRegistered,
  removeFaceIdRegistration,
  getFaceIdDeviceInfo 
} from '../services/faceIdAuth';
import { getCameraFaceIdInfo, isCameraFaceIdRegistered } from '../services/cameraFaceId';
import CameraFaceIdSetup from './CameraFaceIdSetup';

const FaceIdSettings = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('passkey'); // 'passkey' or 'camera'
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [cameraInfo, setCameraInfo] = useState(null);

  useEffect(() => {
    if (user) {
      checkFaceIdCapabilities();
      checkServerRegistrationStatus();
      checkCameraFaceIdStatus();
    }
  }, [user]);

  const checkFaceIdCapabilities = async () => {
    try {
      const supported = isFaceIdSupported();
      const platformAvailable = await isPlatformAuthenticatorAvailable();
      const localRegistered = isFaceIdRegistered();
      const info = getFaceIdDeviceInfo();

      setIsSupported(supported && platformAvailable);
      setIsRegistered(localRegistered);
      setDeviceInfo(info);
    } catch (error) {
      console.error('Error checking Face ID capabilities:', error);
    }
  };

  const checkServerRegistrationStatus = async () => {
    try {
      const response = await fetch('/api/faceid/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRegistrationStatus(data);
        console.log('Server registration status:', data);
      } else {
        console.error('Failed to check server registration status:', response.status);
      }
    } catch (error) {
      console.error('Error checking server registration status:', error);
    }
  };

  const checkCameraFaceIdStatus = () => {
    const info = getCameraFaceIdInfo();
    setCameraInfo(info);
  };

  const handleRegisterFaceId = async () => {
    if (!user) {
      setMessage('You must be logged in to register Face ID');
      setMessageType('error');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      // Check if platform authenticator is available before attempting registration
      const platformAvailable = await isPlatformAuthenticatorAvailable();
      if (!platformAvailable) {
        throw new Error('Biometric authentication is not available on this device. Please enable Face ID, Touch ID, or Windows Hello in your device settings, then refresh this page.');
      }

      setMessage('Please complete the biometric authentication when prompted. This will NOT open your camera - it uses your device\'s built-in Face ID/Touch ID/Windows Hello.');
      setMessageType('info');

      console.log('Starting Face ID registration for user:', user.id, user.email);

      // Step 1: Register Face ID locally (WebAuthn)
      const localResult = await registerFaceId(user.id, user.email);
      
      console.log('Local registration result:', localResult);
      
      if (localResult.success) {
        setMessage('Biometric authentication successful! Registering with server...');
        
        // Step 2: Register with server
        const serverResponse = await fetch('/api/faceid/register', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            credentialId: localResult.credentialId,
            publicKey: 'demo_public_key', // In production, extract from WebAuthn response
            deviceInfo: deviceInfo,
            registeredAt: new Date().toISOString()
          })
        });

        console.log('Server response status:', serverResponse.status);
        
        if (serverResponse.ok) {
          const serverData = await serverResponse.json();
          console.log('Server registration successful:', serverData);
          
          // Update local state
          setIsRegistered(true);
          setRegistrationStatus({
            isRegistered: true,
            registeredAt: new Date().toISOString(),
            deviceInfo: deviceInfo
          });
          
          // Refresh server status
          await checkServerRegistrationStatus();
          
          setMessage(`🎉 ${deviceInfo?.biometricType} configured successfully! You can now use biometric authentication to sign in quickly and securely.`);
          setMessageType('success');
        } else {
          const errorData = await serverResponse.json().catch(() => ({ message: 'Server error' }));
          console.error('Server registration failed:', errorData);
          throw new Error(errorData.message || 'Failed to register Face ID with server');
        }
      }
    } catch (error) {
      console.error('Face ID registration error:', error);
      
      let errorMessage = error.message;
      
      // Provide specific guidance based on error type
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Biometric authentication was cancelled or denied. Please try again and complete the biometric prompt when it appears.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Biometric authentication is not supported on this device or browser. Please use a modern browser and ensure biometrics are enabled in your device settings.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Security error: Please ensure you are on a secure (HTTPS) connection and biometric authentication is enabled in your device settings.';
      } else if (error.name === 'InvalidStateError') {
        errorMessage = 'Biometric authentication is already registered or not properly configured. Please remove existing registration and try again.';
      } else if (error.name === 'ConstraintError') {
        errorMessage = 'Your device does not support the required biometric authentication method. Please enable Face ID, Touch ID, or Windows Hello in your device settings.';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Biometric authentication timed out. Please try again and complete the prompt more quickly.';
      }
      
      setMessage(errorMessage);
      setMessageType('error');
      
      // Clean up local registration if server registration failed
      removeFaceIdRegistration();
      setIsRegistered(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFaceId = async () => {
    try {
      setLoading(true);
      
      // Step 1: Remove from server
      const serverResponse = await fetch('/api/faceid/remove', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (serverResponse.ok) {
        // Step 2: Remove local registration
        removeFaceIdRegistration();
        setIsRegistered(false);
        setRegistrationStatus(null);
        setMessage('Face ID removed successfully');
        setMessageType('info');
      } else {
        throw new Error('Failed to remove Face ID registration from server');
      }
    } catch (error) {
      console.error('Error removing Face ID:', error);
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const MessageAlert = ({ message, type }) => {
    if (!message) return null;

    const styles = {
      success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800/40 dark:text-green-300',
      error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800/40 dark:text-red-300',
      info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800/40 dark:text-blue-300',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800/40 dark:text-yellow-300'
    };

    const icons = {
      success: CheckCircle,
      error: XCircle,
      info: Info,
      warning: AlertTriangle
    };

    const Icon = icons[type];

    return (
      <div className={`rounded-xl border p-4 mb-4 ${styles[type]}`}>
        <div className="flex items-start">
          <Icon className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-sm">{message}</p>
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Login Required</h3>
        <p className="text-gray-600">You must be logged in to manage Face ID settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('passkey')}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'passkey'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Key className="h-4 w-4 mr-2" />
          Passkey / Biometric
        </button>
        <button
          onClick={() => setActiveTab('camera')}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'camera'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Camera className="h-4 w-4 mr-2" />
          Camera Face ID
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'passkey' ? (
        /* Passkey Tab Content */
        <div className="space-y-6">
          {/* Status Message */}
          <MessageAlert message={message} type={messageType} />

          {!isSupported ? (
            /* Not Supported */
            <div className="text-center py-6">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Biometric Authentication Not Available
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your device or browser doesn't support Face ID/Touch ID authentication.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/40 rounded-xl p-4 text-left">
                <h5 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">Requirements:</h5>
                <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                  <li>• Device with Face ID, Touch ID, or Windows Hello</li>
                  <li>• Modern browser with WebAuthn support</li>
                  <li>• HTTPS connection (required for security)</li>
                  <li>• Biometric authentication enabled in device settings</li>
                </ul>
              </div>
            </div>
          ) : (
            /* Supported */
            <div className="space-y-6">
              {/* Device Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl p-4">
                  <div className="flex items-center mb-2">
                    <Smartphone className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-medium text-gray-900 dark:text-white">Device Type</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">{deviceInfo?.deviceType || 'Unknown'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl p-4">
                  <div className="flex items-center mb-2">
                    <Scan className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium text-gray-900 dark:text-white">Biometric Type</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">{deviceInfo?.biometricType || 'Not Available'}</p>
                </div>
              </div>

              {/* Registration Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
                <div className="flex items-center">
                  <div className={`h-3 w-3 rounded-full mr-3 ${
                    isRegistered && registrationStatus?.isRegistered ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Passkey Status</span>
                    {registrationStatus?.registeredAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Registered: {new Date(registrationStatus.registeredAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isRegistered && registrationStatus?.isRegistered
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {isRegistered && registrationStatus?.isRegistered ? 'Active' : 'Not Configured'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {!isRegistered || !registrationStatus?.isRegistered ? (
                  <button
                    onClick={handleRegisterFaceId}
                    disabled={loading}
                    className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-3" />
                        Setting up {deviceInfo?.biometricType}...
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5 mr-3" />
                        Set up {deviceInfo?.biometricType} for {user.firstName} {user.lastName}
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-xl">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-300">
                          {deviceInfo?.biometricType} is active for your account
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          You can now use biometric authentication to sign in quickly and securely
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleRemoveFaceId}
                      disabled={loading}
                      className="w-full flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-3" />
                          Removing...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-5 w-5 mr-3" />
                          Remove {deviceInfo?.biometricType}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Important Information */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h5 className="font-medium text-amber-800 dark:text-amber-300 mb-2">What to Expect</h5>
                    <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
                      <li>• <strong>No camera will open</strong> - Uses your device's built-in biometric system</li>
                      <li>• You'll see your device's native biometric prompt (Face ID/Touch ID/Windows Hello)</li>
                      <li>• If you see PIN/password prompts, biometrics may not be properly enabled</li>
                      <li>• Setup takes just a few seconds once biometric prompt appears</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-xl p-4">
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h5 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Security & Privacy</h5>
                    <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                      <li>• Your biometric data never leaves this device</li>
                      <li>• Passkey is linked specifically to your account: <strong>{user.email}</strong></li>
                      <li>• Only cryptographic proofs are shared with our servers</li>
                      <li>• You can remove passkey access at any time</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Camera Tab Content */
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-xl p-4">
            <div className="flex items-start">
              <Camera className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h5 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Camera-Based Face Recognition</h5>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  This option uses your device camera to capture and recognize your face for authentication. 
                  It provides an alternative to passkey-based biometrics.
                </p>
              </div>
            </div>
          </div>
          
          <CameraFaceIdSetup />
        </div>
      )}
    </div>
  );
};

export default FaceIdSettings;