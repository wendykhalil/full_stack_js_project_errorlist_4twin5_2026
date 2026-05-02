/**
 * Dynamically load Google Identity Services script
 * This prevents the script from blocking initial page load
 * @returns {Promise<void>}
 */
let googleScriptLoaded = false;
let googleScriptPromise = null;

export function loadGoogleIdentityScript() {
  // Return existing promise if already loading
  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  // Return resolved promise if already loaded
  if (googleScriptLoaded && window.google?.accounts?.id) {
    return Promise.resolve();
  }

  // Create new loading promise
  googleScriptPromise = new Promise((resolve, reject) => {
    // Check if script already exists
    const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existingScript) {
      if (window.google?.accounts?.id) {
        googleScriptLoaded = true;
        resolve();
      } else {
        existingScript.addEventListener('load', () => {
          googleScriptLoaded = true;
          resolve();
        });
        existingScript.addEventListener('error', reject);
      }
      return;
    }

    // Create and inject script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      googleScriptLoaded = true;
      console.log('[Google Identity] Script loaded successfully');
      resolve();
    };
    
    script.onerror = (error) => {
      console.error('[Google Identity] Failed to load script:', error);
      googleScriptPromise = null; // Reset to allow retry
      reject(new Error('Failed to load Google Identity Services'));
    };
    
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

/**
 * Check if Google Identity Services is ready
 * @returns {boolean}
 */
export function isGoogleIdentityReady() {
  return googleScriptLoaded && window.google?.accounts?.id;
}
