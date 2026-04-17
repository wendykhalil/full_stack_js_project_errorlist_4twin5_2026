import { useEffect, useState } from "react";
import { Accessibility, Contrast, Minus, MonitorSpeaker, Plus } from "lucide-react";

const STORAGE_KEY = "bmp_accessibility_settings";

// Font size levels in px
const FONT_SIZES  = [13, 14, 16, 18, 20];
const FONT_LABELS = ["XS", "S", "M", "L", "XL"];

const COLORBLIND_MODES = [
  { id: "none",         label: "Normal", bg: "#6b7280", title: "Normal vision" },
  { id: "protanopia",   label: "P",      bg: "#dc2626", title: "Protanopia (red-blind)" },
  { id: "deuteranopia", label: "D",      bg: "#16a34a", title: "Deuteranopia (green-blind)" },
  { id: "tritanopia",   label: "T",      bg: "#2563eb", title: "Tritanopia (blue-blind)" },
];

const DEFAULT_SETTINGS = {
  highContrast:   false,
  fontSizeIndex:  2,       // index 2 = 16 px (normal)
  reducedMotion:  false,
  colorblindMode: "none",
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const p = JSON.parse(raw);
    return {
      highContrast:   Boolean(p.highContrast),
      // migrate old largeText boolean → fontSizeIndex
      fontSizeIndex:  typeof p.fontSizeIndex === "number"
                        ? Math.min(Math.max(p.fontSizeIndex, 0), FONT_SIZES.length - 1)
                        : (p.largeText ? 3 : 2),
      reducedMotion:  Boolean(p.reducedMotion),
      colorblindMode: COLORBLIND_MODES.some(m => m.id === p.colorblindMode)
                        ? p.colorblindMode
                        : "none",
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function injectColorblindSVG() {
  if (document.getElementById("a11y-colorblind-svg")) return;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("id", "a11y-colorblind-svg");
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
  svg.innerHTML = `
    <defs>
      <filter id="a11y-protanopia">
        <feColorMatrix type="matrix"
          values="0.567 0.433 0     0 0
                  0.558 0.442 0     0 0
                  0     0.242 0.758 0 0
                  0     0     0     1 0"/>
      </filter>
      <filter id="a11y-deuteranopia">
        <feColorMatrix type="matrix"
          values="0.625 0.375 0   0 0
                  0.7   0.3   0   0 0
                  0     0.3   0.7 0 0
                  0     0     0   1 0"/>
      </filter>
      <filter id="a11y-tritanopia">
        <feColorMatrix type="matrix"
          values="0.95  0.05  0     0 0
                  0     0.433 0.567 0 0
                  0     0.475 0.525 0 0
                  0     0     0     1 0"/>
      </filter>
    </defs>`;
  document.body.appendChild(svg);
}

function applySettings(settings) {
  const root = document.documentElement;

  // High contrast
  root.classList.toggle("a11y-high-contrast", settings.highContrast);

  // Reduced motion
  root.classList.toggle("a11y-reduced-motion", settings.reducedMotion);

  // Font size – set directly on <html> so all rem units scale
  root.style.fontSize = FONT_SIZES[settings.fontSizeIndex] + "px";

  // Colorblind filter
  injectColorblindSVG();
  if (settings.colorblindMode !== "none") {
    root.style.filter = `url(#a11y-${settings.colorblindMode})`;
  } else {
    root.style.filter = "";
  }
}

export function useAccessibilitySettings() {
  const [settings, setSettings] = useState(() => {
    if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
    return loadSettings();
  });

  useEffect(() => {
    applySettings(settings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const toggleSetting = (key) =>
    setSettings((s) => ({ ...s, [key]: !s[key] }));

  const setFontSizeIndex = (idx) =>
    setSettings((s) => ({ ...s, fontSizeIndex: Math.min(Math.max(idx, 0), FONT_SIZES.length - 1) }));

  const setColorblindMode = (mode) =>
    setSettings((s) => ({ ...s, colorblindMode: mode }));

  return { settings, toggleSetting, setFontSizeIndex, setColorblindMode };
}

/* ── sub-components ──────────────────────────────────────────────── */

function ToggleRow({ icon, label, enabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={enabled}
      className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition ${
        enabled
          ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      }`}
    >
      <span className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </span>
      <span className={`inline-flex h-5 w-9 items-center rounded-full p-0.5 transition ${enabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"}`}>
        <span className={`h-4 w-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-4" : "translate-x-0"}`} />
      </span>
    </button>
  );
}

/* ── main component ──────────────────────────────────────────────── */

export default function AccessibilityControls({ a11y }) {
  // If a shared hook instance is passed from the parent, use it.
  // Otherwise fall back to an internal instance (backward-compatible).
  const internal = useAccessibilitySettings();
  const { settings, toggleSetting, setFontSizeIndex, setColorblindMode } = a11y ?? internal;

  return (
    <section className="rounded-md border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm">
          <Accessibility className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-white">Accessibility</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">Comfort options</div>
        </div>
      </div>

      <div className="space-y-2">
        {/* ── Font size stepper ── */}
        <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
          <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="text-base font-bold leading-none">A</span>
            <span>Text size</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFontSizeIndex(settings.fontSizeIndex - 1)}
              disabled={settings.fontSizeIndex === 0}
              aria-label="Decrease text size"
              className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 disabled:opacity-30 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-7 text-center text-xs font-semibold text-slate-700 dark:text-slate-200">
              {FONT_LABELS[settings.fontSizeIndex]}
            </span>
            <button
              type="button"
              onClick={() => setFontSizeIndex(settings.fontSizeIndex + 1)}
              disabled={settings.fontSizeIndex === FONT_SIZES.length - 1}
              aria-label="Increase text size"
              className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 disabled:opacity-30 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* ── Colorblind mode ── */}
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
          <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">Color vision</p>
          <div className="grid grid-cols-4 gap-1.5">
            {COLORBLIND_MODES.map((mode) => {
              const active = settings.colorblindMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  title={mode.title}
                  onClick={() => setColorblindMode(mode.id)}
                  aria-pressed={active}
                  className={`flex flex-col items-center gap-1 rounded-md border py-1.5 text-[10px] font-semibold transition ${
                    active
                      ? "border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-300"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-white/40 shadow-sm"
                    style={{ background: mode.bg }}
                  />
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── High contrast ── */}
        <ToggleRow
          icon={<Contrast className="h-4 w-4" />}
          label="High contrast"
          enabled={settings.highContrast}
          onClick={() => toggleSetting("highContrast")}
        />

        {/* ── Reduced motion ── */}
        <ToggleRow
          icon={<MonitorSpeaker className="h-4 w-4" />}
          label="Reduced motion"
          enabled={settings.reducedMotion}
          onClick={() => toggleSetting("reducedMotion")}
        />
      </div>
    </section>
  );
}
