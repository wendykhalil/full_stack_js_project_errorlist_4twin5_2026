import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';

import enTranslation from './locales/en/translation.json';
import frTranslation from './locales/fr/translation.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      fr: { translation: frTranslation },
    },
    lng: typeof window !== 'undefined'
      ? (window.localStorage.getItem('i18nextLng') || 'fr')
      : 'fr',
    fallbackLng: 'fr',
    supportedLngs: ['en', 'fr'],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

export function getNormalizedLanguage(lang) {
  const v = String(lang || '').toLowerCase();
  if (v.startsWith('en')) return 'en';
  return 'fr';
}

// Re-export so pages importing from '../i18n' still work
export { useTranslation };

export default i18n;
