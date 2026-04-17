import React from "react";
import { ArrowLeft, Eye, Palette, ShoppingCart, Type, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AccessibilityControls, { useAccessibilitySettings } from "../components/AccessibilityControls";

// ── Color-vision SVG filter IDs (already injected by AccessibilityControls) ──
const FILTER_MAP = {
  none:         "",
  protanopia:   "url(#a11y-protanopia)",
  deuteranopia: "url(#a11y-deuteranopia)",
  tritanopia:   "url(#a11y-tritanopia)",
};

// ── Font-size index → readable label ─────────────────────────────────────────
const SIZE_LABEL = ["XS", "S", "M", "L", "XL"];
const SIZE_PX    = [11,   12,  14,  16,  18];   // preview-scoped sizes (slightly smaller than global)

// ── Live Preview ──────────────────────────────────────────────────────────────
function LivePreview({ settings }) {
  const { highContrast, fontSizeIndex, reducedMotion, colorblindMode } = settings;

  // Scoped styles applied only to this container
  const containerStyle = {
    fontSize:   SIZE_PX[fontSizeIndex] + "px",
    filter:     FILTER_MAP[colorblindMode] || undefined,
    transition: reducedMotion ? "none" : undefined,
  };

  // High-contrast palette (scoped)
  const bg        = highContrast ? "#000"     : "#ffffff";
  const surface   = highContrast ? "#111"     : "#f8fafc";
  const border    = highContrast ? "#fff"     : "#e2e8f0";
  const textPrim  = highContrast ? "#fff"     : "#0f172a";
  const textSec   = highContrast ? "#d1d5db"  : "#64748b";
  const accent    = highContrast ? "#facc15"  : "#4f46e5";
  const btnBg     = highContrast ? "#facc15"  : "#4f46e5";
  const btnText   = highContrast ? "#000"     : "#ffffff";
  const cardBg    = highContrast ? "#1a1a1a"  : "#ffffff";
  const cardBdr   = highContrast ? "#ffffff"  : "#e2e8f0";

  // Animation class — only applied when reducedMotion is OFF
  const hoverAnim = reducedMotion ? "" : "transition-transform hover:scale-105";

  return (
    <div
      style={{ ...containerStyle, background: bg, border: `1.5px solid ${border}` }}
      className="rounded-2xl overflow-hidden"
      aria-label="Aperçu en direct"
    >
      {/* Preview header bar */}
      <div
        style={{ background: highContrast ? "#111" : "#f1f5f9", borderBottom: `1px solid ${border}` }}
        className="flex items-center gap-2 px-4 py-2.5"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span style={{ color: textSec }} className="ml-2 text-[11px] font-medium">
          Aperçu en direct
        </span>
        {/* Active settings badges */}
        <div className="ml-auto flex items-center gap-1.5 flex-wrap justify-end">
          <span style={{ background: accent + "22", color: accent, border: `1px solid ${accent}44` }}
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold">
            {SIZE_LABEL[fontSizeIndex]}
          </span>
          {highContrast && (
            <span style={{ background: "#facc1522", color: "#ca8a04", border: "1px solid #ca8a0444" }}
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold">
              Contraste ↑
            </span>
          )}
          {colorblindMode !== "none" && (
            <span style={{ background: "#6366f122", color: "#6366f1", border: "1px solid #6366f144" }}
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize">
              {colorblindMode.slice(0, 1).toUpperCase()}
            </span>
          )}
          {reducedMotion && (
            <span style={{ background: "#f9731622", color: "#ea580c", border: "1px solid #ea580c44" }}
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold">
              ⏸ Anim.
            </span>
          )}
        </div>
      </div>

      {/* Preview body */}
      <div style={{ background: bg }} className="p-5 space-y-5">

        {/* ── Sample text block ── */}
        <div>
          <h3 style={{ color: textPrim, fontSize: "1.25em", fontWeight: 700, lineHeight: 1.3 }}>
            Bienvenue sur BMP.tn
          </h3>
          <p style={{ color: textSec, marginTop: "0.4em", lineHeight: 1.6 }}>
            Trouvez les meilleurs artisans et matériaux pour vos projets de construction et rénovation.
          </p>
        </div>

        {/* ── Product card ── */}
        <div
          style={{
            background: cardBg,
            border: `1px solid ${cardBdr}`,
            borderRadius: "0.75em",
            overflow: "hidden",
          }}
          className={hoverAnim}
        >
          {/* Image placeholder */}
          <div
            style={{
              background: highContrast ? "#222" : "#e2e8f0",
              height: "80px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
              stroke={highContrast ? "#888" : "#94a3b8"} strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>

          <div style={{ padding: "0.75em" }}>
            <p style={{ color: textPrim, fontWeight: 600 }}>Ciment Portland 50kg</p>
            <p style={{ color: textSec, fontSize: "0.85em", marginTop: "0.2em" }}>
              Fournisseur: BatiPro Tunis
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.6em" }}>
              <span style={{ color: accent, fontWeight: 700, fontSize: "1.1em" }}>
                24.90 TND
              </span>
              <span style={{
                background: highContrast ? "#1a3a1a" : "#f0fdf4",
                color: highContrast ? "#86efac" : "#16a34a",
                border: `1px solid ${highContrast ? "#166534" : "#bbf7d0"}`,
                borderRadius: "999px",
                padding: "0.15em 0.6em",
                fontSize: "0.75em",
                fontWeight: 600,
              }}>
                En stock
              </span>
            </div>
          </div>
        </div>

        {/* ── CTA button ── */}
        <button
          type="button"
          style={{
            background: btnBg,
            color: btnText,
            border: highContrast ? "2px solid #fff" : "none",
            borderRadius: "0.75em",
            padding: "0.6em 1.2em",
            fontWeight: 600,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5em",
            cursor: "pointer",
            transition: reducedMotion ? "none" : "opacity 0.15s",
          }}
          onMouseEnter={e => { if (!reducedMotion) e.currentTarget.style.opacity = "0.85"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >
          <ShoppingCart style={{ width: "1em", height: "1em" }} />
          Ajouter au panier
        </button>

        {/* ── Link sample ── */}
        <p style={{ color: textSec, fontSize: "0.85em", textAlign: "center" }}>
          <span style={{ color: accent, textDecoration: "underline", cursor: "pointer" }}>
            Voir tous les produits
          </span>
          {" "}· Livraison en 48h
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AccessibilitySettings() {
  const navigate = useNavigate();

  // Lift state up so both AccessibilityControls and LivePreview share it
  const a11y = useAccessibilitySettings();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">

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
            <div className="flex items-center gap-4">
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

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Controls (left 2 cols) ── */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-xl p-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Contrôles d'accessibilité
              </h2>
              {/* Pass the shared hook instance so controls and preview stay in sync */}
              <AccessibilityControls a11y={a11y} />
            </div>

            {/* ── Live Preview ── */}
            <div className="rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-xl p-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-1 flex items-center gap-2">
                <Eye className="h-5 w-5 text-indigo-500" />
                Aperçu en direct
              </h2>
              <p className="text-sm text-slate-500 mb-5">
                Visualisez l'impact de vos réglages en temps réel — sans affecter le reste de l'application.
              </p>
              <LivePreview settings={a11y.settings} />
            </div>
          </div>

          {/* ── Info panel (right col) ── */}
          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Type className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Taille du texte</h3>
              </div>
              <p className="text-sm text-blue-800 leading-relaxed">
                Ajustez la taille de la police pour améliorer la lisibilité selon vos besoins visuels.
              </p>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Palette className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Vision des couleurs</h3>
              </div>
              <p className="text-sm text-green-800 leading-relaxed mb-3">
                Filtres pour différents types de daltonisme :
              </p>
              <ul className="text-xs text-green-700 space-y-1">
                <li>• <strong>P</strong> — Protanopie (rouge-aveugle)</li>
                <li>• <strong>D</strong> — Deutéranopie (vert-aveugle)</li>
                <li>• <strong>T</strong> — Tritanopie (bleu-aveugle)</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">Contraste élevé</h3>
              </div>
              <p className="text-sm text-purple-800 leading-relaxed">
                Augmente le contraste des couleurs pour une meilleure visibilité et réduction de la fatigue oculaire.
              </p>
            </div>

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

        {/* Tips */}
        <div className="mt-8 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100/50 border border-slate-200/50 p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Conseils d'utilisation</h2>
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
              <p>Vous pouvez également utiliser Ctrl + / Ctrl − pour ajuster le zoom.</p>
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
