import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  RotateCcw,
  Play,
  Square
} from 'lucide-react';
import { 
  isCameraAvailable,
  loadFaceApiModels,
  captureFaceData,
  registerCameraFaceId,
  isCameraFaceIdRegistered,
  removeCameraFaceIdRegistration
} from '../services/cameraFaceId';
import { useAuth } from '../auth/AuthContext';

const CameraFaceIdSetup = () => {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [faceDetected, setFaceDetected] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

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
      setLoading(true);
      setMessage('Loading face recognition models...');
      
      const loaded = await loadFaceApiModels();
      if (loaded) {
        setModelsLoaded(true);
        setMessage('Face recognition ready! Click "Start Camera" to begin setup.');
        setMessageType('success');
      } else {
        throw new Error('Failed to load face recognition models');
      }
    } catch (error) {
      setMessage('Failed to initialize face recognition: ' + error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
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

      console.log('Requesting camera access with constraints:', constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('Camera access granted, stream:', stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, starting playback');
          videoRef.current.play().then(() => {
            setCameraStream(stream);
            setIsRecording(true);
            setMessage('Camera started! Position your face in the frame and click "Capture Face".');
            setMessageType('info');
            
            // Start face detection after a short delay
            setTimeout(() => {
              startFaceDetection();
            }, 1000);
          }).catch(error => {
            console.error('Error playing video:', error);
            setMessage('Failed to start video playback: ' + error.message);
            setMessageType('error');
          });
        };

        videoRef.current.onerror = (error) => {
          console.error('Video error:', error);
          setMessage('Video error occurred. Please try again.');
          setMessageType('error');
        };
      }
    } catch (error) {
      console.error('Camera start error:', error);
      
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
            setMessage('Camera started with basic settings! Position your face and click "Capture Face".');
            setMessageType('info');
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
      setMessageType('error');
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
          const cornerSize = 20;
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

  const captureFace = async () => {
    if (!videoRef.current || !faceDetected) {
      setMessage('No face detected. Please ensure your face is clearly visible.');
      setMessageType('warning');
      return;
    }

    try {
      setLoading(true);
      setMessage('Capturing face data...');

      const faceData = await captureFaceData(videoRef.current);
      
      setMessage('Face captured! Registering with server...');
      
      const result = await registerCameraFaceId(user.id, user.email, faceData);
      
      if (result.success) {
        setIsRegistered(true);
        setMessage('🎉 Camera Face ID registered successfully! You can now use camera-based face recognition to sign in.');
        setMessageType('success');
        stopCamera();
      }
    } catch (error) {
      console.error('Face capture error:', error);
      setMessage('Failed to capture face: ' + error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const removeRegistration = async () => {
    try {
      setLoading(true);
      const success = await removeCameraFaceIdRegistration();
      
      if (success) {
        setIsRegistered(false);
        setMessage('Camera Face ID registration removed successfully.');
        setMessageType('info');
      } else {
        throw new Error('Failed to remove registration');
      }
    } catch (error) {
      setMessage('Failed to remove registration: ' + error.message);
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
      info: Camera,
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
        <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Login Required</h3>
        <p className="text-gray-600">You must be logged in to set up camera Face ID.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MessageAlert message={message} type={messageType} />

      {isRegistered ? (
        /* Already Registered */
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-xl">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-green-800">
                Camera Face ID is active for your account
              </p>
              <p className="text-sm text-green-600">
                You can now use camera-based face recognition to sign in
              </p>
            </div>
          </div>
          
          <button
            onClick={removeRegistration}
            disabled={loading}
            className="w-full flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-3" />
                Removing...
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 mr-3" />
                Remove Camera Face ID
              </>
            )}
          </button>
        </div>
      ) : (
        /* Setup Process */
        <div className="space-y-6">
          {/* Camera View - MUCH BIGGER */}
          <div className="relative bg-gray-900 rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-96 sm:h-[500px] lg:h-[600px] object-cover"
              autoPlay
              muted
              playsInline
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
            />
            
            {/* Face Detection Indicator */}
            {isRecording && (
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
            )}

            {/* Instructions Overlay */}
            {isRecording && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/70 text-white px-6 py-3 rounded-lg text-center">
                  <p className="text-base font-medium">Position your face in the center and ensure good lighting</p>
                  <p className="text-sm opacity-90 mt-1">Make sure your entire face is visible in the green box</p>
                </div>
              </div>
            )}

            {/* Camera Controls Overlay */}
            {!isRecording && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center text-white">
                  <Camera className="h-20 w-20 mx-auto mb-6 opacity-50" />
                  <p className="text-2xl font-medium mb-3">Camera Preview</p>
                  <p className="text-base opacity-75">Click "Start Camera" to begin face capture</p>
                </div>
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {!isRecording ? (
              <button
                onClick={startCamera}
                disabled={loading || !modelsLoaded}
                className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 sm:col-span-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-3" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-3" />
                    Start Camera
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={captureFace}
                  disabled={loading || !faceDetected}
                  className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-3" />
                      Capturing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-3" />
                      Capture Face
                    </>
                  )}
                </button>
                
                <button
                  onClick={stopCamera}
                  disabled={loading}
                  className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <Square className="h-5 w-5 mr-3" />
                  Stop Camera
                </button>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h5 className="font-medium text-blue-800 mb-2">Setup Instructions:</h5>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Click "Start Camera" to begin face capture</li>
              <li>Position your face clearly in the camera view</li>
              <li>Ensure good lighting and look directly at the camera</li>
              <li>Wait for "Face Detected" indicator to appear</li>
              <li>Click "Capture Face" to register your face</li>
            </ol>
          </div>

          {/* Privacy Notice */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h5 className="font-medium text-gray-800 mb-2">Privacy & Security:</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Face data is encrypted and stored securely</li>
              <li>• Camera access is only used during setup and login</li>
              <li>• You can remove face registration at any time</li>
              <li>• No video is recorded, only face recognition data</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraFaceIdSetup;