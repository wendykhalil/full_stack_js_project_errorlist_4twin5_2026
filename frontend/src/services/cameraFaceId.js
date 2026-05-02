/**
 * Camera-based Face ID Service
 *
 * Uses @vladmandic/face-api installed as a proper npm package.
 * No window.faceapi, no CDN script tag, no Math.random fallback.
 *
 * Backend: CPU (via @tensorflow/tfjs-backend-cpu) — works on every device
 * regardless of WebGL or WASM support. WebGL is faster but unavailable in
 * many environments (VMs, some browsers, hardware acceleration disabled).
 * 
 * ✅ OPTIMIZED: Lazy imports to prevent TensorFlow from loading on page load
 */

// ✅ DO NOT import TensorFlow or face-api at the top level!
// This causes immediate initialization and duplicate kernel registration
// Instead, we'll import them dynamically when needed

// ── Model loading ─────────────────────────────────────────────────────────────

let _modelsLoaded = false;
let _loadPromise = null;
let _faceapi = null; // ✅ Store face-api reference after dynamic import
let _tf = null; // ✅ Store TensorFlow reference after dynamic import

const LOCAL_MODEL_URL = '/models';
const CDN_MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/model';

const isLocalModelAvailable = async () => {
  try {
    const res = await fetch(
      `${LOCAL_MODEL_URL}/tiny_face_detector_model-weights_manifest.json`,
      { method: 'HEAD' }
    );
    return res.ok;
  } catch {
    return false;
  }
};

// ✅ Lazy load TensorFlow and face-api ONLY when needed
const loadLibraries = async () => {
  if (_faceapi && _tf) return { faceapi: _faceapi, tf: _tf };
  
  try {
    // Dynamic imports - only loaded when this function is called
    const [faceapiModule, tfModule] = await Promise.all([
      import('@vladmandic/face-api'),
      import('@tensorflow/tfjs-backend-cpu')
    ]);
    
    _faceapi = faceapiModule;
    _tf = faceapiModule.tf;
    
    return { faceapi: _faceapi, tf: _tf };
  } catch (error) {
    console.error('[FaceID] Failed to load libraries:', error);
    throw new Error('Failed to load Face ID libraries');
  }
};

export const loadFaceApiModels = async () => {
  if (_modelsLoaded) return true;
  if (_loadPromise) return _loadPromise;

  _loadPromise = (async () => {
    // ✅ Step 1: Load libraries dynamically
    const { faceapi, tf } = await loadLibraries();
    
    // ✅ Step 2: Initialize TensorFlow backend explicitly (ONLY ONCE)
    try {
      if (tf && !tf.getBackend()) {
        await tf.setBackend('cpu');
        await tf.ready();
        console.log('[FaceID] TF backend:', tf.getBackend());
      } else if (tf) {
        console.log('[FaceID] TF backend already initialized:', tf.getBackend());
      }
    } catch (backendErr) {
      console.warn('[FaceID] Could not set CPU backend explicitly:', backendErr.message);
      // Continue anyway — face-api may still work
    }

    // ✅ Step 3: Probe local model files
    const useLocal = await isLocalModelAvailable();
    const modelUrl = useLocal ? LOCAL_MODEL_URL : CDN_MODEL_URL;
    console.log(`Loading models from ${modelUrl}`);

    // ✅ Step 4: Load with timeout
    const withTimeout = (promise, ms, label) =>
      Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`Délai dépassé (${label}). Rechargez la page.`)),
            ms
          )
        ),
      ]);

    try {
      await withTimeout(
        Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
          faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl),
        ]),
        30_000,
        useLocal ? 'local' : 'CDN'
      );
      _modelsLoaded = true;
      console.log('Models loaded successfully');
      return true;
    } catch (err) {
      _loadPromise = null;

      const msg = err.message.includes('Délai')
        ? err.message
        : err.message.includes('404') || err.message.includes('not found')
          ? `Fichiers de modèles introuvables (${modelUrl}). Vérifiez que public/models contient les fichiers face-api.`
          : err.message.includes('NetworkError') || err.message.includes('Failed to fetch')
            ? 'Erreur réseau lors du chargement des modèles. Vérifiez votre connexion internet.'
            : `Échec du chargement des modèles Face ID : ${err.message}`;

      console.error('[FaceID] Model load failed:', err);
      throw new Error(msg);
    }
  })();

  return _loadPromise;
};

export const areModelsLoaded = () => _modelsLoaded;

// ── Static info (used by FaceIdSettings for display purposes) ─────────────────

export const getCameraFaceIdInfo = () => ({
  isSupported: true,
  type: 'Camera Face Recognition',
  description: 'Uses your device camera to capture and recognize your face',
  requirements: ['Device camera access', 'Good lighting conditions', 'Clear view of your face'],
});

