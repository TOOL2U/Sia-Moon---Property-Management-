# Supabase Authentication Flow Setup Guide

This guide covers the setup and configuration of Supabase authentication for the Villa Management application.

## 1. Environment Setup

First, ensure your environment variables are correctly set in `.env.local`:

```
# Required Supabase variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 2. Database Tables

The authentication system requires a `profiles` table in your Supabase database:

```sql
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  role text default 'client',
  phone text,
  avatar_url text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Set up Row Level Security
alter table public.profiles enable row level security;

-- Create policies
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);
```

## 3. Profile Creation Trigger

To automatically create a user profile when a new user signs up, add this trigger:

```sql
-- Function to handle new user creation
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

-- Trigger to execute the function after a new user is created
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## 4. Authentication Flow

The auth flow consists of these key steps:

### Sign Up
1. User enters email, password, name, and role
2. App calls `signUp()` from `useSupabaseAuth` hook
3. Supabase creates a new user in `auth.users`
4. Trigger automatically creates entry in `profiles` table
5. User is redirected to dashboard

### Sign In
1. User enters email and password
2. App calls `signIn()` from `useSupabaseAuth` hook
3. Supabase verifies credentials and returns session
4. App loads user profile from `profiles` table
5. User is redirected to dashboard

### Sign Out
1. User clicks sign out button
2. App calls `signOut()` from `useSupabaseAuth` hook
3. Supabase clears the session
4. User is redirected to home page

## 5. Troubleshooting

### Missing Profile Issue

If you find that user profiles aren't being created automatically:

1. Check if the trigger is installed:
   ```sql
   select * from pg_triggers where tgname = 'on_auth_user_created';
   ```

2. If no results, run the trigger creation SQL from section 3

3. For existing users without profiles, run:
   ```sql
   insert into public.profiles (id, email, full_name, role)
   select 
     id, 
     email, 
     coalesce(raw_user_meta_data->>'full_name', email) as full_name, 
     coalesce(raw_user_meta_data->>'role', 'client') as role 
   from auth.users
   where id not in (select id from public.profiles);
   ```

### Testing Authentication

Run the test scripts to verify your setup:

```bash
node test-supabase.js
node test-profile-creation.js
```

## 6. Dashboard Routing

After sign-in/sign-up, users should be redirected to the appropriate dashboard based on their role:

- Client users: `/dashboard/client`
- Staff users: `/dashboard/staff`
- Owner users: `/dashboard/owner`

The redirection is handled in `useSupabaseAuth.ts` when a user is authenticated.

## 7. Security Considerations

- Never expose the service role key to the client
- Ensure Row Level Security (RLS) policies are in place for all tables
- Use HTTPS in production to protect authentication tokens
- Set appropriate CORS policies in Supabase project settings
- Consider adding email verification for new sign-ups

## 8. Next Steps

- Implement social login (Google, Facebook, etc.)
- Add two-factor authentication for staff accounts
- Set up password reset flow
- Create admin panel for user management
