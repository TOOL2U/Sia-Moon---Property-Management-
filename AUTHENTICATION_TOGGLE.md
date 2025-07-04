# 🔐 Authentication Toggle Guide

## Overview

The Sia Moon Property Management application has a built-in authentication bypass feature for development convenience. This allows you to work on the application without constantly logging in during development.

## Current Status: ✅ **AUTHENTICATION BYPASSED**

Authentication is currently **disabled** for easier development. You can access all pages without logging in.

## How to Toggle Authentication

### 🔓 **To DISABLE Authentication (Current State)**

In your `.env.local` file, set:
```env
NEXT_PUBLIC_BYPASS_AUTH=true
```

**What this does:**
- ✅ Bypasses all login requirements
- ✅ Sets a mock user automatically
- ✅ Shows "AUTH BYPASSED" indicator in header
- ✅ Allows access to all protected routes
- ✅ Skips middleware authentication checks

### 🔒 **To ENABLE Authentication (Production Mode)**

In your `.env.local` file, set:
```env
NEXT_PUBLIC_BYPASS_AUTH=false
```

**What this does:**
- 🔒 Requires proper Supabase authentication
- 🔒 Redirects to login pages for protected routes
- 🔒 Enforces user sessions and permissions
- 🔒 Removes "AUTH BYPASSED" indicator
- 🔒 Full production authentication flow

## Visual Indicators

### Development Mode (Auth Bypassed)
- **Header Badge**: Shows "AUTH BYPASSED" in yellow
- **Mock User**: Automatically logged in as "Development User"
- **All Routes**: Accessible without login

### Production Mode (Auth Enabled)
- **No Badge**: Clean header without development indicators
- **Login Required**: Redirects to appropriate login pages
- **Protected Routes**: Require valid authentication

## Quick Toggle Commands

### Disable Auth (Development)
```bash
echo "NEXT_PUBLIC_BYPASS_AUTH=true" >> .env.local
```

### Enable Auth (Production)
```bash
echo "NEXT_PUBLIC_BYPASS_AUTH=false" >> .env.local
```

After changing the setting, restart the development server:
```bash
npm run dev
```

## Files Modified for Auth Bypass

1. **`src/contexts/AuthContext.tsx`**
   - Added bypass logic with mock user
   - Environment variable check

2. **`src/middleware.ts`**
   - Skips authentication middleware when bypassed

3. **`src/components/layout/Header.tsx`**
   - Shows visual indicator when auth is bypassed

4. **`.env.local`**
   - Contains the toggle setting

## Mock User Details (Development Mode)

When authentication is bypassed, the system uses this mock user:

```typescript
{
  id: 'dev-user-123',
  email: 'dev@siamoon.com',
  role: 'owner',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z'
}
```

## Production Deployment

**⚠️ IMPORTANT**: Before deploying to production, ensure:

1. Set `NEXT_PUBLIC_BYPASS_AUTH=false` in production environment
2. Configure proper Supabase credentials
3. Test authentication flow thoroughly
4. Verify all protected routes require login

## Troubleshooting

### Issue: Pages still require login after disabling auth
**Solution**: 
1. Check `.env.local` has `NEXT_PUBLIC_BYPASS_AUTH=true`
2. Restart the development server
3. Clear browser cache

### Issue: "AUTH BYPASSED" badge not showing
**Solution**:
1. Verify environment variable is set correctly
2. Check browser developer tools for the badge element
3. Restart development server

### Issue: Authentication not working after re-enabling
**Solution**:
1. Ensure Supabase credentials are configured
2. Check database schema is properly set up
3. Verify middleware configuration

## Security Notes

- ✅ Auth bypass only works in development environment
- ✅ Production builds ignore bypass setting for security
- ✅ Mock user has limited permissions
- ✅ No real authentication tokens are generated in bypass mode

## Next Steps

When you're ready to implement full authentication:

1. Set `NEXT_PUBLIC_BYPASS_AUTH=false`
2. Configure Supabase authentication
3. Set up user registration flows
4. Test login/logout functionality
5. Implement role-based permissions

The authentication system is fully implemented and ready to use when you disable the bypass!
