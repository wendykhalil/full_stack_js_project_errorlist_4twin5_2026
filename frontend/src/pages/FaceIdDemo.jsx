import React, { useState, useEffect } from 'react';
import { 
  Scan, 
  Shield, 
  Smartphone, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Info,
  Settings,
  Trash2,
  BarChart3
} from 'lucide-react';
import { 
  isFaceIdSupported, 
  isPlatformAuthenticatorAvailable, 
  registerFaceId, 
  authenticateWithFaceId, 
  isFaceIdRegistered,
  removeFaceIdRegistration,
  getFaceIdDeviceInfo 
} from '../services/faceIdAuth';

const FaceIdDemo = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info'); // info, success, error

  useEffect(() => {
    checkFaceIdCapabilities();
  }, []);

  const checkFaceIdCapabilities = async () => {
    try {
      const supported = isFaceIdSupported();
      const platformAvailable = await isPlatformAuthenticatorAvailable();
      const registered = isFaceIdRegistered();
      const info = getFaceIdDeviceInfo();

      setIsSupported(supported && platformAvailable);
      setIsRegistered(registered);
      setDeviceInfo(info);

      if (!supported) {
        setMessage('WebAuthn is not supported in this browser');
        setMessageType('error');
      } else if (!platformAvailable) {
        setMessage('Platform authenticator (Face ID/Touch ID) is not available');
        setMessageType('error');
      } else {
        setMessage('Face ID is supported and ready to use!');
        setMessageType('success');
      }
    } catch (error) {
      console.error('Error checking Face ID capabilities:', error);
      setMessage('Error checking Face ID capabilities');
      setMessageType('error');
    }
  };

  const handleRegisterFaceId = async () => {
    try {
      setLoading(true);
      setMessage('');

      const result = await registerFaceId('demo_user_123', 'demo@bmp.tn');
      
      if (result.success) {
        setIsRegistered(true);
        setMessage('Face ID registered successfully! You can now use it to authenticate.');
        setMessageType('success');
      }
    } catch (error) {
      console.error('Face ID registration error:', error);
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticateWithFaceId = async () => {
    try {
      setLoading(true);
      setMessage('');

      const result = await authenticateWithFaceId();
      
      if (result.success) {
        setMessage(`Authentication successful! Welcome back, User ${result.userId}`);
        setMessageType('success');
      }
    } catch (error) {
      console.error('Face ID authentication error:', error);
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFaceId = async () => {
    try {
      setLoading(true);
      removeFaceIdRegistration();
      setIsRegistered(false);
      setMessage('Face ID registration removed successfully');
      setMessageType('info');
    } catch (error) {
      setMessage('Error removing Face ID registration');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const MessageAlert = ({ message, type }) => {
    if (!message) return null;

    const styles = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
    };

    const icons = {
      success: CheckCircle,
      error: XCircle,
      info: Info,
      warning: AlertTriangle
    };

    const Icon = icons[type];

    return (
      <div className={`rounded-lg border p-4 ${styles[type]}`}>
        <div className="flex items-start">
          <Icon className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-sm">{message}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
            <Scan className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔐 Face ID Authentication Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience the future of secure authentication with biometric login using WebAuthn API
          </p>
        </div>

        {/* Device Info Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center mb-6">
            <Smartphone className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-900">Device Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Device Type</h3>
              <p className="text-gray-600">{deviceInfo?.deviceType || 'Unknown'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Biometric Type</h3>
              <p className="text-gray-600">{deviceInfo?.biometricType || 'Not Available'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">WebAuthn Support</h3>
              <div className="flex items-center">
                {isSupported ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-green-600">Supported</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-red-600">Not Supported</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div className="mb-8">
          <MessageAlert message={message} type={messageType} />
        </div>

        {/* Main Demo Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center mb-6">
            <Shield className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-900">Face ID Demo</h2>
          </div>

          {!isSupported ? (
            <div className="text-center py-12">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Face ID Not Available
              </h3>
              <p className="text-gray-600 mb-6">
                Your device or browser doesn't support biometric authentication.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                <h4 className="font-medium text-yellow-800 mb-2">Requirements:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Modern browser with WebAuthn support</li>
                  <li>• Device with Face ID, Touch ID, or Windows Hello</li>
                  <li>• HTTPS connection (required for WebAuthn)</li>
                  <li>• Biometric authentication enabled in device settings</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Registration Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`h-3 w-3 rounded-full mr-3 ${isRegistered ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="font-medium text-gray-900">
                    Face ID Registration Status
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isRegistered 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {isRegistered ? 'Registered' : 'Not Registered'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isRegistered ? (
                  <button
                    onClick={handleRegisterFaceId}
                    disabled={loading}
                    className="flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-3" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <Settings className="h-5 w-5 mr-3" />
                        Register Face ID
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleAuthenticateWithFaceId}
                      disabled={loading}
                      className="flex items-center justify-center px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-3" />
                          Authenticating...
                        </>
                      ) : (
                        <>
                          <Scan className="h-5 w-5 mr-3" />
                          Authenticate with Face ID
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={handleRemoveFaceId}
                      disabled={loading}
                      className="flex items-center justify-center px-6 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-5 w-5 mr-3" />
                      Remove Registration
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center mb-6">
            <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-900">How Face ID Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Registration</h3>
              <p className="text-gray-600 text-sm">
                Create a unique biometric credential using your device's secure enclave
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Scan className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Authentication</h3>
              <p className="text-gray-600 text-sm">
                Use Face ID or Touch ID to prove your identity without passwords
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Security</h3>
              <p className="text-gray-600 text-sm">
                Biometric data never leaves your device - only cryptographic proofs are shared
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">🔒 Security Benefits</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Phishing resistant:</strong> Cannot be stolen or replicated</li>
              <li>• <strong>Privacy focused:</strong> Biometric data stays on your device</li>
              <li>• <strong>Convenient:</strong> No passwords to remember or type</li>
              <li>• <strong>Fast:</strong> Authenticate in under 2 seconds</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p className="text-sm">
            This demo uses the WebAuthn API for secure biometric authentication.
            <br />
            Compatible with Face ID, Touch ID, Windows Hello, and other platform authenticators.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FaceIdDemo;