import { useState, useCallback } from 'react';

/**
 * Reads backend validation errors and maps them to field-level errors.
 *
 * Backend returns:
 * { message: "Validation échouée", errors: [{ field: "email", message: "Email invalide" }] }
 *
 * Usage:
 *   const { fieldErrors, globalError, handleError, clearErrors } = useServerErrors();
 *
 *   try { await apiFetch(...) }
 *   catch (err) { handleError(err) }
 *
 *   // In JSX:
 *   <FieldError error={fieldErrors.email} />
 *   {globalError && <div className="text-red-600">{globalError}</div>}
 */
export function useServerErrors() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [globalError, setGlobalError] = useState('');

  const toFrench = useCallback((msg) => {
    const s = String(msg || '');
    if (!s) return '';

    const map = {
      'Name is required': 'Le nom est requis',
      'Name must be at least 2 characters': 'Le nom doit contenir au moins 2 caractères',
      'Price is required': 'Le prix est requis',
      'Price must be a number': 'Le prix doit être un nombre',
      'Price must be greater than 0': 'Le prix doit être supérieur à 0',
      'Stock is required': 'Le stock est requis',
      'Stock must be an integer': 'Le stock doit être un entier',
      'Stock must be at least 0': 'Le stock doit être supérieur ou égal à 0',
      'Description is required': 'La description est requise',
      'Description must be at least 10 characters': 'La description doit contenir au moins 10 caractères',
      'Category is required': 'La catégorie est requise',
      'Invalid credentials': 'Identifiants invalides',
      'Unauthorized': 'Non autorisé',
      'Invalid token': 'Token invalide',
    };

    return map[s] || s;
  }, []);

  const handleError = useCallback((err) => {
    const data = err?.data || {};

    // Backend validation errors object: { errors: { field: "message" } }
    if (data?.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
      const raw = data.errors || {};
      const mapped = {};
      Object.entries(raw).forEach(([k, v]) => {
        mapped[k] = typeof v === 'string' ? toFrench(v) : v;
      });
      const global = mapped._global || mapped.global || mapped.message;
      delete mapped._global;
      delete mapped.global;
      delete mapped.message;

      setFieldErrors(mapped);
      setGlobalError(global ? toFrench(String(global)) : '');
      return;
    }

    // Backend validation errors array: { errors: [{ field, message }] }
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      const mapped = {};
      data.errors.forEach(({ field, message }) => {
        if (field) mapped[field] = toFrench(message);
      });
      setFieldErrors(mapped);
      setGlobalError('');
      return;
    }

    // Generic error message
    setFieldErrors({});
    setGlobalError(toFrench(data.message || err.message || 'Une erreur est survenue'));
  }, []);

  const clearErrors = useCallback(() => {
    setFieldErrors({});
    setGlobalError('');
  }, []);

  return { fieldErrors, globalError, handleError, clearErrors };
}
