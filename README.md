# Villa Property Management System

A comprehensive villa property management web application built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- **User Authentication**: Separate login portals for property owners and staff
- **Owner Dashboard**: Property overview, booking management, revenue tracking
- **Staff Dashboard**: Task management, maintenance tracking, guest services
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Updates**: Powered by Supabase for real-time data synchronization
- **TypeScript**: Full type safety throughout the application

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Database, Authentication, Real-time)
- **Icons**: Lucide React
- **Deployment**: Vercel (recommended)

## Project Structure

```
villa-property-management/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/
│   │   │   ├── owner/         # Owner dashboard
│   │   │   └── staff/         # Staff dashboard
│   │   ├── login/
│   │   │   ├── owner/         # Owner login page
│   │   │   └── staff/         # Staff login page
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/            # Reusable components
│   │   ├── auth/             # Authentication components
│   │   ├── layout/           # Layout components
│   │   └── ui/               # UI components
│   ├── contexts/             # React contexts
│   ├── hooks/                # Custom hooks
│   ├── lib/                  # Library configurations
│   │   └── supabase/         # Supabase client setup
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Utility functions
│   └── middleware.ts         # Next.js middleware
├── public/                   # Static assets
├── .env.local               # Environment variables (create from .env.example)
└── .env.example             # Environment variables template
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- Supabase account

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd villa-property-management
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` with your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up Supabase Database**

   Create the following tables in your Supabase database:

   ```sql
   -- Users profiles table
   CREATE TABLE profiles (
     id UUID REFERENCES auth.users ON DELETE CASCADE,
     email TEXT,
     role TEXT CHECK (role IN ('owner', 'staff')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
     PRIMARY KEY (id)
   );

   -- Properties table
   CREATE TABLE properties (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     address TEXT NOT NULL,
     description TEXT,
     owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
   );

   -- Bookings table
   CREATE TABLE bookings (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
     guest_name TEXT NOT NULL,
     guest_email TEXT NOT NULL,
     check_in DATE NOT NULL,
     check_out DATE NOT NULL,
     status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
     total_amount DECIMAL(10,2),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
   );

   -- Enable Row Level Security
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
   ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

   -- Create policies (adjust as needed for your security requirements)
   CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
   CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
   ```

5. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

### For Property Owners

1. Visit `/login/owner` to access the owner login portal
2. Sign in with your credentials
3. Access the owner dashboard to manage properties, view bookings, and track revenue

### For Staff Members

1. Visit `/login/staff` to access the staff login portal
2. Sign in with your credentials
3. Access the staff dashboard to manage tasks, maintenance, and guest services

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. **Components**: Add reusable components in `src/components/`
2. **Pages**: Add new pages in `src/app/`
3. **Types**: Define TypeScript types in `src/types/`
4. **Utilities**: Add utility functions in `src/utils/`

## 📱 Mobile-First Design

### Mobile Optimization Features

- **Mobile-first responsive design** with Tailwind CSS
- **Touch-friendly interfaces** with 44px+ tap targets
- **Optimized typography** for small screens
- **Collapsible mobile navigation** with hamburger menu
- **Swipe-friendly cards** and components
- **No horizontal scrolling** on any screen size
- **Large, clear buttons** for easy interaction
- **Accessible focus states** for keyboard navigation

### Responsive Breakpoints

- **Mobile**: < 640px (default, mobile-first)
- **Tablet**: 640px - 768px (sm)
- **Desktop**: 768px+ (md, lg, xl, 2xl)

### Mobile UX Enhancements

- **Sticky header** for easy navigation
- **Full-width forms** on mobile
- **Stacked layouts** that adapt to screen size
- **Touch-optimized input fields** (12px height on mobile)
- **Visual feedback** for all interactive elements
- **Safe area support** for iOS devices

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to set these environment variables in your production environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

## Mobile App Integration

The Villa Property Management system includes a mobile app for staff members to manage their assigned jobs. To ensure proper integration between the web application and mobile app, follow these steps:

### Prerequisites

- Firebase service account key (see [Firebase Service Account Setup Guide](./docs/FIREBASE_SERVICE_ACCOUNT_SETUP.md))

### Mobile Integration Fix

If staff members cannot see jobs in the mobile app, follow the troubleshooting guide in [Mobile Integration Fix](./docs/MOBILE_INTEGRATION_FIX.md). The most common issue is that staff accounts are missing the `userId` field that links them to Firebase Authentication.

### Fix Steps

1. Place the Firebase service account key in the project root directory as `serviceAccountKey.json`
2. Run the staff fix script:

   ```bash
   # List all staff accounts
   node scripts/staff-fix.js list

   # Fix a specific staff account
   node scripts/staff-fix.js fix cleaner@siamoon.com

   # Fix all staff accounts missing userIds
   node scripts/staff-fix.js fix-all
   ```

3. Test job assignment with the TestJobService:

   ```typescript
   import TestJobService from '@/services/TestJobService'

   // Verify staff accounts have userIds
   await TestJobService.verifyStaffUserIds()

   // Create a test job
   const result = await TestJobService.createTestJob()
   console.log(result)
   ```

### Mobile App Documentation

For detailed information about the mobile app integration, check these documentation files:

- [Mobile Integration Fix](./docs/MOBILE_INTEGRATION_FIX.md) - Technical documentation for fixing integration issues
- [Firebase Service Account Setup](./docs/FIREBASE_SERVICE_ACCOUNT_SETUP.md) - How to set up Firebase service account
- [Executive Summary](./docs/EXECUTIVE_SUMMARY.md) - High-level overview for management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
