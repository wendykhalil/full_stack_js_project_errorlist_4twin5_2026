import { useState, useCallback } from 'react';

// ── Validators ────────────────────────────────────────────────────────────────
export const rules = {
  required: (msg = 'Ce champ est obligatoire') => v =>
    !String(v ?? '').trim() ? msg : null,

  minLength: (n, msg) => v =>
    String(v ?? '').trim().length < n ? (msg || `Minimum ${n} caractères requis`) : null,

  maxLength: (n, msg) => v =>
    String(v ?? '').trim().length > n ? (msg || `Maximum ${n} caractères autorisés`) : null,

  email: (msg = 'Adresse email invalide (ex: nom@domaine.com)') => v =>
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v ?? '').trim()) ? msg : null,

  phone: (msg = 'Numéro invalide — chiffres uniquement, entre 6 et 15 chiffres (ex: +21622345678)') => v =>
    !/^\+?[\d\s\-().]{6,15}$/.test(String(v ?? '').trim()) ? msg : null,

  min: (n, msg) => v =>
    Number(v) < n ? (msg || `La valeur minimale est ${n}`) : null,

  max: (n, msg) => v =>
    Number(v) > n ? (msg || `La valeur maximale est ${n}`) : null,

  numeric: (msg = 'Ce champ doit contenir uniquement des chiffres') => v =>
    isNaN(Number(v)) || String(v ?? '').trim() === '' ? msg : null,

  positiveNumber: (msg = 'Doit être un nombre positif supérieur à 0') => v =>
    isNaN(Number(v)) || Number(v) < 0 ? msg : null,

  date: (msg = 'Date invalide — utilisez le format JJ/MM/AAAA') => v =>
    !v || isNaN(new Date(v).getTime()) ? msg : null,

  futureDate: (msg = 'La date doit être dans le futur') => v =>
    !v || new Date(v) <= new Date() ? msg : null,

  url: (msg = 'URL invalide (ex: https://exemple.com)') => v => {
    try { new URL(v); return null; } catch { return msg; }
  },

  noHtml: (msg = 'Les balises HTML ne sont pas autorisées') => v =>
    /<[^>]*>/.test(String(v ?? '')) ? msg : null,

  alphanumeric: (msg = 'Lettres majuscules, chiffres, tirets (-) et underscores (_) uniquement') => v =>
    !/^[A-Za-z0-9_-]+$/.test(String(v ?? '').trim()) ? msg : null,

  mongoId: (msg = 'Identifiant invalide') => v =>
    !/^[a-f\d]{24}$/i.test(String(v ?? '')) ? msg : null,

  fileSize: (maxMb, msg) => v =>
    v instanceof File && v.size > maxMb * 1024 * 1024
      ? (msg || `Fichier trop volumineux — maximum ${maxMb}MB autorisé`) : null,

  fileType: (types, msg) => v =>
    v instanceof File && !types.includes(v.type)
      ? (msg || `Type de fichier non autorisé. Types acceptés: ${types.join(', ')}`) : null,

  onlyDigits: (msg = 'Ce champ doit contenir uniquement des chiffres, sans espaces ni lettres') => v =>
    !/^\d+$/.test(String(v ?? '').trim()) ? msg : null,

  password: (msg = 'Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre') => v => {
    const s = String(v ?? '');
    if (s.length < 8) return 'Mot de passe trop court — minimum 8 caractères';
    if (!/[A-Z]/.test(s)) return 'Le mot de passe doit contenir au moins une lettre majuscule';
    if (!/[0-9]/.test(s)) return 'Le mot de passe doit contenir au moins un chiffre';
    return null;
  },
};

// ── Hook ──────────────────────────────────────────────────────────────────────
/**
 * @param {Object} schema - { fieldName: [rule1, rule2, ...] }
 * @returns {{ errors, validate, clearError, clearAll }}
 *
 * Usage:
 *   const { errors, validate } = useFormValidation({
 *     title: [rules.required(), rules.minLength(3), rules.maxLength(120)],
 *     email: [rules.required(), rules.email()],
 *   });
 *
 *   const ok = validate({ title, email });
 *   if (!ok) return; // errors are set
 */
export function useFormValidation(schema) {
  const [errors, setErrors] = useState({});

  const validate = useCallback((values) => {
    const newErrors = {};
    for (const [field, fieldRules] of Object.entries(schema)) {
      const value = values[field];
      for (const rule of fieldRules) {
        const error = rule(value);
        if (error) { newErrors[field] = error; break; }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [schema]);

  const clearError = useCallback((field) => {
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  }, []);

  const clearAll = useCallback(() => setErrors({}), []);

  return { errors, validate, clearError, clearAll };
}
