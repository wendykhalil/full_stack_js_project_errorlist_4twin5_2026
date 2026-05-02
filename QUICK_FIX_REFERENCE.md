# Quick Fix Reference Card

## 🚨 Common Login Page Issues & Solutions

---

### Issue 1: TensorFlow Duplicate Kernel Registration

**Error:**
```
The kernel 'XXX' for backend 'cpu' is already registered
```

**Quick Fix:**
```jsx
// ✅ Use lazy loading
const FaceIdComponent = lazy(() => import('./FaceIdComponent'));

// ✅ Wrap in Suspense
<Suspense fallback={<Loading />}>
  <FaceIdComponent />
</Suspense>
```

**Root Cause:** TensorFlow imported at top level  
**Solution:** Dynamic imports + lazy loading  
**Details:** See `PERFORMANCE_FIXES.md`

---

### Issue 2: Stripe HTTP Warning

**Warning:**
```
You may test your Stripe.js integration over HTTP...
```

**Quick Fix:**
- **Development:** Ignore (expected behavior)
- **Production:** Deploy with HTTPS

**HTTPS Setup (Local):**
```bash
npm install -g mkcert
mkcert -install
mkcert localhost
```

**Root Cause:** Running on HTTP instead of HTTPS  
**Solution:** Use HTTPS in production  
**Details:** See `PERFORMANCE_FIXES.md` Section 2

---

### Issue 3: Google OAuth 403 Error

**Error:**
```
403: The given origin is not allowed for the given client ID
```

**Quick Fix:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click your OAuth 2.0 Client ID
4. Add to **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   http://localhost:5000
   ```
5. Click **Save**
6. Wait 5 minutes
7. Clear browser cache (Ctrl+Shift+R)

**Root Cause:** Origin not authorized in Google Cloud Console  
**Solution:** Add origin to authorized list  
**Details:** See `GOOGLE_OAUTH_SETUP.md`

---

### Issue 4: Face ID Not Loading

**Symptom:** Face ID button doesn't appear

**Quick Fix:**
```jsx
// Check if models are loaded
import { areModelsLoaded } from '../services/cameraFaceId';

useEffect(() => {
  console.log('Models loaded:', areModelsLoaded());
}, []);
```

**Common Causes:**
- Models not in `/public/models/` folder
- Network error loading models
- TensorFlow not initialized

**Solution:** Check browser console for specific error

---

### Issue 5: Google Sign-In Button Not Rendering

**Symptom:** Empty space where button should be

**Quick Fix:**
```jsx
// Check if Google API loaded
useEffect(() => {
  console.log('Google API:', window.google?.accounts?.id);
  console.log('Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
}, []);
```

**Common Causes:**
- Google API script not loaded
- Client ID missing in `.env`
- Initialization error

**Solution:** Check console logs and verify `.env` file

---

## 🔧 Development Commands

### Start Development Server
```bash
cd frontend
npm run dev
```

### Check Bundle Size
```bash
npm run build
npm run preview
```

### Run Lighthouse Audit
```bash
npm install -g lighthouse
lighthouse http://localhost:5173 --view
```

### Clear Node Modules (if issues persist)
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 Environment Variables Checklist

**frontend/.env:**
```env
✅ VITE_API_URL=http://localhost:5000/api
✅ VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
✅ VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

**backend/.env:**
```env
✅ PORT=5000
✅ MONGO_URI=mongodb+srv://...
✅ JWT_SECRET=your-secret
✅ STRIPE_SECRET_KEY=sk_test_...
✅ GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

---

## 🐛 Debugging Tips

### Check Console Logs
```javascript
// Look for these prefixes
[FaceID] - Face recognition logs
[Google Sign-In] - OAuth logs
[Stripe] - Payment logs
```

### Verify Imports
```javascript
// ❌ Bad - Eager loading
import FaceIdLogin from './FaceIdLogin';

// ✅ Good - Lazy loading
const FaceIdLogin = lazy(() => import('./FaceIdLogin'));
```

### Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Look for failed requests (red)
4. Check response status codes

### Verify Environment
```javascript
// In browser console
console.log(import.meta.env);
```

---

## 🚀 Performance Checklist

- [ ] Lazy loading implemented for heavy components
- [ ] Suspense boundaries added
- [ ] Dynamic imports for large libraries
- [ ] No console errors
- [ ] Lighthouse score > 90
- [ ] Page load < 2 seconds
- [ ] Bundle size < 6 MB

---

## 📞 Need Help?

1. **Check Documentation:**
   - `PERFORMANCE_FIXES.md` - Technical details
   - `GOOGLE_OAUTH_SETUP.md` - OAuth configuration
   - `LOGIN_PAGE_OPTIMIZATION_SUMMARY.md` - Overview

2. **Check Console:**
   - Look for error messages
   - Check network requests
   - Verify environment variables

3. **Common Solutions:**
   - Clear browser cache
   - Restart dev server
   - Check `.env` file
   - Verify Google Cloud Console settings

---

## 🎯 Quick Wins

### Improve Page Load:
```jsx
// Use lazy loading
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

### Reduce Bundle Size:
```javascript
// Use dynamic imports
const loadLibrary = async () => {
  const lib = await import('heavy-library');
  return lib;
};
```

### Fix Console Errors:
```javascript
// Add error boundaries
<ErrorBoundary fallback={<ErrorMessage />}>
  <Component />
</ErrorBoundary>
```

---

**Last Updated:** May 2, 2026  
**Quick Reference Version:** 1.0

---

*Keep this card handy for quick troubleshooting!* 🔧
