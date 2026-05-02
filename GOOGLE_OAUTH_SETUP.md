# Google OAuth Setup Guide

## 🔐 Fix "The given origin is not allowed for the given client ID" Error

This guide will help you configure Google OAuth correctly to fix the 403 error.

---

## Step-by-Step Configuration

### 1. Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Select your project (or create a new one)

### 2. Enable Google Identity Services API

1. In the left sidebar, click **APIs & Services** → **Library**
2. Search for "Google Identity Services API"
3. Click **Enable** (if not already enabled)

### 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - Choose **External** (for testing) or **Internal** (for organization)
   - Fill in:
     - App name: `BMP.tn`
     - User support email: Your email
     - Developer contact: Your email
   - Click **Save and Continue**
   - Skip scopes (click **Save and Continue**)
   - Add test users if needed
   - Click **Save and Continue**

4. Back to **Create OAuth client ID**:
   - Application type: **Web application**
   - Name: `BMP.tn Web Client`

### 4. Configure Authorized Origins

In the **Authorized JavaScript origins** section, add:

#### For Development:
```
http://localhost:5173
http://localhost:5000
http://127.0.0.1:5173
```

#### For Production:
```
https://yourdomain.com
https://www.yourdomain.com
```

**Important Notes:**
- ✅ Include the protocol (`http://` or `https://`)
- ✅ Do NOT include trailing slashes
- ✅ Match the exact port number
- ❌ Do NOT add paths (e.g., `/login`)

### 5. Configure Authorized Redirect URIs (Optional)

If you're using redirect-based OAuth flow:

```
http://localhost:5173/auth/callback
https://yourdomain.com/auth/callback
```

### 6. Save and Copy Client ID

1. Click **CREATE**
2. Copy the **Client ID** (looks like: `123456789-abc123.apps.googleusercontent.com`)
3. Click **OK**

### 7. Update Your .env File

In `frontend/.env`:

```env
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
```

Replace `YOUR_CLIENT_ID_HERE` with the Client ID you copied.

### 8. Restart Your Development Server

```bash
cd frontend
npm run dev
```

### 9. Clear Browser Cache

1. Open DevTools (F12)
2. Right-click the refresh button
3. Select **Empty Cache and Hard Reload**

Or use keyboard shortcut:
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

---

## Verification Checklist

- [ ] Google Cloud Console project created
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 Client ID created
- [ ] Authorized JavaScript origins added (with correct protocol and port)
- [ ] Client ID copied to `.env` file
- [ ] Development server restarted
- [ ] Browser cache cleared
- [ ] Google Sign-In button appears on login page
- [ ] No 403 errors in console
- [ ] Sign-in flow works correctly

---

## Common Issues and Solutions

### Issue 1: "The given origin is not allowed"

**Cause:** Origin not added to Google Cloud Console

**Solution:**
1. Double-check the URL in your browser (including port)
2. Add exact URL to Authorized JavaScript origins
3. Wait 5 minutes for changes to propagate
4. Clear browser cache

### Issue 2: "Invalid Client ID"

**Cause:** Wrong Client ID in `.env` file

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Copy the correct Client ID
3. Update `VITE_GOOGLE_CLIENT_ID` in `.env`
4. Restart dev server

### Issue 3: "Popup blocked"

**Cause:** Browser blocking OAuth popup

**Solution:**
1. Allow popups for `localhost` in browser settings
2. Or use redirect-based flow instead of popup

### Issue 4: "Access blocked: This app's request is invalid"

**Cause:** OAuth consent screen not configured

**Solution:**
1. Go to **APIs & Services** → **OAuth consent screen**
2. Complete all required fields
3. Add your email as a test user
4. Publish the app (or keep in testing mode)

### Issue 5: Changes not taking effect

**Cause:** Browser cache or Google propagation delay

**Solution:**
1. Wait 5-10 minutes for Google changes to propagate
2. Clear browser cache completely
3. Try in incognito/private mode
4. Restart browser

---

## Testing in Different Environments

### Local Development
```
Origin: http://localhost:5173
Client ID: Development Client ID
```

### Staging
```
Origin: https://staging.yourdomain.com
Client ID: Staging Client ID (or same as production)
```

### Production
```
Origin: https://yourdomain.com
Client ID: Production Client ID
```

**Best Practice:** Use separate OAuth clients for development and production.

---

## Security Best Practices

1. **Never commit Client ID to public repositories** (use `.env` files)
2. **Use different Client IDs for dev/staging/production**
3. **Regularly rotate Client Secrets** (if using server-side OAuth)
4. **Limit authorized origins** to only necessary domains
5. **Enable OAuth consent screen** with proper branding
6. **Add privacy policy and terms of service** URLs
7. **Monitor OAuth usage** in Google Cloud Console

---

## Debugging Tips

### Check Console Logs

Look for these messages in browser console:

```javascript
// ✅ Good - Initialization successful
[Google Sign-In] Initialized successfully

// ❌ Bad - Client ID missing
[Google Sign-In] VITE_GOOGLE_CLIENT_ID not configured

// ❌ Bad - Google API not loaded
[Google Sign-In] Google Identity Services not loaded

// ❌ Bad - Origin not allowed
403: The given origin is not allowed for the given client ID
```

### Verify Environment Variable

In browser console:
```javascript
console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID);
// Should output your Client ID
```

### Check Network Tab

1. Open DevTools → Network tab
2. Look for requests to `accounts.google.com`
3. Check for 403 errors
4. Verify request headers include correct origin

---

## Additional Resources

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web/guides/overview)
- [OAuth 2.0 for Web Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth Consent Screen Configuration](https://support.google.com/cloud/answer/10311615)

---

## Support

If you're still experiencing issues:

1. Check [Google Identity Services Status](https://status.cloud.google.com/)
2. Review [Google OAuth Troubleshooting Guide](https://developers.google.com/identity/gsi/web/guides/troubleshooting)
3. Check browser console for detailed error messages
4. Verify all configuration steps were completed

---

## Quick Reference

### Authorized JavaScript Origins Format
```
✅ Correct:
http://localhost:5173
https://yourdomain.com

❌ Incorrect:
localhost:5173 (missing protocol)
http://localhost:5173/ (trailing slash)
http://localhost:5173/login (includes path)
```

### Client ID Format
```
✅ Correct:
123456789-abc123def456.apps.googleusercontent.com

❌ Incorrect:
123456789 (incomplete)
YOUR_CLIENT_ID_HERE (placeholder not replaced)
```

---

**Last Updated:** May 2, 2026  
**Version:** 1.0
