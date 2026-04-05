/**
 * Deprecated intentionally.
 *
 * The previous hook mutated rendered DOM nodes to auto-translate text. That
 * pattern is unsafe in React and caused removeChild/reconciliation runtime
 * errors across pages. Leave this as a no-op so any accidental imports do not
 * reintroduce the issue.
 */
export function useAutoPageTranslation() {
  return;
}
