// src/hooks/useDirection.js
// Translation feature removed - always returns LTR direction

export function useDirection() {
  const isRTL = false;
  const dir = 'ltr';
  
  return { isRTL, dir };
}