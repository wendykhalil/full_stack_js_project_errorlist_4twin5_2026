import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CheckCircle, XCircle, AlertTriangle, Loader2, Square } from 'lucide-react';
import {
  isCameraAvailable,
  loadFaceApiModels,
  authenticateCameraFaceId,
} from '../services/cameraFaceId';

/**
 * CameraFaceIdLogin
 *
 * Props:
 *   onSuccess(result)  — called with the server response on successful auth
 *   onError(message)   — called with a string error message
 *   disabled           — disables the button while parent is loading
 *   userEmail          — REQUIRED: the email the user typed in the login form,
 *                        used to look up the stored face descriptor on the server
 */
const CameraFaceIdLogin = ({ onSuccess, onError, disabled, userEmail }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  const [phase, setPhase] = useState('idle'); // idle | starting | ready | authenticating | error
  const [modelsReady, setModelsReady] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [videoPlaying, setVideoPlaying] = useState(false);

  // ── Camera helpers — defined BEFORE the useEffect that uses them in cleanup ──
  const stopCamera = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setVideoPlaying(false);
    setPhase('idle');
    setMessage('');
  }, []);

  // ── Load models on mount ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setModelsLoading(true);
    loadFaceApiModels()
      .then(() => {
        if (!cancelled) {
          setModelsReady(true);
          setModelsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setModelsReady(false);
          setModelsLoading(false);
          setMessage(
            err?.message?.includes('connexion')
              ? err.message
              : 'Impossible de charger les modèles Face ID. Vérifiez votre connexion et rechargez la page.'
          );
        }
      });
    return () => { cancelled = true; stopCamera(); };
  }, [stopCamera]);

  const drawOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || video.readyState < 2) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bw = Math.min(320, canvas.width * 0.7);
    const bh = bw * 1.2;
    const x = (canvas.width - bw) / 2;
    const y = (canvas.height - bh) / 2;
    const cs = 18;

    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2.5;
    [
      [x, y + cs, x, y, x + cs, y],
      [x + bw - cs, y, x + bw, y, x + bw, y + cs],
      [x, y + bh - cs, x, y + bh, x + cs, y + bh],
      [x + bw - cs, y + bh, x + bw, y + bh, x + bw, y + bh - cs],
    ].forEach(([x1, y1, x2, y2, x3, y3]) => {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.stroke();
    });

    rafRef.current = requestAnimationFrame(drawOverlay);
  }, []);

  const startCamera = async () => {
    if (!modelsReady) {
      setMessage('Les modèles de reconnaissance faciale ne sont pas chargés.');
      return;
    }
    if (!userEmail?.trim()) {
      setMessage('Veuillez d\'abord saisir votre adresse email dans le formulaire.');
      onError?.('Email requis pour la reconnaissance faciale.');
      return;
    }

    setPhase('starting');
    setMessage('Démarrage de la caméra…');

    try {
      const available = await isCameraAvailable();
      if (!available) throw new Error('Caméra non disponible. Vérifiez les permissions.');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setVideoPlaying(true);
        setPhase('ready');
        setMessage('Positionnez votre visage dans le cadre et cliquez sur "Authentifier".');
        drawOverlay();
      }
    } catch (err) {
      setPhase('error');
      const msg = err.name === 'NotAllowedError'
        ? 'Accès caméra refusé. Autorisez la caméra dans les paramètres du navigateur.'
        : err.message;
      setMessage(msg);
      onError?.(msg);
    }
  };

  const authenticate = async () => {
    if (!videoRef.current) return;
    setPhase('authenticating');
    setMessage('Reconnaissance en cours…');

    try {
      const result = await authenticateCameraFaceId(videoRef.current, userEmail);
      if (result.success) {
        setMessage('Authentification réussie !');
        stopCamera();
        onSuccess?.(result);
      } else {
        throw new Error(result.message || 'Échec de l\'authentification.');
      }
    } catch (err) {
      // Distinguish error types for better UX
      const msg = err.message || 'Reconnaissance faciale échouée.';
      setPhase('error');
      setMessage(msg);
      onError?.(msg);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  // Derive button state from all possible phases — button is ALWAYS rendered
  const isModelLoading = modelsLoading;
  const isModelFailed  = !modelsLoading && !modelsReady;
  const isCameraActive = phase === 'starting' || phase === 'ready' || phase === 'authenticating';

  const buttonDisabled =
    disabled ||
    isModelLoading ||
    isModelFailed ||
    phase === 'starting' ||
    phase === 'authenticating';

  const buttonIcon = isModelLoading || phase === 'starting'
    ? <Loader2 className="h-4 w-4 animate-spin" />
    : isModelFailed
      ? <AlertTriangle className="h-4 w-4" />
      : <Camera className="h-4 w-4" />;

  const buttonLabel = isModelLoading
    ? 'Chargement…'
    : isModelFailed
      ? 'Face ID indisponible'
      : phase === 'starting'
        ? 'Démarrage…'
        : 'Se connecter avec la caméra';

  const buttonClass = `inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
    isModelFailed
      ? 'border-slate-200 bg-slate-50 text-slate-400'
      : 'border-slate-200 bg-white text-slate-700 hover:border-green-300 hover:bg-green-50 hover:text-green-700'
  }`;

  return (
    <div className="space-y-2">
      {/* Error message — shown above button, never replaces it */}
      {phase === 'error' && message && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Model load failure hint — shown above button, never replaces it */}
      {isModelFailed && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{message || 'Modèles non chargés. Vérifiez votre connexion et rechargez la page.'}</span>
        </div>
      )}

      {/* ── The button is ALWAYS rendered in all states ── */}
      {!isCameraActive && (
        <button
          type="button"
          onClick={startCamera}
          disabled={buttonDisabled}
          className={buttonClass}
        >
          {buttonIcon}
          {buttonLabel}
        </button>
      )}

      {/* ── Camera view — only when camera is active ── */}
      {isCameraActive && (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-xl bg-slate-900">
            <video
              ref={videoRef}
              className="h-64 w-full object-cover sm:h-72"
              autoPlay muted playsInline
            />
            <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />

            <div className="absolute right-3 top-3">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                videoPlaying ? 'bg-green-500 text-white' : 'bg-slate-600 text-white'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full bg-white ${videoPlaying ? '' : 'animate-pulse'}`} />
                {videoPlaying ? 'Caméra active' : 'Démarrage…'}
              </span>
            </div>

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
              <p className="text-center text-xs text-white/90">{message}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={authenticate}
              disabled={!videoPlaying || phase === 'authenticating'}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {phase === 'authenticating'
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Vérification…</>
                : <><CheckCircle className="h-4 w-4" /> Authentifier</>}
            </button>
            <button
              type="button"
              onClick={stopCamera}
              disabled={phase === 'authenticating'}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <Square className="h-4 w-4" /> Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraFaceIdLogin;
