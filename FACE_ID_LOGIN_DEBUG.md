# 🔧 Face ID Login Debug - Step by Step Fix

## 🚨 **Issue: Face ID Login Refreshes Page Instead of Logging In**

The problem is likely in the authentication flow between frontend and backend. Let's debug this step by step.

## 🧪 **Step 1: Clear All Face ID Data (Fresh Start)**

Open browser console (F12) and run:

```javascript
// Clear all Face ID data for fresh start
localStorage.removeItem('faceId_credential');
localStorage.removeItem('faceId_registered');
localStorage.removeItem('faceId_userId');
localStorage.removeItem('faceId_userEmail');
localStorage.removeItem('token');
localStorage.removeItem('bmptn_token');
localStorage.removeItem('bmptn_user');

// Clear any old format data
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('faceId_')) {
    localStorage.removeItem(key);
  }
});

console.log('✅ All Face ID data cleared - ready for fresh setup');
```

## 🔧 **Step 2: Test Backend is Running**

```javascript
// Test if backend Face ID routes are working
fetch('/api/faceid/stats')
  .then(response => {
    console.log('Backend status:', response.status);
    return response.json();
  })
  .then(data => console.log('Backend response:', data))
  .catch(error => console.error('❌ Backend not responding:', error));
```

## 🎯 **Step 3: Fresh Face ID Setup**

1. **Login normally** with email/password
2. **Go to Profile** → **Security & Authentication**
3. **Click "Set up Face ID"**
4. **Complete the passkey/biometric prompt**
5. **Check console for success messages**

**Expected console output:**
```
Starting Face ID registration with options: {...}
Face ID credential created successfully
Face ID credentials stored successfully
🎉 [Biometric Type] configured successfully!
```

## 🔍 **Step 4: Debug Face ID Login**

### **Test 1: Check Stored Credentials**
```javascript
// Check what's stored after setup
const registered = localStorage.getItem('faceId_registered');
const credential = localStorage.getItem('faceId_credential');

console.log('Registered:', registered);
console.log('Has credential:', !!credential);

if (credential) {
  try {
    const parsed = JSON.parse(credential);
    console.log('Credential data:', {
      id: parsed.id,
      userId: parsed.userId,
      userEmail: parsed.userEmail,
      registeredAt: parsed.registeredAt
    });
  } catch (error) {
    console.error('❌ Invalid credential data:', error);
  }
}
```

### **Test 2: Manual Face ID Authentication Test**
```javascript
// Test Face ID authentication manually
async function testFaceIdAuth() {
  try {
    console.log('🧪 Testing Face ID authentication...');
    
    // Import the Face ID service (adjust path if needed)
    const { authenticateWithFaceId } = await import('./src/services/faceIdAuth.js');
    
    const result = await authenticateWithFaceId();
    console.log('✅ Face ID auth result:', result);
    
    if (result.success && result.user && result.token) {
      console.log('✅ Authentication successful!');
      console.log('User:', result.user);
      console.log('Token:', result.token ? 'Present' : 'Missing');
    } else {
      console.error('❌ Invalid authentication response:', result);
    }
  } catch (error) {
    console.error('❌ Face ID authentication failed:', error);
  }
}

// Run the test
testFaceIdAuth();
```

### **Test 3: Check Network Requests**
1. **Open Developer Tools** → **Network** tab
2. **Clear network log**
3. **Try Face ID login**
4. **Look for these requests:**
   - `POST /api/faceid/authenticate` - Should return 200 with user/token
   - Check request payload has `credentialId`, `signature`, `storedUserId`, `storedUserEmail`
   - Check response has `success: true`, `user`, `token`

## 🔧 **Step 5: Fix Common Issues**

### **Issue A: "Face ID credentials not found"**
**Cause**: User not found in database or credential mismatch
**Fix**: 
1. Clear Face ID data (Step 1)
2. Re-register Face ID in profile
3. Ensure backend user has `faceIdCredentials` field

### **Issue B: Page refreshes without error**
**Cause**: JavaScript error in authentication handling
**Fix**: Check browser console for errors during login attempt

### **Issue C: Network request fails**
**Cause**: Backend not running or route not loaded
**Fix**: 
1. Ensure backend is running on correct port
2. Check if Face ID routes are loaded in server.js
3. Verify CORS settings allow the request

### **Issue D: Authentication succeeds but doesn't login**
**Cause**: AuthContext not properly updated
**Fix**: Check if `setSession` function is being called correctly

## 🛠️ **Step 6: Advanced Debugging**

### **Check Backend Logs**
Look for these messages in backend console:
```
Face ID authentication request: { credentialId: 'present', ... }
Face ID authentication successful for user: user@example.com
```

### **Check Frontend AuthContext**
```javascript
// Check if AuthContext is working
const authState = JSON.parse(localStorage.getItem('bmptn_user') || 'null');
const authToken = localStorage.getItem('bmptn_token');

console.log('Auth state:', authState);
console.log('Auth token:', authToken ? 'Present' : 'Missing');
```

### **Manual Login Test**
```javascript
// Test if manual login works with Face ID token
async function testManualLogin() {
  const credential = JSON.parse(localStorage.getItem('faceId_credential') || '{}');
  
  if (!credential.userId || !credential.userEmail) {
    console.error('❌ No valid Face ID credential found');
    return;
  }
  
  try {
    // Simulate what Face ID login should do
    const response = await fetch('/api/faceid/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credentialId: credential.id,
        signature: 'test_signature',
        authenticatorData: 'test_auth_data',
        clientDataJSON: 'test_client_data',
        storedUserId: credential.userId,
        storedUserEmail: credential.userEmail
      })
    });
    
    const result = await response.json();
    console.log('Manual auth test result:', result);
    
    if (result.success && result.token) {
      // Manually set auth state
      localStorage.setItem('bmptn_token', result.token);
      localStorage.setItem('bmptn_user', JSON.stringify(result.user));
      console.log('✅ Manual login successful - try refreshing page');
    }
  } catch (error) {
    console.error('❌ Manual login test failed:', error);
  }
}

// Run manual test
testManualLogin();
```

## 🎯 **Expected Working Flow**

1. **Setup**: Profile → Face ID setup → Success message
2. **Login**: Logout → Face ID button → Passkey prompt → Automatic login
3. **Console**: No errors, successful authentication messages
4. **Network**: 200 response from `/api/faceid/authenticate`
5. **Result**: Redirect to appropriate dashboard

## 🆘 **If Still Not Working**

### **Quick Fixes to Try:**
1. **Different browser** (Chrome, Safari, Edge)
2. **Incognito/private mode** (fresh permissions)
3. **Clear all browser data** for the site
4. **Restart backend server**
5. **Check backend .env file** has JWT_SECRET

### **Report These Details:**
1. **Browser console errors** during Face ID login
2. **Network tab** showing failed requests
3. **Backend console logs** during authentication
4. **Face ID setup success** but login failure
5. **Specific error messages** shown to user

---

**Run through these steps and let me know where it fails!** 🔍