# Meeting Scheduling Feature - Debugging Guide

## Issues Fixed ✅

### 1. **Authentication Error ("Non autorisé")**
- **Cause**: Token not being sent or invalid token format
- **Fix**: Added error interceptor in meetingsService to handle 401 responses
- **File**: `frontend/src/services/meetingsService.js`

### 2. **"Erreur lors du chargement des réunions"**
- **Cause**: API responses had inconsistent structure
- **Fix**: Updated controllers to ensure consistent response format with `ok` flag and `meetings` array
- **Files**:
  - `backend/src/modules/meetings/meetings.controller.js`
  - `frontend/src/pages/Meetings.jsx`

### 3. **Authorization Issues**
- **Cause**: Role middleware not receiving proper user role
- **Fix**: Enhanced error handling to log actual error messages
- **Files**:
  - `frontend/src/components/ScheduleMeetingModal.jsx`
  - `frontend/src/pages/Meetings.jsx`

---

## Testing Checklist

### Prerequisites
- [ ] User is logged in
- [ ] Token is stored in localStorage
- [ ] User has appropriate role (ARTISAN or PRESCRIPTEUR)

### Step 1: Create a Meeting (As Prescripteur)
1. Navigate to `/prescripteur/artisans`
2. Click "Voir profil" on an artisan
3. Click "Planifier une réunion" button
4. Select a date from the calendar
5. Select a time slot
6. Click "Confirmer la réunion"

**Expected Outcome**:
- Success message appears
- Email sent to both parties
- Meeting appears in `/prescripteur/meetings`

### Step 2: View Meetings (As Artisan)
1. Navigate to `/artisan/meetings`
2. You should see pending meeting requests

**Expected Outcome**:
- List of meetings displays
- Status badge shows "En attente"
- Accept/Reject buttons are visible

### Step 3: Accept/Reject Meeting
1. Click "Accepter" or "Refuser" button
2. Meeting status updates
3. Prescripteur receives notification email

**Expected Outcome**:
- Status changes to "Acceptée" or "Refusée"
- Email notification sent
- Meeting refreshes in list

---

## Troubleshooting

### Error: "Non autorisé" (401)

**Check:**
```javascript
// Browser Console (F12 > Application > Local Storage)
// Verify token exists:
localStorage.getItem('token')
```

**If token is missing:**
- Log out and log back in
- Check that login request saved token

**If token exists:**
- Check token expiration: decode JWT at jwt.io
- Check if backend JWT_SECRET matches

### Error: "Erreur lors du chargement des réunions"

**Check in Browser Console (F12 > Network tab):**
1. Click on `/meetings/artisan/list` request
2. Check Response tab for actual error message
3. Common issues:
   - `"message": "Non autorisé"` → Token not sent/invalid
   - `"message": "Accès interdit"` → User doesn't have correct role
   - `"message": "User not authenticated"` → req.user is undefined

**If req.user is undefined:**
- Verify authRequired middleware is applied to route
- Check that User model is being populated correctly

### Error: Empty Calendar or No Availability

**Check:**
1. Verify artisan has set availability dates in `/artisan/availability`
2. Ensure availability status is "AVAILABLE" not "NOT_AVAILABLE"
3. Check browser console for network errors

### Email Not Sending

**Check:**
1. Verify SMTP config in `.env` (SMTP_HOST, SMTP_USER, SMTP_PASS)
2. Check console logs for email errors
3. Gmail may need app-specific password (not regular password)

---

## API Response Format

### Success Response
```json
{
  "ok": true,
  "meetings": [
    {
      "_id": "...",
      "artisanId": "...",
      "prescripteurId": "...",
      "status": "PENDING",
      "startDateTime": "2026-04-20T10:00:00Z",
      "endDateTime": "2026-04-20T11:00:00Z",
      ...
    }
  ]
}
```

### Error Response
```json
{
  "message": "Non autorisé" | "Accès interdit" | "Meeting not found" | etc.
}
```

---

## Browser Console Logs to Watch

When testing, check F12 > Console for:
- `API Error:` - Network/API issues
- `Error loading meetings:` - Frontend error handling
- JWT decoding errors - Token issues
- SMTP errors - Email issues

---

## Quick Test Script

Run this in browser console to test API:
```javascript
// Test 1: Check token
console.log('Token:', localStorage.getItem('token'));

// Test 2: Try to fetch artisan meetings
fetch('http://localhost:5000/api/meetings/artisan/list', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(d => console.log('Meetings:', d));
```

---

## Files Modified

### Backend
- ✅ `backend/src/models/Meeting.js` - Meeting model
- ✅ `backend/src/modules/meetings/meetings.controller.js` - API controllers
- ✅ `backend/src/modules/meetings/meetings.routes.js` - API routes
- ✅ `backend/src/utils/emailService.js` - Email notifications
- ✅ `backend/src/routes/index.js` - Route mounting

### Frontend
- ✅ `frontend/src/services/meetingsService.js` - API client
- ✅ `frontend/src/components/ScheduleMeetingModal.jsx` - Meeting booking UI
- ✅ `frontend/src/pages/Meetings.jsx` - Meetings management page
- ✅ `frontend/src/pages/ArtisanPublicProfile.jsx` - Added button
- ✅ `frontend/src/layouts/ArtisanLayout.jsx` - Added sidebar menu
- ✅ `frontend/src/layouts/PrescripteurLayout.jsx` - Added sidebar menu
- ✅ `frontend/src/App.jsx` - Added routes

---

## Support

If issues persist:
1. Check console logs for specific error messages
2. Check network requests in DevTools
3. Verify all files were edited correctly
4. Restart both frontend and backend servers
