import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CheckCircle, XCircle, AlertTriangle, Loader2, Play, Square } from 'lucide-react';
import {
  loadFaceApiModels,
  captureFaceData,
  detectFaceInFrame,
  registerCameraFaceId,
  checkCameraFaceIdStatus,
  removeCameraFaceIdRegistration,
} from '../services/cameraFaceId';
import { useAuth } from '../auth/AuthContext';

export default function CameraFaceIdSetup() {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  const [phase, setPhase] = useState('init'); // init | ready | recording | capturing | registered | error
  const [modelsReady, setModelsReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info'); // info | success | error | warning

  // ── Camera stop ───────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setFaceDetected(false);
  }, []);

  // ── Init: load models + check server registration status ─────────────────
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setPhase('init');
      setMessage('Chargement des modèles de reconnaissance faciale…');
      setMessageType('info');

      try {
        await loadFaceApiModels();
        if (cancelled) return;
        setModelsReady(true);

        const registered = await checkCameraFaceIdStatus();
        if (cancelled) return;
        setIsRegistered(registered);
        setPhase(registered ? 'registered' : 'ready');
        setMessage(registered
          ? 'Face ID caméra actif sur votre compte.'
          : 'Modèles chargés. Cliquez sur "Démarrer la caméra" pour enregistrer votre visage.');
        setMessageType(registered ? 'success' : 'info');
      } catch (err) {
        if (cancelled) return;
        setPhase('error');
        setMessage(err.message);
        setMessageType('error');
      }
    };

    init();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [stopCamera]);

  // ── Real face detection loop ──────────────────────────────────────────────
  const runDetectionLoop = useCallback(() => {
    let detecting = false; // prevent concurrent async detections

    const loop = async () => {
      if (!videoRef.current || !canvasRef.current || !streamRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState >= 2 && !detecting) {
        detecting = true;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const detection = await detectFaceInFrame(video);
        detecting = false;

        const hasFace = Boolean(detection);
        setFaceDetected(hasFace);

        if (hasFace) {
          const box = detection.detection.box;
          const pad = 20;
          const x = Math.max(0, box.x - pad);
          const y = Math.max(0, box.y - pad);
          const w = box.width + pad * 2;
          const h = box.height + pad * 2;
          const cs = 14;

          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2.5;
          [
            [x, y + cs, x, y, x + cs, y],
            [x + w - cs, y, x + w, y, x + w, y + cs],
            [x, y + h - cs, x, y + h, x + cs, y + h],
            [x + w - cs, y + h, x + w, y + h, x + w, y + h - cs],
          ].forEach(([x1, y1, x2, y2, x3, y3]) => {
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.stroke();
          });
        } else {
          const gw = Math.min(280, canvas.width * 0.6);
          const gh = gw * 1.3;
          const gx = (canvas.width - gw) / 2;
          const gy = (canvas.height - gh) / 2;
          ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(gx, gy, gw, gh);
          ctx.setLineDash([]);
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  // ── Start camera ──────────────────────────────────────────────────────────
  const startCamera = async () => {
    setMessage('Démarrage de la caméra…');
    setMessageType('info');

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        });
      } catch (e) {
        if (e.name === 'NotAllowedError') throw new Error('Accès caméra refusé. Autorisez la caméra dans les paramètres du navigateur.');
        if (e.name === 'NotFoundError') throw new Error('Aucune caméra trouvée. Connectez une caméra et réessayez.');
        if (e.name === 'NotReadableError') throw new Error('Caméra utilisée par une autre application. Fermez-la et réessayez.');
        throw e;
      }

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      setPhase('recording');
      setMessage('Positionnez votre visage dans le cadre et cliquez sur "Capturer le visage".');
      setMessageType('info');
      runDetectionLoop();
    } catch (err) {
      setPhase('error');
      setMessage(err.message);
      setMessageType('error');
    }
  };

  // ── Capture & register ────────────────────────────────────────────────────
  const captureFace = async () => {
    if (!faceDetected) {
      setMessage('Aucun visage détecté. Positionnez votre visage dans le cadre.');
      setMessageType('warning');
      return;
    }

    setPhase('capturing');
    setMessage('Capture du visage en cours…');
    setMessageType('info');

    try {
      const faceData = await captureFaceData(videoRef.current);
      setMessage('Enregistrement sur le serveur…');

      const userId = user?._id || user?.id;
      await registerCameraFaceId(userId, user?.email, faceData);

      stopCamera();
      setIsRegistered(true);
      setPhase('registered');
      setMessage('Face ID caméra enregistré avec succès ! Vous pouvez maintenant vous connecter avec votre visage.');
      setMessageType('success');
    } catch (err) {
      setPhase('recording'); // go back to recording so user can retry
      setMessage(err.message);
      setMessageType('error');
    }
  };

  // ── Remove registration ───────────────────────────────────────────────────
  const removeRegistration = async () => {
    setPhase('init');
    setMessage('Suppression en cours…');
    try {
      await removeCameraFaceIdRegistration();
      setIsRegistered(false);
      setPhase('ready');
      setMessage('Enregistrement supprimé. Vous pouvez en créer un nouveau.');
      setMessageType('info');
    } catch (err) {
      setPhase('registered');
      setMessage(err.message);
      setMessageType('error');
    }
  };

  // ── Alert component ───────────────────────────────────────────────────────
  const Alert = ({ msg, type }) => {
    if (!msg) return null;
    const styles = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error:   'bg-red-50 border-red-200 text-red-700',
      info:    'bg-blue-50 border-blue-200 text-blue-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    };
    const Icon = type === 'success' ? CheckCircle : type === 'error' ? XCircle : AlertTriangle;
    return (
      <div className={`flex items-start gap-3 rounded-xl border p-4 ${styles[type] || styles.info}`}>
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-sm">{msg}</p>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
        Vous devez être connecté pour configurer le Face ID caméra.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Alert msg={message} type={messageType} />

      {/* ── Registered state ── */}
      {isRegistered && phase === 'registered' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">Face ID caméra actif</p>
              <p className="text-xs text-green-600 mt-0.5">Vous pouvez vous connecter avec votre visage.</p>
            </div>
          </div>
          <button
            onClick={removeRegistration}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            <XCircle className="h-4 w-4" />
            Supprimer le Face ID caméra
          </button>
        </div>
      )}

      {/* ── Setup state ── */}
      {!isRegistered && (
        <div className="space-y-4">
          {/* Camera preview */}
          <div className="relative overflow-hidden rounded-xl bg-slate-900 aspect-video">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              autoPlay muted playsInline
            />
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute inset-0 h-full w-full"
            />

            {/* Face detection badge */}
            {phase === 'recording' && (
              <div className="absolute right-3 top-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  faceDetected ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full bg-white ${faceDetected ? '' : 'animate-pulse'}`} />
                  {faceDetected ? 'Visage détecté' : 'Aucun visage'}
                </span>
              </div>
            )}

            {/* Placeholder when camera is off */}
            {phase !== 'recording' && phase !== 'capturing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
                <Camera className="h-12 w-12 text-white/40" />
                <p className="text-sm text-white/60">
                  {phase === 'init' ? 'Chargement…' : 'Cliquez sur "Démarrer la caméra"'}
                </p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {phase === 'ready' || phase === 'error' ? (
              <button
                onClick={startCamera}
                disabled={!modelsReady}
                className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                Démarrer la caméra
              </button>
            ) : phase === 'recording' ? (
              <>
                <button
                  onClick={captureFace}
                  disabled={!faceDetected}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  Capturer le visage
                </button>
                <button
                  onClick={() => { stopCamera(); setPhase('ready'); setMessage(''); }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <Square className="h-4 w-4" />
                  Arrêter
                </button>
              </>
            ) : phase === 'capturing' || phase === 'init' ? (
              <div className="sm:col-span-2 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                {phase === 'init' ? 'Chargement des modèles…' : 'Capture en cours…'}
              </div>
            ) : null}
          </div>

          {/* Instructions */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">Instructions</p>
            <ol className="space-y-1 text-xs text-blue-700 list-decimal list-inside">
              <li>Cliquez sur "Démarrer la caméra"</li>
              <li>Positionnez votre visage dans le cadre vert</li>
              <li>Assurez-vous d'être bien éclairé</li>
              <li>Attendez "Visage détecté" puis cliquez sur "Capturer le visage"</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
