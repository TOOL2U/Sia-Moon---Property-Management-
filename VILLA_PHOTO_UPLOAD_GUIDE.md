# Villa Photo Upload & Admin Download System

## Overview
The villa photo upload system allows property owners to upload photos of their villas during the onboarding process, and provides administrators with tools to download and manage these photos.

## Features

### For Property Owners (Onboarding)
- **Drag & Drop Upload**: Users can drag photos directly into the upload area
- **File Selection**: Traditional file picker with support for multiple files
- **Image Validation**: Only image files (JPG, PNG, WebP) up to 10MB each
- **Real-time Preview**: Uploaded photos are displayed in a grid with thumbnails
- **Delete Function**: Users can remove photos they've uploaded
- **Firebase Storage**: All photos are securely stored in Firebase Storage
- **Organized Structure**: Photos are organized by user ID and villa name

### For Administrators
- **Browse All Folders**: View all available villa photo folders
- **Search by User/Villa**: Load photos for specific users or villas
- **Download Individual Photos**: Click to download any photo directly
- **Download Photo Lists**: Generate text files with all photo URLs for bulk access
- **Secure Access**: All photos are stored with proper Firebase security rules

## File Organization Structure

```
villa-photos/
├── {userId1}/
│   ├── {villaName1}/
│   │   ├── photo_timestamp_randomId.jpg
│   │   ├── photo_timestamp_randomId.png
│   │   └── ...
│   ├── {villaName2}/
│   │   └── ...
│   └── temp/ (for unnamed villas)
│       └── ...
├── {userId2}/
│   └── ...
```

## Usage Instructions

### For Property Owners
1. Navigate to the onboarding form (`/onboard`)
2. Scroll to the "Photos & Media" section
3. Use the photo upload area to add villa photos:
   - Drag and drop multiple photos, or
   - Click "Select Photos" to use file picker
4. Photos will appear in a grid below the upload area
5. Delete unwanted photos using the trash icon
6. Continue with the rest of the onboarding process

### For Administrators
1. Use the `AdminVillaPhotoDownload` component in admin panels
2. Browse all available folders to see what's uploaded
3. Enter specific User ID and Villa ID to load photos
4. Download individual photos or generate URL lists
5. Share photo access with team members as needed

## Technical Implementation

### Components
- **`VillaPhotoUpload`**: Client-side upload component for onboarding form
- **`AdminVillaPhotoDownload`**: Admin component for browsing and downloading

### Firebase Storage Integration
- Photos are uploaded to Firebase Storage
- Secure storage rules prevent unauthorized access
- Photos are organized in a clear folder structure
- Download URLs are generated for admin access

### Security Features
- File type validation (images only)
- File size limits (10MB per photo)
- User-specific folder isolation
- Firebase security rules for admin access

## Admin Component Usage

```tsx
import { AdminVillaPhotoDownload } from '@/components/AdminVillaPhotoDownload'

// In admin interface
<AdminVillaPhotoDownload className="mt-6" />
```

## Environment Variables Required
Ensure Firebase Storage is properly configured:
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- All other Firebase configuration variables

## Notes
- Photos are stored permanently until manually deleted
- Admin download generates URL lists for easy access
- Each photo has a unique filename to prevent conflicts
- The system gracefully handles missing Firebase configuration
- Villa IDs are sanitized for safe folder names
- Temporary folder "temp" is used for villas without names

## Future Enhancements
- Batch download functionality
- Photo compression before upload
- Metadata storage for better organization
- Integration with property management system
- Automated photo processing and optimization
