import { useState, useCallback } from 'react';

// ── Validators ────────────────────────────────────────────────────────────────
export const rules = {
  required: (msg = 'Ce champ est requis') => v =>
    !String(v ?? '').trim() ? msg : null,

  minLength: (n, msg) => v =>
    String(v ?? '').trim().length < n ? (msg || `Minimum ${n} caractères`) : null,

  maxLength: (n, msg) => v =>
    String(v ?? '').trim().length > n ? (msg || `Maximum ${n} caractères`) : null,

  email: (msg = 'Email invalide') => v =>
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v ?? '').trim()) ? msg : null,

  phone: (msg = 'Numéro de téléphone invalide (6-15 chiffres)') => v =>
    !/^\+?[\d\s\-().]{6,15}$/.test(String(v ?? '').trim()) ? msg : null,

  min: (n, msg) => v =>
    Number(v) < n ? (msg || `Valeur minimum: ${n}`) : null,

  max: (n, msg) => v =>
    Number(v) > n ? (msg || `Valeur maximum: ${n}`) : null,

  numeric: (msg = 'Doit être un nombre') => v =>
    isNaN(Number(v)) || String(v ?? '').trim() === '' ? msg : null,

  positiveNumber: (msg = 'Doit être un nombre positif') => v =>
    isNaN(Number(v)) || Number(v) < 0 ? msg : null,

  date: (msg = 'Date invalide') => v =>
    !v || isNaN(new Date(v).getTime()) ? msg : null,

  futureDate: (msg = 'La date doit être dans le futur') => v =>
    !v || new Date(v) <= new Date() ? msg : null,

  url: (msg = 'URL invalide') => v => {
    try { new URL(v); return null; } catch { return msg; }
  },

  noHtml: (msg = 'HTML non autorisé') => v =>
    /<[^>]*>/.test(String(v ?? '')) ? msg : null,

  alphanumeric: (msg = 'Lettres et chiffres uniquement') => v =>
    !/^[A-Za-z0-9_-]+$/.test(String(v ?? '').trim()) ? msg : null,

  mongoId: (msg = 'ID invalide') => v =>
    !/^[a-f\d]{24}$/i.test(String(v ?? '')) ? msg : null,

  fileSize: (maxMb, msg) => v =>
    v instanceof File && v.size > maxMb * 1024 * 1024
      ? (msg || `Fichier trop volumineux (max ${maxMb}MB)`) : null,

  fileType: (types, msg) => v =>
    v instanceof File && !types.includes(v.type)
      ? (msg || `Type de fichier non autorisé`) : null,
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
