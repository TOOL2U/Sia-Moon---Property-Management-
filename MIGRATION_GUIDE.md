# 🔄 Local Database to Supabase Migration Guide

This guide explains how to switch from the local development database back to Supabase for production deployment.

## 📁 Files Modified for Local Development

### 1. **Database Layer**
- `src/lib/db.ts` - Local in-memory database
- `src/lib/dbService.ts` - Database service abstraction layer

### 2. **Authentication**
- `src/hooks/useLocalAuth.ts` - Local authentication hook
- `src/app/layout.tsx` - Uses LocalAuthProvider
- `src/components/layout/Header.tsx` - Uses useLocalAuth
- `src/app/auth/login/page.tsx` - Uses local auth

### 3. **Pages/Components**
- `src/app/dashboard/client/page.tsx` - Uses useLocalAuth
- `src/app/test-profile/page.tsx` - Uses local database service
- `src/middleware.ts` - Disabled for local development

## 🔄 Migration Steps to Supabase

### Step 1: Re-enable Supabase Authentication

1. **Update `src/app/layout.tsx`:**
```tsx
// Change from:
import { LocalAuthProvider } from '@/hooks/useLocalAuth'
<LocalAuthProvider>

// Back to:
import { AuthProvider } from '@/contexts/RealAuthContext'
<AuthProvider>
```

2. **Update `src/components/layout/Header.tsx`:**
```tsx
// Change from:
import { useLocalAuth } from '@/hooks/useLocalAuth'
const { user, signOut } = useLocalAuth()

// Back to:
import { useAuth } from '@/contexts/RealAuthContext'
const { user, signOut } = useAuth()
```

3. **Update `src/app/auth/login/page.tsx`:**
```tsx
// Change from:
import { useLocalAuth } from '@/hooks/useLocalAuth'
const { signIn } = useLocalAuth()

// Back to:
import { useAuth } from '@/contexts/RealAuthContext'
const { signIn } = useAuth()
```

4. **Update all dashboard pages:**
```tsx
// Change from:
import { useLocalAuth } from '@/hooks/useLocalAuth'
const { user } = useLocalAuth()

// Back to:
import { useAuth } from '@/contexts/RealAuthContext'
const { user } = useAuth()
```

### Step 2: Re-enable Middleware

**Update `src/middleware.ts`:**
```tsx
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Skip middleware if authentication is bypassed
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
    return
  }

  // Skip middleware if Supabase is not configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return
  }

  return await updateSession(request)
}
```

### Step 3: Replace Database Service

**Update `src/lib/dbService.ts`:**
```tsx
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export class DatabaseService {
  static async getUser(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  }

  static async getUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    return { data, error }
  }

  static async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
    return { data, error }
  }

  static async createUser(userData: any) {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single()
    return { data, error }
  }

  // ... implement other methods following the same pattern
}
```

### Step 4: Environment Variables

Ensure these are set in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_BYPASS_AUTH=false
```

### Step 5: Database Schema

Ensure your Supabase database has the correct schema:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('client', 'staff')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  owner_id UUID REFERENCES users(id),
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id),
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  status TEXT CHECK (status IN ('confirmed', 'pending', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🗑️ Files to Remove After Migration

After successful migration to Supabase, you can remove:
- `src/lib/db.ts`
- `src/hooks/useLocalAuth.ts`

## ✅ Testing Migration

1. **Test authentication flow**
2. **Test database operations**
3. **Test middleware redirects**
4. **Test all dashboard pages**
5. **Verify environment variables**

## 🚨 Important Notes

- **Backup your data** before migration
- **Test thoroughly** in a staging environment
- **Update all TODO comments** in the codebase
- **Verify all imports** are updated correctly
- **Check console for any errors** after migration

The local database abstraction was designed to make this migration as smooth as possible by maintaining the same API structure as Supabase.
