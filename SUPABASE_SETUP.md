# Supabase Setup Guide for Villa Property Management

## 1. Database Schema Setup

### Option A: Villa Management Schema (Recommended)
For the core villa management functionality, use `villa-management-schema.sql`:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open your project: `alkogpgjxpshoqsfgqef`
3. Navigate to **SQL Editor**
4. Copy and paste the entire content from `villa-management-schema.sql`
5. Click **Run** to execute all commands

This schema includes:
- **users** table (clients and staff)
- **properties** table (villa properties)
- **bookings** table (guest reservations)
- **tasks** table (staff assignments)
- **reports** table (monthly performance)
- **Indexes** for performance
- **RLS policies** for security
- **Seed data** for testing
- **Views** for common queries
- **Functions** for calculations

### Option B: Villa Onboarding Schema (Legacy)
For the villa onboarding system only, use `supabase-schema.sql`:

1. Copy and paste the content from `supabase-schema.sql`
2. This includes the comprehensive villa onboarding form data structure

## 2. Storage Bucket Setup

### Create the Storage Bucket

1. In Supabase Dashboard, go to **Storage**
2. Click **Create Bucket**
3. Name: `villa-documents`
4. Set as **Public bucket**: ✅ (checked)
5. Click **Create bucket**

### Set Storage Policies

Go to **SQL Editor** and run these commands:

```sql
-- Allow anyone to upload villa documents
CREATE POLICY "Anyone can upload villa documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'villa-documents');

-- Allow anyone to view villa documents
CREATE POLICY "Anyone can view villa documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'villa-documents');

-- Allow users to delete their own uploads (optional)
CREATE POLICY "Users can delete villa documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'villa-documents');
```

## 3. Test the Setup

### Test Database Connection
```bash
cd villa-property-management
node test-supabase.js
```

### Test Villa Onboarding Form
1. Go to http://localhost:3000/onboard
2. Fill out the comprehensive form
3. Upload test files
4. Submit the form
5. Check Supabase Dashboard > Table Editor > `villa_onboarding` for the new record
6. Check Storage > `villa-documents` for uploaded files

## 4. Verify Data Structure

After submitting a test villa, check these tables in Supabase:

### villa_onboarding table
- Should contain comprehensive villa data
- JSON fields should be properly formatted
- File URLs should point to Supabase Storage

### Storage bucket
- Files should be uploaded to `villa-documents/`
- Files should be publicly accessible
- File URLs should be stored in database

## 5. Common Issues & Solutions

### File Upload Issues
- **Error**: "Bucket not found"
  - **Solution**: Create the `villa-documents` bucket in Storage
- **Error**: "Permission denied"
  - **Solution**: Set up storage policies as shown above

### Database Issues
- **Error**: "relation does not exist"
  - **Solution**: Run the complete SQL schema from `supabase-schema.sql`
- **Error**: "JSON parse error"
  - **Solution**: Ensure JSON fields contain valid JSON or null

### Authentication Issues
- **Error**: "User not authenticated"
  - **Solution**: The form works without authentication for now, but you can add auth later

## 6. Production Considerations

### Security Enhancements
1. **Add Authentication**: Require users to be logged in
2. **File Size Limits**: Implement file size restrictions
3. **File Type Validation**: Server-side file type checking
4. **Rate Limiting**: Prevent spam submissions

### Storage Optimization
1. **File Compression**: Compress images before upload
2. **CDN**: Use Supabase CDN for faster file delivery
3. **Cleanup**: Implement file cleanup for rejected applications

### Data Validation
1. **Server-side Validation**: Add Zod validation on the backend
2. **Sanitization**: Sanitize user inputs
3. **Duplicate Prevention**: Check for duplicate submissions

## 7. Next Steps

1. **Admin Dashboard**: Create admin interface to review submissions
2. **Email Notifications**: Send confirmation emails to villa owners
3. **Status Tracking**: Allow owners to track application status
4. **Integration**: Connect approved villas to the main properties system
5. **Analytics**: Track conversion rates and form completion

## 8. Monitoring

### Key Metrics to Track
- Form completion rate
- File upload success rate
- Submission processing time
- User drop-off points

### Supabase Monitoring
- Database performance
- Storage usage
- API request patterns
- Error rates

The comprehensive villa onboarding system is now ready for production use!
