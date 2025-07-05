# Supabase Quick Setup Guide

## 🚨 **Current Issue: API Keys Not Configured**

The Supabase integration tests are failing because the API keys are not properly configured. Here's how to fix it:

---

## **Step 1: Get Your API Keys**

1. **Open the Supabase API Settings:**
   - Go to: https://supabase.com/dashboard/project/alkogpgjxpshoqsfgqef/settings/api
   - (This should already be open in your browser)

2. **Copy the API Keys:**
   - Find the **"anon public"** key and copy it
   - Find the **"service_role secret"** key and copy it

---

## **Step 2: Update Environment Variables**

1. **Open your `.env.local` file**

2. **Replace the placeholder values:**
   ```env
   # Replace these lines:
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   
   # With the real keys from Supabase dashboard:
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsa29ncGdqeHBzaG9xc2ZncWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM0MjE5NzQsImV4cCI6MjA0ODk5Nzk3NH0.REAL_ANON_KEY_HERE
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsa29ncGdqeHBzaG9xc2ZncWVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzQyMTk3NCwiZXhwIjoyMDQ4OTk3OTc0fQ.REAL_SERVICE_ROLE_KEY_HERE
   ```

3. **Save the file**

---

## **Step 3: Set Up Database Schema**

1. **Go to Supabase SQL Editor:**
   - https://supabase.com/dashboard/project/alkogpgjxpshoqsfgqef/sql

2. **Run the Database Setup:**
   - Copy the contents of `supabase/manual_setup.sql`
   - Paste into the SQL Editor
   - Click "Run" to create all tables and functions

---

## **Step 4: Test the Connection**

1. **Run the connection test:**
   ```bash
   npm run test:supabase
   ```

2. **Or test via the web interface:**
   - Go to: http://localhost:3001/test-supabase
   - Click "Run All Tests"
   - All tests should now pass ✅

---

## **Step 5: Restart Development Server**

1. **Stop the current server** (Ctrl+C)

2. **Restart the development server:**
   ```bash
   npm run dev
   ```

3. **Test the application:**
   - Go to: http://localhost:3001/test-supabase
   - All tests should pass
   - Dashboard should work with real data

---

## **🔧 Troubleshooting**

### **If tests still fail:**

1. **Check API Keys:**
   - Make sure you copied the full keys (they're very long)
   - Ensure no extra spaces or characters
   - The anon key should start with `eyJhbGciOiJIUzI1NiIs...`

2. **Check Database Setup:**
   - Make sure you ran the SQL script in Supabase dashboard
   - Check that tables were created successfully

3. **Check Network:**
   - Ensure you have internet connection
   - Try accessing the Supabase dashboard directly

### **If you see "Invalid API key" errors:**
- Double-check you copied the correct keys
- Make sure you're using the "anon public" key (not the JWT secret)
- Ensure the service role key is the "secret" one

### **If you see "Table does not exist" errors:**
- Run the database setup SQL script
- Check the Supabase dashboard to see if tables were created

---

## **🎯 Expected Result**

After completing these steps:

✅ **All Supabase tests pass**  
✅ **Dashboard loads with real data**  
✅ **Authentication works**  
✅ **Database operations work**  
✅ **Edge Functions are accessible**  

---

## **📞 Need Help?**

If you're still having issues:

1. **Check the browser console** for detailed error messages
2. **Run the connection test script:** `npm run test:supabase`
3. **Verify your API keys** are correctly copied
4. **Ensure the database schema** was set up properly

**Once the API keys are configured, everything should work perfectly!** 🚀
