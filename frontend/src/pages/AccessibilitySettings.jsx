import React from "react";
import { ArrowLeft, Palette, Type, Eye, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AccessibilityControls from "../components/AccessibilityControls";

export default function AccessibilitySettings() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
          
          <div className="rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-xl p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg">
                <Eye className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Paramètres d'accessibilité
                </h1>
                <p className="text-slate-600 mt-1">
                  Personnalisez votre expérience pour une meilleure accessibilité et confort d'utilisation
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Controls */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-xl p-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Contrôles d'accessibilité
              </h2>
              <AccessibilityControls />
            </div>
          </div>

          {/* Information Panel */}
          <div className="space-y-6">
            {/* Text Size Info */}
            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Type className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Taille du texte</h3>
              </div>
              <p className="text-sm text-blue-800 leading-relaxed">
                Ajustez la taille de la police pour améliorer la lisibilité selon vos besoins visuels.
              </p>
            </div>

            {/* Color Vision Info */}
            <div className="rounded-2xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Palette className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Vision des couleurs</h3>
              </div>
              <p className="text-sm text-green-800 leading-relaxed mb-3">
                Filtres pour différents types de daltonisme :
              </p>
              <ul className="text-xs text-green-700 space-y-1">
                <li>• <strong>P</strong> - Protanopie (rouge-aveugle)</li>
                <li>• <strong>D</strong> - Deutéranopie (vert-aveugle)</li>
                <li>• <strong>T</strong> - Tritanopie (bleu-aveugle)</li>
              </ul>
            </div>

            {/* Contrast Info */}
            <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">Contraste élevé</h3>
              </div>
              <p className="text-sm text-purple-800 leading-relaxed">
                Augmente le contraste des couleurs pour une meilleure visibilité et réduction de la fatigue oculaire.
              </p>
            </div>

            {/* Motion Info */}
            <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold text-orange-900">Mouvement réduit</h3>
              </div>
              <p className="text-sm text-orange-800 leading-relaxed">
                Réduit les animations et transitions pour éviter les distractions et le mal des transports numérique.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Tips */}
        <div className="mt-8 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100/50 border border-slate-200/50 p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Conseils d'utilisation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-700">
            <div>
              <h4 className="font-medium text-slate-900 mb-2">Navigation au clavier</h4>
              <p>Utilisez Tab pour naviguer entre les éléments et Entrée pour les activer.</p>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 mb-2">Lecteurs d'écran</h4>
              <p>Notre interface est optimisée pour les lecteurs d'écran comme NVDA et JAWS.</p>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 mb-2">Zoom du navigateur</h4>
              <p>Vous pouvez également utiliser Ctrl + / Ctrl - pour ajuster le zoom.</p>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 mb-2">Sauvegarde automatique</h4>
              <p>Vos préférences sont automatiquement sauvegardées dans votre navigateur.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}