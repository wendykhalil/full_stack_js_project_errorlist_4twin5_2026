import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';

import frTranslation from './locales/fr/translation.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: frTranslation },
    },
    lng: typeof window !== 'undefined'
      ? 'fr'
      : 'fr',
    fallbackLng: 'fr',
    supportedLngs: ['fr'],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

export function getNormalizedLanguage(lang) {
  return 'fr';
}

// Re-export so pages importing from '../i18n' still work
export { useTranslation };

export default i18n;
