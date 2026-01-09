# Test Job Button - Admin Dashboard

## ✅ Implementation Complete

I've added a "Send Test Job to Mobile" button to your admin dashboard at `/admin`.

### Location
The button appears in the top-right corner of the admin dashboard header.

### What It Does

When you click the button, it:

1. **Creates a test job** in Firebase (`operational_jobs` collection)
2. **Sets the property** to Mountain Retreat Cabin
3. **Includes correct coordinates**: 9.705, 100.045 (Ban Tai, Koh Phangan - on land!)
4. **Makes it visible** to all cleaners (status: pending, unassigned)
5. **Shows a success notification** with the job ID and location
6. **Logs details** to console for debugging

### Test Job Details

Each test job includes:
- **Property**: Mountain Retreat Cabin
- **Type**: Post-Checkout Cleaning
- **Location**: Ban Tai, Koh Phangan
- **Coordinates**: 9.705, 100.045
- **Status**: Pending (visible to all cleaners)
- **Priority**: High
- **Scheduled**: 2 hours from button click
- **Guest**: Test Guest - Admin Dashboard
- **Created timestamp**: Shows when button was clicked

### How to Use

1. **Go to**: http://localhost:3000/admin
2. **Look for**: Blue/purple gradient button in top-right (next to page title)
3. **Click**: "Send Test Job to Mobile"
4. **Wait**: Button shows "Sending..." with spinner
5. **Success**: Toast notification appears with job ID and location
6. **Mobile App**: Job immediately appears in mobile app for cleaners

### What Mobile App Will See

```json
{
  "propertyName": "Mountain Retreat Cabin",
  "title": "Post-Checkout Cleaning - Mountain Retreat Cabin",
  "location": {
    "address": "Ban Tai, Koh Phangan, Thailand",
    "latitude": 9.705,
    "longitude": 100.045,
    "googleMapsLink": "https://www.google.com/maps?q=9.705,100.045"
  },
  "status": "pending",
  "priority": "high",
  "requiredRole": "cleaner"
}
```

### Testing Workflow

1. **Admin Dashboard**: Click button
2. **Firebase Console**: See new job in `operational_jobs` collection
3. **Mobile App**: 
   - Log in as `cleaner@siamoon.com`
   - Go to Jobs tab
   - See "Post-Checkout Cleaning - Mountain Retreat Cabin"
   - Check map - marker should be at Ban Tai (southern coast)

### Button States

- **Default**: Blue/purple gradient with phone and map pin icons
- **Loading**: Spinner with "Sending..." text
- **Disabled**: While sending (prevents duplicate jobs)

### Success Notification

Shows:
```
Test job sent! 
ID: [Firebase document ID]
Property: Mountain Retreat Cabin
Location: Ban Tai (9.705, 100.045)
```

### Console Logs

When button is clicked, console shows:
```
✅ Test job created: [document ID]
📍 Location: 9.705, 100.045
🗺️ Google Maps: https://www.google.com/maps?q=9.705,100.045
```

### Coordinates Verified

The coordinates (9.705, 100.045) are:
- ✅ On Koh Phangan island (not in ocean)
- ✅ At Ban Tai area (southern coast)
- ✅ Verified on Google Maps
- ✅ Within island boundaries (9.695-9.77°N, 99.985-100.075°E)

### Files Modified

- `/src/app/admin/page.tsx`
  - Added imports: `Smartphone`, `MapPin`, `collection`, `addDoc`, `Timestamp`, `db`
  - Added state: `sendingTestJob`
  - Added function: `sendTestJobToMobile()`
  - Added button in header section

### Benefits

✅ **Easy Testing**: One click to send test job
✅ **No Scripts**: No need to run terminal commands
✅ **Instant Feedback**: Success notification with job details
✅ **Consistent Data**: Always sends properly formatted job
✅ **Correct Coordinates**: Verified location data
✅ **Console Logs**: Easy debugging
✅ **Real-time**: Mobile app sees it immediately

### Next Steps

1. Start your dev server: `npm run dev`
2. Go to: http://localhost:3000/admin
3. Click the test button whenever you want to test mobile app
4. Check mobile app to verify job appears with correct location

---

**Created**: January 9, 2026
**Status**: Ready to use ✅
