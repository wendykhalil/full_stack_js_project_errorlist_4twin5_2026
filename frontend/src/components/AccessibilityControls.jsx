import React, { useEffect, useState } from "react";
import { Accessibility, Contrast, Type, MonitorSpeaker } from "lucide-react";

const STORAGE_KEY = "bmp_accessibility_settings";

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { highContrast: false, largeText: false, reducedMotion: false };
    return {
      highContrast: Boolean(JSON.parse(raw).highContrast),
      largeText: Boolean(JSON.parse(raw).largeText),
      reducedMotion: Boolean(JSON.parse(raw).reducedMotion),
    };
  } catch {
    return { highContrast: false, largeText: false, reducedMotion: false };
  }
}

function applySettings(settings) {
  const root = document.documentElement;
  root.classList.toggle("a11y-high-contrast", settings.highContrast);
  root.classList.toggle("a11y-large-text", settings.largeText);
  root.classList.toggle("a11y-reduced-motion", settings.reducedMotion);
}

export function useAccessibilitySettings() {
  const [settings, setSettings] = useState(() => {
    if (typeof window === "undefined") return { highContrast: false, largeText: false, reducedMotion: false };
    return loadSettings();
  });

  useEffect(() => {
    applySettings(settings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const toggleSetting = (key) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
  };

  return { settings, toggleSetting };
}

function ToggleRow({ icon, label, enabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={enabled}
      className={`flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-left text-sm transition ${
        enabled
          ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      }`}
    >
      <span className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </span>
      <span
        className={`inline-flex h-6 w-11 items-center rounded-full p-1 transition ${
          enabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white transition ${enabled ? "translate-x-5" : "translate-x-0"}`}
        />
      </span>
    </button>
  );
}

export default function AccessibilityControls({ compact = false }) {
  const { settings, toggleSetting } = useAccessibilitySettings();

  return (
    <section className={`rounded-md border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800`}>
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm">
          <Accessibility className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-white">Accessibility</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Comfort options</div>
        </div>
      </div>

      <div className="space-y-2">
        <ToggleRow
          icon={<Contrast className="h-4 w-4" />}
          label="High contrast"
          enabled={settings.highContrast}
          onClick={() => toggleSetting("highContrast")}
        />
        <ToggleRow
          icon={<Type className="h-4 w-4" />}
          label="Large text"
          enabled={settings.largeText}
          onClick={() => toggleSetting("largeText")}
        />
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
