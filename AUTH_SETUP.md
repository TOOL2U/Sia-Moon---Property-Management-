# 🔐 Authentication Setup Guide

## Environment Variables

Update your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Authentication Mode
# Set to 'false' to enable real authentication
# Set to 'true' to bypass authentication (development only)
NEXT_PUBLIC_BYPASS_AUTH=false
```

## 🚀 Quick Setup Steps

### 1. Enable Authentication
```env
NEXT_PUBLIC_BYPASS_AUTH=false
```

### 2. Create Demo Users
Run the SQL script in Supabase:
```bash
# Copy and paste setup-auth-users.sql into Supabase SQL Editor
```

### 3. Create Auth Users in Supabase Dashboard

Go to **Supabase Dashboard > Authentication > Users** and create:

**Client User:**
- Email: `john.smith@example.com`
- Password: `password123`
- User ID: `550e8400-e29b-41d4-a716-446655440001`
- Auto Confirm: ✅ Yes

**Staff User:**
- Email: `sarah.johnson@siamoon.com`
- Password: `password123`
- User ID: `550e8400-e29b-41d4-a716-446655440002`
- Auto Confirm: ✅ Yes

### 4. Test Authentication

1. **Visit**: http://localhost:3000/auth/login
2. **Login with**:
   - Client: `john.smith@example.com` / `password123`
   - Staff: `sarah.johnson@siamoon.com` / `password123`

## 🔄 Authentication Flow

### Sign Up Process
1. User visits `/auth/signup`
2. Fills form with email, password, role, name
3. Creates Supabase Auth user
4. Creates profile in `users` table
5. Email verification sent

### Sign In Process
1. User visits `/auth/login`
2. Enters email/password
3. Supabase authenticates
4. Fetches user profile from `users` table
5. Redirects based on role:
   - Client → `/dashboard/client`
   - Staff → `/dashboard/staff`

### Route Protection
- **Protected routes**: `/dashboard/*`, `/properties`, `/bookings`, `/admin`, `/onboard`
- **Public routes**: `/`, `/auth/*`
- **Role-based access**: Dashboard routes check user role
- **Auto-redirect**: Wrong dashboard redirects to correct one

## 🛡️ Security Features

### Row Level Security (RLS)
- **Users table**: Users can only see/edit their own profile
- **Properties table**: Clients see own properties, staff see all
- **Bookings table**: Related to user's properties only
- **Tasks table**: Staff see assigned tasks
- **Reports table**: Related to user's properties only

### Middleware Protection
- Checks authentication on protected routes
- Validates user roles for dashboard access
- Redirects unauthenticated users to login
- Prevents authenticated users from accessing auth pages

## 🧪 Testing

### Test User Accounts
```
Client Login:
- Email: john.smith@example.com
- Password: password123
- Redirects to: /dashboard/client

Staff Login:
- Email: sarah.johnson@siamoon.com  
- Password: password123
- Redirects to: /dashboard/staff
```

### Test Scenarios
1. **Unauthenticated access** → Redirects to login
2. **Wrong dashboard access** → Redirects to correct dashboard
3. **Sign out** → Clears session and redirects to home
4. **Sign up** → Creates account and sends verification

## 🔧 Development Mode

To bypass authentication during development:

```env
NEXT_PUBLIC_BYPASS_AUTH=true
```

This will:
- Skip middleware authentication checks
- Use mock user in AuthContext
- Allow access to all routes
- Useful for testing UI without auth setup

## 🚨 Troubleshooting

### Common Issues

**1. "User not found" error**
- Ensure user profile exists in `users` table
- Check user ID matches between auth.users and users table

**2. "Redirect loop"**
- Check middleware configuration
- Verify user role in database matches expected values

**3. "Access denied"**
- Check RLS policies
- Verify user has correct role for requested resource

**4. "Session not found"**
- Clear browser cookies
- Check Supabase URL and keys are correct

### Debug Steps
1. Check browser console for errors
2. Verify Supabase connection in Network tab
3. Check user session in Application > Storage
4. Test database queries in Supabase SQL Editor

## 📱 Production Deployment

Before deploying:

1. **Set environment variables** in production
2. **Enable RLS** on all tables
3. **Test authentication flow** thoroughly
4. **Set up email templates** in Supabase
5. **Configure custom domain** for auth emails
6. **Set NEXT_PUBLIC_BYPASS_AUTH=false**

## 🎯 Next Steps

After authentication is working:

1. **Customize email templates** in Supabase
2. **Add password reset** functionality
3. **Implement email verification** flow
4. **Add social login** (Google, GitHub, etc.)
5. **Set up user profile** management
6. **Add role management** for admins
