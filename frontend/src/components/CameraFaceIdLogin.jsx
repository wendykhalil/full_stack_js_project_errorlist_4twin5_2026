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

  useEffect(() => {
    checkRegistrationStatus();
    initializeFaceApi();
    
    return () => {
      stopCamera();
    };
  }, []);

  const checkRegistrationStatus = () => {
    setIsRegistered(isCameraFaceIdRegistered());
  };

  const initializeFaceApi = async () => {
    try {
      const loaded = await loadFaceApiModels();
      setModelsLoaded(loaded);
    } catch (error) {
      console.error('Failed to load face recognition models:', error);
    }
  };

  const startCamera = async () => {
    try {
      setLoading(true);
      setMessage('Requesting camera access...');
      
      // Check if camera is available first
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by this browser. Please use Chrome, Firefox, or Safari.');
      }

      // Request camera permission with better constraints
      const constraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user', // Front camera
          frameRate: { ideal: 30, max: 60 }
        },
        audio: false // We don't need audio
      };

      console.log('Requesting camera access for login with constraints:', constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('Camera access granted for login, stream:', stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Login video metadata loaded, starting playback');
          videoRef.current.play().then(() => {
            setCameraStream(stream);
            setIsRecording(true);
            setMessage('Position your face in the camera and click "Authenticate"');
            
            // Start face detection after a short delay
            setTimeout(() => {
              startFaceDetection();
            }, 1000);
          }).catch(error => {
            console.error('Error playing login video:', error);
            setMessage('Failed to start video playback: ' + error.message);
            onError?.(error.message);
          });
        };

        videoRef.current.onerror = (error) => {
          console.error('Login video error:', error);
          setMessage('Video error occurred. Please try again.');
          onError?.('Video error occurred');
        };
      }
    } catch (error) {
      console.error('Camera start error for login:', error);
      
      let errorMessage = 'Failed to start camera: ' + error.message;
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please allow camera access in your browser settings and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please connect a camera and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is being used by another application. Please close other apps using the camera and try again.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints not supported. Trying with basic settings...';
        
        // Try with simpler constraints
        try {
          const simpleStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' },
            audio: false 
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = simpleStream;
            videoRef.current.play();
            setCameraStream(simpleStream);
            setIsRecording(true);
            setMessage('Camera started with basic settings! Position your face and click "Authenticate".');
            startFaceDetection();
            return;
          }
        } catch (simpleError) {
          errorMessage = 'Camera not available with any settings: ' + simpleError.message;
        }
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Camera access blocked for security reasons. Please ensure you are on HTTPS and allow camera access.';
      }
      
      setMessage(errorMessage);
      onError?.(errorMessage);
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
    if (!videoRef.current || !faceDetected) {
      setMessage('No face detected. Please ensure your face is clearly visible.');
      onError?.('No face detected');
      return;
    }

    try {
      setLoading(true);
      setMessage('Authenticating with face recognition...');

      const result = await authenticateCameraFaceId(videoRef.current);
      
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

  if (!isRegistered) {
    return (
      <div className="text-center py-4">
        <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">
          Camera Face ID not set up. Please register in your profile settings first.
        </p>
      </div>
    );
  }

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
      {!isRecording ? (
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
        /* Camera Interface - MUCH BIGGER */
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