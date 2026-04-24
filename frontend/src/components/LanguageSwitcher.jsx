import React, { useState } from 'react';
import { changeLanguage, getCurrentLang, isLanguageLoaded } from '../i18n';

const LANGS = [
  { code: 'fr', label: 'FR', flag: '🇫🇷', name: 'Français' },
  { code: 'en', label: 'EN', flag: '🇬🇧', name: 'English' },
  { code: 'ar', label: 'AR', flag: '🇸🇦', name: 'العربية' },
];

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  // Use state so the button re-renders after switching
  const [activeLang, setActiveLang] = useState(() => getCurrentLang());

  const current = LANGS.find(l => l.code === activeLang) || LANGS[0];

  const select = async (code) => {
    setOpen(false);
    if (code === activeLang) return;

    const cached = isLanguageLoaded(code);

    if (!cached) {
      setLoading(true);
      setProgress(0);
    }

    try {
      await changeLanguage(code, cached ? null : (pct) => setProgress(pct));
      setActiveLang(code);
    } catch (err) {
      console.error('[LanguageSwitcher] translation failed', err);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="relative" data-no-translate>
      <button
        onClick={() => !loading && setOpen(o => !o)}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-70"
        aria-label="Language selector"
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span className="text-xs font-semibold text-indigo-600 tabular-nums">{progress}%</span>
          </>
        ) : (
          <>
            <span className="text-base leading-none">{current.flag}</span>
            <span className="text-xs font-semibold tracking-wide">{current.label}</span>
          </>
        )}
      </button>

      {open && !loading && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[140px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
            {LANGS.map(lang => {
              const cached = isLanguageLoaded(lang.code);
              const isActive = lang.code === activeLang;
              return (
                <button
                  key={lang.code}
                  onClick={() => select(lang.code)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-900/30 dark:text-indigo-300'
                      : 'text-slate-700 dark:text-slate-300'
                  } ${lang.code === 'ar' ? 'flex-row-reverse text-right' : ''}`}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span className="flex-1">{lang.name}</span>
                  {cached && !isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Cached — instant" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
