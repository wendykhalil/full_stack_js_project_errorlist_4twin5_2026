import React, { useState, useEffect } from 'react';
import { Scan, Shield, Smartphone, AlertCircle, CheckCircle } from 'lucide-react';
import { 
  isFaceIdSupported, 
  isPlatformAuthenticatorAvailable, 
  authenticateWithFaceId, 
  isFaceIdRegistered,
  getFaceIdDeviceInfo 
} from '../services/faceIdAuth';

const FaceIdLogin = ({ onSuccess, onError, disabled = false }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    checkFaceIdSupport();
  }, []);

  const checkFaceIdSupport = async () => {
    try {
      const supported = isFaceIdSupported();
      const platformAvailable = await isPlatformAuthenticatorAvailable();
      const registered = isFaceIdRegistered();
      const info = getFaceIdDeviceInfo();

      setIsSupported(supported && platformAvailable);
      setIsRegistered(registered);
      setDeviceInfo(info);
    } catch (error) {
      console.error('Error checking Face ID support:', error);
      setIsSupported(false);
    }
  };

  const handleFaceIdLogin = async () => {
    if (!isSupported) {
      onError?.('Face ID is not supported on this device');
      return;
    }

    if (!isRegistered) {
      onError?.('Face ID is not registered. Please log in with your email/password first, then set up Face ID in your profile settings.');
      return;
    }

    try {
      setIsAuthenticating(true);
      const result = await authenticateWithFaceId();
      
      if (result.success) {
        // Pass the complete result (user, token) to parent
        onSuccess?.(result);
      } else {
        onError?.('Face ID authentication failed');
      }
    } catch (error) {
      console.error('Face ID authentication error:', error);
      onError?.(error.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const FaceIdSetupModal = () => {
    if (!showSetup) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Set up {deviceInfo?.biometricType}
            </h3>
            <p className="text-gray-600 mb-6">
              To use {deviceInfo?.biometricType} for login, you need to register it first. 
              This is a one-time setup that will make future logins faster and more secure.
            </p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm text-amber-800 font-medium">Demo Mode</p>
                  <p className="text-xs text-amber-700 mt-1">
                    This is a demonstration. In production, Face ID registration would be done after account creation.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSetup(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Maybe Later
              </button>
              <button
                onClick={() => {
                  setShowSetup(false);
                  // In production, redirect to Face ID setup flow
                  onError?.('Face ID setup not available in demo mode. Please use email/password login.');
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Set Up Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isSupported) {
    return null; // Don't show Face ID option if not supported
  }

  return (
    <>
      <button
        type="button"
        onClick={handleFaceIdLogin}
        disabled={disabled || isAuthenticating}
        className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAuthenticating ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span>Authenticating...</span>
          </>
        ) : (
          <>
            <div className="relative">
              <Scan className="h-5 w-5" />
              {isRegistered && (
                <CheckCircle className="absolute -top-1 -right-1 h-3 w-3 text-green-500 bg-white rounded-full" />
              )}
            </div>
            <span>
              {isRegistered 
                ? `Sign in with ${deviceInfo?.biometricType || 'Face ID'}`
                : `Set up ${deviceInfo?.biometricType || 'Face ID'}`
              }
            </span>
            <Smartphone className="h-4 w-4 text-slate-400" />
          </>
        )}
      </button>

      <FaceIdSetupModal />
    </>
  );
};

export default FaceIdLogin;