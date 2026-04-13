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

  const handleError = useCallback((err) => {
    const data = err?.data || {};

    // Backend validation errors array
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      const mapped = {};
      data.errors.forEach(({ field, message }) => {
        if (field) mapped[field] = message;
      });
      setFieldErrors(mapped);
      setGlobalError('');
    } else {
      // Generic error message
      setFieldErrors({});
      setGlobalError(data.message || err.message || 'Une erreur est survenue');
    }
  }, []);

  const clearErrors = useCallback(() => {
    setFieldErrors({});
    setGlobalError('');
  }, []);

  return { fieldErrors, globalError, handleError, clearErrors };
}
