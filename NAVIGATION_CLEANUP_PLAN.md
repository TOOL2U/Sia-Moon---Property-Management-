# 🧹 NAVIGATION CLEANUP PLAN

## Problem Statement
Too many duplicate pages, confusing navigation, unclear paths. Multiple "bookings", "calendar", "staff" pages at different locations.

## Essential Pages to KEEP (Property Management Business)

### 1. **Dashboard** (Main Hub)
- Path: `/admin` or `/dashboard`
- Purpose: Overview, metrics, quick actions

### 2. **Bookings** (Core Business Function)
- Path: `/admin/bookings`
- Purpose: Manage all property bookings
- Features: Create, edit, view bookings

### 3. **Calendar** (Scheduling)
- Path: `/admin/calendar`
- Purpose: Visual calendar of all bookings and jobs
- Features: View events, drag-drop scheduling

### 4. **Tasks/Jobs** (Operations)
- Path: `/admin/tasks`
- Purpose: Manage cleaning jobs, maintenance tasks
- Features: View jobs, assign staff, track completion

### 5. **Staff Management** (HR)
- Path: `/admin/staff`
- Purpose: Manage staff accounts, roles, ratings
- Features: Add/edit staff, view performance, ratings

### 6. **Properties** (Asset Management)
- Path: `/admin/properties`
- Purpose: Manage villa/property listings
- Features: Add/edit properties, view details

### 7. **Reports** (Analytics) - Optional
- Path: `/admin/reports`
- Purpose: Business analytics and insights
- Features: Revenue, occupancy, staff performance

---

## Pages to DELETE/Remove from Navigation

### Duplicate/Redundant Pages:
- ❌ `/bookings` (root level - duplicate)
- ❌ `/calendar` (root level - duplicate)
- ❌ `/staff` (root level - duplicate)
- ❌ `/admin/backoffice` (unclear purpose, consolidate into dashboard)
- ❌ `/admin/test-job-creation` (test page, not production)
- ❌ `/admin/job-assignments` (merge into tasks)
- ❌ `/admin/villa-reviews` (can be part of properties)
- ❌ `/admin/accounts` (merge into staff or settings)
- ❌ `/test` (test pages)
- ❌ `/test-realtime-calendar` (test page)
- ❌ `/command-center` (unclear purpose)
- ❌ `/status` (unclear purpose)
- ❌ `/jobs` (root level - duplicate of tasks)

### Keep but Don't Show in Main Nav:
- ✅ `/auth/*` (authentication flows)
- ✅ `/api/*` (API endpoints)
- ✅ `/admin-setup` (initial setup)
- ✅ `/onboard` (staff onboarding)
- ✅ `/profile` (user profile)
- ✅ `/settings` (user settings)
- ✅ `/unauthorized` (error page)

---

## Final Navigation Structure

```
ADMIN SIDEBAR:
├── 📊 Dashboard      → /admin
├── 📅 Bookings       → /admin/bookings  
├── 📆 Calendar       → /admin/calendar
├── ✅ Tasks          → /admin/tasks
├── 👥 Staff          → /admin/staff
├── 🏠 Properties     → /admin/properties
└── 📈 Reports        → /admin/reports (optional)

USER MENU (Top Right):
├── ⚙️ Settings       → /settings
├── 👤 Profile        → /profile
└── 🚪 Logout
```

---

## Implementation Steps

1. ✅ Update AdminSidebarLayout navigation items
2. ✅ Update DashboardSidebar navigation items  
3. ✅ Delete unused page directories
4. ✅ Create missing essential pages (if needed)
5. ✅ Update all internal links to use new paths
6. ✅ Add redirects from old paths to new paths
7. ✅ Test all navigation flows

---

## Path Mappings (Redirects)

Old Path → New Path:
- `/bookings` → `/admin/bookings`
- `/calendar` → `/admin/calendar`
- `/staff` → `/admin/staff`
- `/jobs` → `/admin/tasks`
- `/admin/backoffice` → `/admin` (dashboard)

---

## Expected Result

Simple, clean navigation with:
- 6-7 main menu items (essential only)
- No duplicate pages
- Clear, consistent paths
- Everything under `/admin/*` for admin users
- Easy to find "Create Booking" button
- Clear flow: Booking → Calendar → Task → Staff

---

Date: January 6, 2026
Status: Ready to implement
