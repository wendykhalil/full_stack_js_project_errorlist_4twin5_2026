# 🧪 Face ID Quick Test & Debug

## 🚀 **Quick Test Script**

Open your browser console (F12) and run this test:

```javascript
// Face ID Quick Test Script
async function testFaceId() {
  console.log('🧪 Starting Face ID compatibility test...');
  
  // Test 1: Basic WebAuthn support
  if (!window.PublicKeyCredential) {
    console.error('❌ WebAuthn not supported in this browser');
    return;
  }
  console.log('✅ WebAuthn supported');
  
  // Test 2: Platform authenticator availability
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!available) {
      console.error('❌ Platform authenticator (Face ID/Touch ID) not available');
      console.log('💡 Enable Face ID/Touch ID/Windows Hello in device settings');
      return;
    }
    console.log('✅ Platform authenticator available');
  } catch (error) {
    console.error('❌ Error checking platform authenticator:', error);
    return;
  }
  
  // Test 3: Conditional UI support (optional)
  try {
    const conditionalUI = await PublicKeyCredential.isConditionalMediationAvailable();
    console.log(conditionalUI ? '✅ Conditional UI supported' : '⚠️ Conditional UI not supported (optional)');
  } catch (error) {
    console.log('⚠️ Conditional UI check failed (optional feature)');
  }
  
  // Test 4: Check current registration status
  const isRegistered = localStorage.getItem('faceId_registered') === 'true';
  const hasCredential = localStorage.getItem('faceId_credential') !== null;
  
  console.log(`📊 Registration Status:`);
  console.log(`   - Locally registered: ${isRegistered}`);
  console.log(`   - Has credential: ${hasCredential}`);
  
  if (hasCredential) {
    try {
      const credential = JSON.parse(localStorage.getItem('faceId_credential'));
      console.log(`   - User ID: ${credential.userId}`);
      console.log(`   - User Email: ${credential.userEmail}`);
      console.log(`   - Registered: ${credential.registeredAt}`);
    } catch (error) {
      console.error('❌ Invalid credential data stored');
    }
  }
  
  console.log('🎉 Face ID test completed! Check results above.');
}

// Run the test
testFaceId();
```

## 🔧 **Clear Face ID Data Script**

If you need to reset Face ID completely:

```javascript
// Clear all Face ID data
function clearFaceIdData() {
  console.log('🧹 Clearing Face ID data...');
  
  // Remove all Face ID related localStorage items
  localStorage.removeItem('faceId_credential');
  localStorage.removeItem('faceId_registered');
  localStorage.removeItem('faceId_userId');
  localStorage.removeItem('faceId_userEmail');
  
  // Remove old format data (backward compatibility)
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('faceId_')) {
      localStorage.removeItem(key);
    }
  });
  
  console.log('✅ Face ID data cleared');
  console.log('💡 Now try setting up Face ID again in Profile → Security');
}

// Run if needed
// clearFaceIdData();
```

## 🎯 **Expected Test Results**

### **✅ Good Results:**
```
🧪 Starting Face ID compatibility test...
✅ WebAuthn supported
✅ Platform authenticator available
✅ Conditional UI supported
📊 Registration Status:
   - Locally registered: true
   - Has credential: true
   - User ID: 507f1f77bcf86cd799439011
   - User Email: user@example.com
   - Registered: 2024-01-15T10:30:00.000Z
🎉 Face ID test completed! Check results above.
```

### **❌ Problem Results:**
```
🧪 Starting Face ID compatibility test...
✅ WebAuthn supported
❌ Platform authenticator (Face ID/Touch ID) not available
💡 Enable Face ID/Touch ID/Windows Hello in device settings
```

## 🛠️ **Fix Based on Test Results**

### **If "WebAuthn not supported":**
- Update your browser to latest version
- Try Chrome, Edge, or Safari (better WebAuthn support)
- Ensure you're on HTTPS (required for WebAuthn)

### **If "Platform authenticator not available":**
- **iOS**: Settings → Face ID & Passcode → Enable Face ID
- **macOS**: System Preferences → Touch ID → Set up Touch ID
- **Windows**: Settings → Accounts → Sign-in options → Set up Windows Hello
- **Android**: Settings → Security → Biometrics → Set up fingerprint/face

### **If "Invalid credential data":**
- Run the clear data script above
- Set up Face ID again from scratch

## 🔍 **Manual Test Steps**

### **1. Test Device Biometrics First:**
Before testing on website, verify biometrics work:
- **iOS**: Try unlocking phone with Face ID
- **macOS**: Try unlocking Mac with Touch ID
- **Windows**: Try signing into Windows with Hello
- **Android**: Try unlocking with fingerprint/face

### **2. Test Browser Permissions:**
- Ensure site is loaded over HTTPS
- Check if browser has biometric permissions
- Try in incognito/private mode to reset permissions

### **3. Test Face ID Setup:**
1. Go to **Profile → Security & Authentication**
2. Click **"Set up Face ID"**
3. Should see **system biometric prompt** (not camera)
4. Complete biometric authentication
5. Should see success message

### **4. Test Face ID Login:**
1. **Logout** completely
2. Go to **login page**
3. Click **"Sign in with Face ID"**
4. Should see **same system biometric prompt**
5. Complete authentication
6. Should login automatically

## 📱 **Device-Specific Notes**

### **iOS Safari:**
- Face ID prompt shows Apple's native Face ID animation
- May require enabling "Use Face ID for Safari" in settings
- Works best in Safari browser

### **macOS Safari/Chrome:**
- Touch ID prompt shows system Touch ID dialog
- May require enabling "Use Touch ID for Safari"
- Works in both Safari and Chrome

### **Windows Edge/Chrome:**
- Windows Hello prompt shows system Hello dialog
- May show face, fingerprint, or PIN options
- PIN option should be avoided (indicates biometric failure)

### **Android Chrome:**
- Shows system fingerprint/face unlock prompt
- May vary by device manufacturer
- Requires Chrome 67+ for full WebAuthn support

---

**Run the test script above to diagnose your specific issue!** 🔍