// ── Camera availability ───────────────────────────────────────────────────────

export const isCameraAvailable = async () => {
  try {
    if (!navigator.mediaDevices?.getUserMedia) return false;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(t => t.stop());
    return true;
  } catch {
    return false;
  }
};

// ── Face detection (real, used for the setup overlay) ────────────────────────

/**
 * Detect a face in the current video frame.
 * Returns the detection object or null if no face found.
 */
export const detectFaceInFrame = async (videoElement) => {
  if (!_modelsLoaded || !_faceapi) return null;
  try {
    return await _faceapi
      .detectSingleFace(videoElement, new _faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
      .withFaceLandmarks();
  } catch {
    return null;
  }
};

// ── Face capture ──────────────────────────────────────────────────────────────

/**
 * Capture a face descriptor from the video element.
 * Throws with a precise message on every failure mode.
 */
export const captureFaceData = async (videoElement) => {
  if (!_modelsLoaded || !_faceapi) {
    throw new Error('Modèles non chargés. Attendez le chargement complet avant de capturer.');
  }
  if (!videoElement || videoElement.readyState < 2) {
    throw new Error('Caméra non initialisée. Démarrez la caméra et réessayez.');
  }

  const detection = await _faceapi
    .detectSingleFace(
      videoElement,
      new _faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 })
    )
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    throw new Error('Aucun visage détecté. Assurez-vous que votre visage est bien visible et bien éclairé.');
  }

  if (detection.detection.score < 0.5) {
    throw new Error(`Confiance de détection trop faible (${(detection.detection.score * 100).toFixed(0)}%). Améliorez l'éclairage.`);
  }

  return {
    // Float32Array → plain JS array so it serialises cleanly to JSON
    descriptor: Array.from(detection.descriptor),
    landmarks: detection.landmarks.positions.map(p => ({ x: p.x, y: p.y })),
    score: detection.detection.score,
  };
};

// ── Registration ──────────────────────────────────────────────────────────────

export const registerCameraFaceId = async (userId, userEmail, faceData) => {
  const token = localStorage.getItem('bmptn_token');
  if (!token) throw new Error('Session expirée. Veuillez vous reconnecter.');

  const res = await fetch('/api/camera-faceid/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      faceDescriptor: faceData.descriptor,
      landmarks: faceData.landmarks || [],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erreur serveur' }));
    throw new Error(err.message || "Échec de l'enregistrement du Face ID.");
  }

  // Store only the email — never userId — so lookup works after logout
  localStorage.setItem('cameraFaceId_registered', 'true');
  localStorage.setItem('cameraFaceId_userEmail', userEmail || '');

  return { success: true };
};

// ── Authentication ────────────────────────────────────────────────────────────

/**
 * @param {HTMLVideoElement} videoElement
 * @param {string} userEmail  — the email the user typed on the login form
 */
export const authenticateCameraFaceId = async (videoElement, userEmail) => {
  if (!userEmail?.trim()) {
    throw new Error("Saisissez votre adresse email avant d'utiliser la reconnaissance faciale.");
  }

  // captureFaceData already throws precise errors
  const faceData = await captureFaceData(videoElement);

  const res = await fetch('/api/camera-faceid/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      faceDescriptor: faceData.descriptor,
      userEmail: userEmail.trim().toLowerCase(),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erreur serveur' }));
    throw new Error(err.message || "Échec de l'authentification par reconnaissance faciale.");
  }

  return res.json();
};

// ── Registration status ───────────────────────────────────────────────────────

/** Server-authoritative check — use for setup page */
export const checkCameraFaceIdStatus = async () => {
  const token = localStorage.getItem('bmptn_token');
  if (!token) return false;
  try {
    const res = await fetch('/api/camera-faceid/status', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.isRegistered);
  } catch {
    return false;
  }
};

/** Fast local hint — use only for UI, not for auth decisions */
export const isCameraFaceIdRegistered = () =>
  localStorage.getItem('cameraFaceId_registered') === 'true';

// ── Removal ───────────────────────────────────────────────────────────────────

export const removeCameraFaceIdRegistration = async () => {
  const token = localStorage.getItem('bmptn_token');
  try {
    const res = await fetch('/api/camera-faceid/remove', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      localStorage.removeItem('cameraFaceId_registered');
      localStorage.removeItem('cameraFaceId_userEmail');
    }
    return res.ok;
  } catch {
    return false;
  }
};

// ── Similarity (UI display only) ──────────────────────────────────────────────

export const calculateFaceSimilarity = (d1, d2) => {
  if (!d1 || !d2 || d1.length !== d2.length) return 0;
  let sum = 0;
  for (let i = 0; i < d1.length; i++) sum += (d1[i] - d2[i]) ** 2;
  return Math.max(0, 1 - Math.sqrt(sum) / 2);
};
