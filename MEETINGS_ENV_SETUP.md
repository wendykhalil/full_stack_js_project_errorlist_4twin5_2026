# Meeting Feature - Configuration Guide

## ✅ You Already Have Everything!

Your `.env` file already has **all required configuration** for the meetings feature. No additional API keys needed!

### What's Already Configured ✓

**Authentication & Database:**
- ✅ `JWT_SECRET` - For secure user tokens
- ✅ `MONGO_URI` - For storing meetings in database

**Email Notifications (SMTP):**
- ✅ `SMTP_HOST=smtp.gmail.com`
- ✅ `SMTP_PORT=587`
- ✅ `SMTP_USER` - Your email
- ✅ `SMTP_PASS` - Your email password/app password
- ✅ `SMTP_FROM` - Sender email
- ✅ `APP_BASE_URL` - For email links

---

## ⚠️ Common Issues & Solutions

### Issue: "You get disconnected when creating a meeting"

**Root Cause:**
- Email sending was blocking the response
- If email failed, it would hang or timeout

**✅ Fixed!**
- Changed email sending to **async (fire and forget)**
- Now meeting is created immediately without waiting for email
- Email sends in background without blocking the response

### Issue: Email Not Sending

**If emails don't arrive, check:**

1. **Gmail Requires App Password** (not your regular password)
   - Go to: https://myaccount.google.com/apppasswords
   - Generate an app-specific password
   - Use that in `SMTP_PASS` instead of your regular password

2. **Verify SMTP Settings:**
   ```bash
   # Check these values in your .env:
   SMTP_HOST=smtp.gmail.com          # ✓ Correct
   SMTP_PORT=587                     # ✓ Correct
   SMTP_USER=yourEmail@gmail.com     # ✓ Must be valid email
   SMTP_PASS=yourAppPassword         # ✓ Must be app-specific password
   SMTP_FROM="Company name <email>"  # ✓ Can be any sender name
   ```

3. **Check Server Logs:**
   - Terminal where backend is running should show:
     - ✓ "Meeting created successfully"
     - ✓ Email sending messages (even if email fails, won't block response)

---

## 🧪 Testing the Feature Now

### Step 1: Create a Meeting (As Prescripteur)
```
1. Go to /prescripteur/artisans
2. Click "Voir profil" on any artisan
3. Click "Planifier une réunion"
4. Select date → time → confirm
5. ✅ Should see success message immediately
```

**Result:**
- Meeting saved to database ✓
- Response sent immediately ✓
- Email sent in background (no timeout) ✓

### Step 2: Check Backend Console
Look for messages like:
```
✓ Meeting created successfully
✓ Sending confirmation email to: example@gmail.com
```

### Step 3: View Meetings
```
Artisan: Go to /artisan/meetings → See pending requests
Prescripteur: Go to /prescripteur/meetings → See scheduled meetings
```

---

## 📋 Environment Variables Summary

| Variable | Required | Example | Status |
|----------|----------|---------|--------|
| `JWT_SECRET` | ✅ Yes | `superlongrandomsecret123` | ✓ Set |
| `MONGO_URI` | ✅ Yes | `mongodb+srv://...` | ✓ Set |
| `APP_BASE_URL` | ✅ Yes | `http://localhost:5173` | ✓ Set |
| `SMTP_HOST` | ✅ Yes | `smtp.gmail.com` | ✓ Set |
| `SMTP_PORT` | ✅ Yes | `587` | ✓ Set |
| `SMTP_USER` | ✅ Yes | `your-email@gmail.com` | ✓ Set |
| `SMTP_PASS` | ✅ Yes | `app-specific-password` | ⚠️ Check |
| `SMTP_FROM` | ✅ Yes | `BMP.tn <email@gmail.com>` | ✓ Set |

---

## ❌ What's NOT Needed

The following were mentioned but **NOT** required for meetings feature:

- ❌ Cal.com API key - Not implemented (can add later as enhancement)
- ❌ Zoom API key - Not needed for basic scheduling
- ❌ Google Calendar API - Not needed for basic scheduling
- ❌ Stripe API - Already configured, not needed for meetings

**Simple approach = just database + email!** ✓

---

## 🔧 If Still Getting Disconnected

1. **Restart backend server:**
   ```bash
   # In terminal (backend folder)
   npm run dev
   ```

2. **Clear browser cache & localStorage:**
   ```javascript
   // In browser console (F12):
   localStorage.clear()
   // Then reload page
   ```

3. **Check browser console (F12):**
   - Network tab → Look at `/api/meetings` request
   - Response should show: `{"ok": true, "message": "Meeting created successfully", ...}`

4. **Check backend console:**
   - Should show no errors
   - If email errors appear, they won't block the response anymore

---

## ✨ Summary

**No additional setup needed!** Your `.env` is already configured. The disconnect issue was fixed by making emails truly async.

Just restart your backend server and try creating a meeting again. It should work smoothly now!
