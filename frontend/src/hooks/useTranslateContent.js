import { useState, useCallback } from 'react';

/**
 * Hook for translating dynamic user-generated content.
 * Translation feature has been removed - returns original text.
 *
 * Usage:
 *   const { translate, loading } = useTranslateContent();
 *   const translated = await translate(['Hello world', 'How are you?']);
 */
export function useTranslateContent() {
  const [loading, setLoading] = useState(false);

  const translate = useCallback(async (texts) => {
    // Translation feature removed - return original text
    return Array.isArray(texts) ? texts : [texts];
  }, []);

  return { translate, loading };
}