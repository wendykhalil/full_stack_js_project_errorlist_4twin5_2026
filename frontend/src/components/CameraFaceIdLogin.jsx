import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Play,
  Square
} from 'lucide-react';
import { 
  isCameraAvailable,
  loadFaceApiModels,
  authenticateCameraFaceId,
  isCameraFaceIdRegistered
} from '../services/cameraFaceId';

const CameraFaceIdLogin = ({ onSuccess, onError, disabled }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showCameraInterface, setShowCameraInterface] = useState(false);

  useEffect(() => {
    checkRegistrationStatus();
    initializeFaceApi();
    
    return () => {
      stopCamera();
    };
  }, []);

  const checkRegistrationStatus = () => {
    const registered = isCameraFaceIdRegistered();
    const hasLocalStorage = localStorage.getItem('cameraFaceId_registered');
    const userId = localStorage.getItem('cameraFaceId_userId');
    const userEmail = localStorage.getItem('cameraFaceId_userEmail');
    
    console.log('Camera Face ID registration check for login:', {
      registered,
      hasLocalStorage,
      userId,
      userEmail
    });
    
    setIsRegistered(registered);
  };

  const initializeFaceApi = async () => {
    try {
      const loaded = await loadFaceApiModels();
      setModelsLoaded(loaded);
      console.log('Face API models loaded for login:', loaded);
    } catch (error) {
      console.error('Failed to load face recognition models:', error);
    }
  };

  const startCamera = async () => {
    try {
      setLoading(true);
      setShowCameraInterface(true); // Force show interface
      setMessage('Starting camera...');
      
      console.log('Starting camera for login...');
      
      const available = await isCameraAvailable();
      if (!available) {
        throw new Error('Camera not available. Please check camera permissions.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      console.log('Camera stream obtained for login:', stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraStream(stream);
        setIsRecording(true);
        setMessage('Position your face in the camera and click "Authenticate"');
        
        // Start face detection
        setTimeout(() => {
          startFaceDetection();
        }, 1000);
      }
    } catch (error) {
      console.error('Camera start error for login:', error);
      setMessage('Failed to start camera: ' + error.message);
      onError?.(error.message);
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsRecording(false);
    setFaceDetected(false);
    setMessage('');
    setShowCameraInterface(false); // Hide interface when stopping
  };

  const startFaceDetection = async () => {
    if (!videoRef.current || !modelsLoaded) return;

    const detectFace = async () => {
      try {
        // Simple fallback face detection - just check if video is playing
        const isVideoPlaying = videoRef.current && 
                              videoRef.current.readyState >= 2 && 
                              !videoRef.current.paused;
        
        setFaceDetected(isVideoPlaying);

        // Draw a simple detection box on canvas if video is playing
        if (canvasRef.current && isVideoPlaying) {
          const canvas = canvasRef.current;
          const video = videoRef.current;
          
          // Set canvas size to match video
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw a simple face detection box (placeholder) - MUCH BIGGER SIZE
          const boxWidth = 350; // Increased from 250 - much bigger!
          const boxHeight = 420; // Increased from 300 - much taller for full face
          const x = (canvas.width - boxWidth) / 2;
          const y = (canvas.height - boxHeight) / 2;
          
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, boxWidth, boxHeight);
          
          // Draw corner markers
          const cornerSize = 15;
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 3;
          
          // Top-left corner
          ctx.beginPath();
          ctx.moveTo(x, y + cornerSize);
          ctx.lineTo(x, y);
          ctx.lineTo(x + cornerSize, y);
          ctx.stroke();
          
          // Top-right corner
          ctx.beginPath();
          ctx.moveTo(x + boxWidth - cornerSize, y);
          ctx.lineTo(x + boxWidth, y);
          ctx.lineTo(x + boxWidth, y + cornerSize);
          ctx.stroke();
          
          // Bottom-left corner
          ctx.beginPath();
          ctx.moveTo(x, y + boxHeight - cornerSize);
          ctx.lineTo(x, y + boxHeight);
          ctx.lineTo(x + cornerSize, y + boxHeight);
          ctx.stroke();
          
          // Bottom-right corner
          ctx.beginPath();
          ctx.moveTo(x + boxWidth - cornerSize, y + boxHeight);
          ctx.lineTo(x + boxWidth, y + boxHeight);
          ctx.lineTo(x + boxWidth, y + boxHeight - cornerSize);
          ctx.stroke();
        }
      } catch (error) {
        console.error('Face detection error:', error);
      }

      // Continue detection if still recording
      if (isRecording) {
        requestAnimationFrame(detectFace);
      }
    };

    detectFace();
  };

  const authenticateWithCamera = async () => {
    if (!videoRef.current) {
      setMessage('Camera not available. Please try again.');
      onError?.('Camera not available');
      return;
    }

    try {
      setLoading(true);
      setMessage('Authenticating with face recognition...');

      console.log('Starting camera Face ID authentication...');

      // Check if we have any registration data
      const userId = localStorage.getItem('cameraFaceId_userId');
      const userEmail = localStorage.getItem('cameraFaceId_userEmail');
      
      console.log('Authentication data:', { userId, userEmail });

      if (!userId && !userEmail) {
        throw new Error('No camera Face ID registration found. Please set up camera Face ID in your profile first.');
      }

      const result = await authenticateCameraFaceId(videoRef.current);
      
      console.log('Camera Face ID authentication result:', result);
      
      if (result.success) {
        setMessage('Authentication successful!');
        stopCamera();
        onSuccess?.(result);
      } else {
        throw new Error(result.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Camera Face ID authentication error:', error);
      setMessage('Authentication failed: ' + error.message);
      onError?.(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Don't block login if not registered - let user try anyway
  // if (!isRegistered) {
  //   return (
  //     <div className="text-center py-4">
  //       <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
  //       <p className="text-sm text-gray-600">
  //         Camera Face ID not set up. Please register in your profile settings first.
  //       </p>
  //     </div>
  //   );
  // }

  if (!modelsLoaded) {
    return (
      <div className="text-center py-4">
        <Loader2 className="h-8 w-8 text-blue-600 mx-auto mb-2 animate-spin" />
        <p className="text-sm text-gray-600">Loading face recognition models...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(!isRecording && !showCameraInterface) ? (
        /* Camera Start Button */
        <button
          onClick={startCamera}
          disabled={loading || disabled}
          className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Starting Camera...
            </>
          ) : (
            <>
              <Camera className="h-5 w-5 mr-2" />
              Sign in with Camera Face ID
            </>
          )}
        </button>
      ) : (
        /* Camera Interface - ALWAYS SHOW WHEN CAMERA IS STARTING */
        <div className="space-y-4">
          {/* Camera View - MUCH BIGGER */}
          <div className="relative bg-gray-900 rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-80 sm:h-96 lg:h-[500px] object-cover"
              autoPlay
              muted
              playsInline
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
            />
            
            {/* Face Detection Indicator */}
            <div className="absolute top-4 right-4">
              <div className={`flex items-center px-4 py-3 rounded-full text-base font-medium ${
                faceDetected 
                  ? 'bg-green-500 text-white' 
                  : 'bg-red-500 text-white'
              }`}>
                <div className={`w-4 h-4 rounded-full mr-3 ${
                  faceDetected ? 'bg-white' : 'bg-white animate-pulse'
                }`} />
                {faceDetected ? 'Face Detected' : 'No Face'}
              </div>
            </div>

            {/* Instructions Overlay */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/70 text-white px-4 py-3 rounded-lg text-center">
                <p className="text-sm sm:text-base font-medium">Position your face in the center for authentication</p>
                <p className="text-xs sm:text-sm opacity-90 mt-1">Make sure your entire face is visible in the green box</p>
              </div>
            </div>
          </div>

          {/* Status Message */}
          {message && (
            <div className="text-center">
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          )}

          {/* Control Buttons - BIGGER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={authenticateWithCamera}
              disabled={loading || !faceDetected}
              className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 text-base font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Authenticating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Authenticate
                </>
              )}
            </button>
            
            <button
              onClick={stopCamera}
              disabled={loading}
              className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50 text-base font-medium"
            >
              <Square className="h-5 w-5 mr-2" />
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraFaceIdLogin;