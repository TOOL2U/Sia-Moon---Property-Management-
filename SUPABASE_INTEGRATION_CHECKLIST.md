# Supabase Integration Check List

Use this checklist to verify that your Supabase integration is set up correctly.

## 1. Environment Variables Check

- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set correctly in `.env.local`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set correctly in `.env.local`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set correctly in `.env.local` (optional, for admin operations)

## 2. Supabase Setup Check

### Database Tables
- [ ] `profiles` table exists and has the correct schema
- [ ] `properties` table exists and has the correct schema
- [ ] `bookings` table exists and has the correct schema
- [ ] `tasks` table exists and has the correct schema
- [ ] `reports` table exists and has the correct schema
- [ ] `notifications` table exists and has the correct schema

### Database Triggers
- [ ] Profile creation trigger exists to automatically create a profile when a user signs up
  ```sql
  -- Add this trigger if it doesn't exist
  create or replace function public.handle_new_user()
  returns trigger as $$
  begin
    insert into public.profiles (id, email, full_name, role)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', new.email),
      coalesce(new.raw_user_meta_data->>'role', 'client')
    );
    return new;
  end;
  $$ language plpgsql security definer;

  create or replace trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
  ```

### Storage Buckets
- [ ] `villa-documents` bucket exists and is correctly configured
- [ ] Storage permissions are set up correctly

## 3. Authentication Flow Check

- [ ] Sign up works correctly and creates a user in Supabase auth
- [ ] Sign in works correctly and retrieves the user's session
- [ ] Profile is automatically created when a user signs up
- [ ] Sign out works correctly and clears the session
- [ ] Users are redirected to the correct dashboard after signing in

## 4. Data Operations Check

- [ ] Can create new properties
- [ ] Can read property data
- [ ] Can update property data
- [ ] Can delete property data
- [ ] Can create bookings
- [ ] Can read booking data
- [ ] Can update booking status
- [ ] Can delete bookings

## 5. Webhook Integration

- [ ] Webhooks are configured correctly in Supabase
- [ ] Webhook endpoints correctly process data from Supabase

## 6. Error Handling

- [ ] App gracefully handles Supabase connection errors
- [ ] App shows appropriate error messages for auth failures
- [ ] App has fallbacks for when Supabase is temporarily unavailable

## How to Use This Checklist

1. Run the provided test scripts:
   ```bash
   node test-supabase.js
   node test-profile-creation.js
   ```

2. Check your Supabase database for the required tables and triggers:
   - Go to the [Supabase Dashboard](https://supabase.com)
   - Select your project
   - Go to the SQL Editor
   - Run: `select * from pg_triggers where tgname = 'on_auth_user_created';`
   - If no rows are returned, you need to add the profile creation trigger

3. Test the complete user flow in the application:
   - Sign up as a new user
   - Check that you are redirected to the dashboard
   - Verify that your profile appears in the Supabase profiles table
   - Test property creation and management

4. If you find any issues, address them using the guidance in this checklist.
