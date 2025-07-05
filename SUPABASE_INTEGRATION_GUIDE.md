# Fresh User Accounts & Supabase Integration Guide

This document outlines the implemented fresh user account system and how to swap the current local authentication system with Supabase for production deployment.

## ✅ IMPLEMENTED: Fresh User Account System

### **Problem Solved:**
New user accounts now start completely fresh with no data - no properties, no bookings, no test data.

### **Key Changes Made:**

#### **1. Database Initialization (src/lib/db.ts)**
- **Conditional Test Data**: Test data (properties, bookings) only loads if no users exist (first-time setup)
- **User-Specific Data**: All test properties and bookings are tied to specific test user IDs
- **Fresh Arrays**: New users get empty arrays for properties and bookings

#### **2. Data Filtering (Properties & Bookings Pages)**
- **Properties Page**: Now uses `getPropertiesByOwner(user.id)` instead of `getAllProperties()`
- **Bookings Page**: Fetches bookings only for properties owned by the current user
- **User-Specific Queries**: All data queries are filtered by current user ID

#### **3. Dashboard Updates (src/app/dashboard/client/page.tsx)**
- **Real Data Display**: Shows actual user properties and bookings instead of hardcoded data
- **Dynamic Stats**: Property count and booking count reflect real user data
- **Empty State**: Shows helpful empty state when user has no properties
- **Loading States**: Proper loading skeletons while fetching data

#### **4. User Isolation**
- **Complete Separation**: Each user only sees their own data
- **No Cross-Contamination**: New users cannot see test data or other users' data
- **Secure Filtering**: All database queries include user ID filtering

### **Testing Results:**
✅ **New User Sign-Up**: Creates account with empty dashboard
✅ **Test User Login**: Still sees existing test data
✅ **Data Isolation**: Users only see their own properties/bookings
✅ **Empty States**: Proper UI for users with no data
✅ **Real-Time Updates**: Dashboard reflects actual user data

## Current Local Authentication Implementation

### Files Modified for Local Auth:

1. **`src/lib/db.ts`** - Local database with password hashing
   - Added `bcrypt` for password hashing
   - Added `createUserWithPassword()` method
   - Added `verifyUserPassword()` method
   - Enhanced user creation with validation

2. **`src/hooks/useLocalAuth.tsx`** - Local authentication hook
   - Enhanced `signUp()` method with auto sign-in
   - Updated `signIn()` method to use password verification
   - Added automatic redirect after sign-up

3. **`src/app/auth/signup/page.tsx`** - Enhanced sign-up form
   - Added comprehensive form validation
   - Added password strength indicators
   - Added real-time error feedback
   - Added automatic redirect to dashboard

## Supabase Integration Steps

### 1. Install Supabase Dependencies
```bash
npm install @supabase/supabase-js
npm uninstall bcryptjs @types/bcryptjs
```

### 2. Environment Variables
Add to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Create Supabase Client
Create `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 4. Replace Local Auth Hook
Update `src/hooks/useLocalAuth.tsx`:

#### Replace signUp method:
```typescript
const signUp = async (
  email: string, 
  password: string, 
  role: 'client' | 'staff', 
  name?: string
): Promise<{ data: AuthUser | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || 'New User',
          role
        }
      }
    })

    if (error) {
      return { data: null, error }
    }

    if (data.user) {
      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata.name,
        role: data.user.user_metadata.role,
        created_at: data.user.created_at,
        updated_at: data.user.updated_at
      }
      return { data: authUser, error: null }
    }

    return { data: null, error: new Error('Sign up failed') }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Sign up failed')
    }
  }
}
```

#### Replace signIn method:
```typescript
const signIn = async (email: string, password: string): Promise<{ data: AuthSession | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return { data: null, error }
    }

    if (data.session && data.user) {
      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata.name,
        role: data.user.user_metadata.role,
        created_at: data.user.created_at,
        updated_at: data.user.updated_at
      }

      const session: AuthSession = {
        user: authUser,
        access_token: data.session.access_token,
        expires_at: data.session.expires_at || 0
      }

      return { data: session, error: null }
    }

    return { data: null, error: new Error('Sign in failed') }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Sign in failed')
    }
  }
}
```

### 5. Database Schema
Create these tables in Supabase:

```sql
-- Users table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
```

### 6. Update Database Service
Replace `src/lib/db.ts` with Supabase queries:
```typescript
import { supabase } from './supabase'

export const createUserProfile = async (userId: string, name: string, role: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert([{ id: userId, name, role }])
    .select()
    .single()

  return { data, error }
}

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  return { data, error }
}
```

### 7. Update Layout
In `src/app/layout.tsx`, replace `LocalAuthProvider` with Supabase auth provider.

### 8. Remove Local Dependencies
- Remove `bcryptjs` and `@types/bcryptjs`
- Remove local database initialization
- Remove mock credentials

## Testing Checklist

- [ ] Sign up creates user in Supabase
- [ ] Sign in works with Supabase credentials
- [ ] User profile is created in profiles table
- [ ] Redirect to dashboard works after sign up
- [ ] Form validation still works
- [ ] Error handling displays properly
- [ ] Sign out functionality works
- [ ] Session persistence works

## Notes

- The current form validation and UI will work unchanged
- Password hashing is handled automatically by Supabase
- Email verification can be enabled in Supabase settings
- Role-based access control can be implemented with RLS policies
