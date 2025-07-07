-- =============================================================================
-- FIX PROFILES TABLE POLICIES TO PREVENT INFINITE RECURSION
-- =============================================================================

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;

-- Create simple policies that don't reference other tables
CREATE POLICY "Users can view own profile simple" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile simple" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile simple" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role to access all profiles (for admin operations)
CREATE POLICY "Service role can access all profiles" ON public.profiles
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- FIX TASKS TABLE POLICIES TO PREVENT PERMISSION ISSUES
-- =============================================================================

-- Drop problematic policies
DROP POLICY IF EXISTS "Staff can manage all tasks simple" ON public.tasks;

-- Create simpler task policies that don't reference auth.users table
CREATE POLICY "Users can view assigned tasks simple" ON public.tasks
    FOR SELECT USING (assigned_to::uuid = auth.uid());

CREATE POLICY "Property owners can manage tasks for own properties" ON public.tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.properties
            WHERE properties.id = tasks.property_id
            AND properties.owner_id = auth.uid()
        )
    );

-- Service role can access all tasks
CREATE POLICY "Service role can access all tasks" ON public.tasks
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- SIMPLIFY OTHER POLICIES TO PREVENT RECURSION
-- =============================================================================

-- Drop and recreate properties policies without auth.users references
DROP POLICY IF EXISTS "Staff can view all properties simple" ON public.properties;
DROP POLICY IF EXISTS "Staff can update all properties simple" ON public.properties;

-- Service role can access all properties
CREATE POLICY "Service role can access all properties" ON public.properties
    FOR ALL USING (auth.role() = 'service_role');

-- Drop and recreate bookings policies
DROP POLICY IF EXISTS "Staff can manage all bookings simple" ON public.bookings;

-- Service role can access all bookings
CREATE POLICY "Service role can access all bookings" ON public.bookings
    FOR ALL USING (auth.role() = 'service_role');

-- Drop and recreate reports policies
DROP POLICY IF EXISTS "Staff can manage all reports simple" ON public.reports;

-- Service role can access all reports
CREATE POLICY "Service role can access all reports" ON public.reports
    FOR ALL USING (auth.role() = 'service_role');

-- Drop and recreate notifications policies
DROP POLICY IF EXISTS "Staff can create notifications simple" ON public.notifications;

-- Service role can access all notifications
CREATE POLICY "Service role can access all notifications" ON public.notifications
    FOR ALL USING (auth.role() = 'service_role');
