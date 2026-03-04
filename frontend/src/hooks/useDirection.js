// src/hooks/useDirection.js
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export function useDirection() {
  const { i18n } = useTranslation();
  
  // Déterminer si la langue actuelle est RTL (arabe)
  const isRTL = i18n.language === 'ar';
  
  // Mettre à jour l'attribut dir de la balise html
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language, isRTL]);
  
  return { isRTL, dir: isRTL ? 'rtl' : 'ltr' };
}