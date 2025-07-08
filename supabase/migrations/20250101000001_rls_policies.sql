-- Row Level Security (RLS) Policies for Production
-- This migration sets up secure access policies for all tables

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PROFILES TABLE POLICIES
-- =============================================================================
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Staff and admins can view all profiles
CREATE POLICY "Staff can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('staff', 'admin')
        )
    );

-- Only admins can insert new profiles (handled by trigger)
CREATE POLICY "System can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (true);

-- =============================================================================
-- PROPERTIES TABLE POLICIES
-- =============================================================================
-- Drop existing policies first
DROP POLICY IF EXISTS "Owners can manage own properties" ON public.properties;
DROP POLICY IF EXISTS "Staff can view all properties" ON public.properties;
DROP POLICY IF EXISTS "Staff can update all properties" ON public.properties;
DROP POLICY IF EXISTS "Property owners can manage their properties" ON public.properties;
DROP POLICY IF EXISTS "Anyone can view active properties" ON public.properties;

-- Property owners can manage their properties
CREATE POLICY "Owners can manage own properties" ON public.properties
    FOR ALL USING (owner_id = auth.uid());

-- Staff and admins can view all properties
CREATE POLICY "Staff can view all properties" ON public.properties
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('staff', 'admin')
        )
    );

-- Staff and admins can update all properties
CREATE POLICY "Staff can update all properties" ON public.properties
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('staff', 'admin')
        )
    );

-- =============================================================================
-- BOOKINGS TABLE POLICIES
-- =============================================================================
-- Drop existing policies first
DROP POLICY IF EXISTS "Owners can view own property bookings" ON public.bookings;
DROP POLICY IF EXISTS "Staff can manage all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Property owners and staff can view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Property owners and staff can manage bookings" ON public.bookings;

-- Property owners can view bookings for their properties
CREATE POLICY "Owners can view own property bookings" ON public.bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.properties
            WHERE id = property_id AND owner_id = auth.uid()
        )
    );

-- Staff and admins can manage all bookings
CREATE POLICY "Staff can manage all bookings" ON public.bookings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('staff', 'admin')
        )
    );

-- Property owners can insert bookings for their properties
CREATE POLICY "Owners can create bookings for own properties" ON public.bookings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.properties
            WHERE id = property_id AND owner_id = auth.uid()
        )
    );

-- Property owners can update bookings for their properties
CREATE POLICY "Owners can update own property bookings" ON public.bookings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.properties
            WHERE id = property_id AND owner_id = auth.uid()
        )
    );

-- =============================================================================
-- TASKS TABLE POLICIES
-- =============================================================================
-- Drop existing policies first
DROP POLICY IF EXISTS "Owners can view own property tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view assigned tasks" ON public.tasks;
DROP POLICY IF EXISTS "Staff can manage all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Owners can create tasks for own properties" ON public.tasks;
DROP POLICY IF EXISTS "Property owners and staff can manage tasks" ON public.tasks;

-- Property owners can view tasks for their properties
CREATE POLICY "Owners can view own property tasks" ON public.tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.properties
            WHERE id = property_id AND owner_id = auth.uid()
        )
    );

-- Assigned users can view their assigned tasks
CREATE POLICY "Users can view assigned tasks" ON public.tasks
    FOR SELECT USING (assigned_to = auth.uid());

-- Staff and admins can manage all tasks
CREATE POLICY "Staff can manage all tasks" ON public.tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('staff', 'admin')
        )
    );

-- Property owners can create tasks for their properties
CREATE POLICY "Owners can create tasks for own properties" ON public.tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.properties
            WHERE id = property_id AND owner_id = auth.uid()
        )
    );

-- Assigned users can update their task status
CREATE POLICY "Assigned users can update task status" ON public.tasks
    FOR UPDATE USING (assigned_to = auth.uid());

-- =============================================================================
-- REPORTS TABLE POLICIES
-- =============================================================================
-- Drop existing policies first
DROP POLICY IF EXISTS "Owners can view own property reports" ON public.reports;
DROP POLICY IF EXISTS "Staff can manage all reports" ON public.reports;
DROP POLICY IF EXISTS "Owners can create reports for own properties" ON public.reports;
DROP POLICY IF EXISTS "Property owners can view their reports" ON public.reports;
DROP POLICY IF EXISTS "Property owners and staff can manage reports" ON public.reports;

-- Property owners can view reports for their properties
CREATE POLICY "Owners can view own property reports" ON public.reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.properties
            WHERE id = property_id AND owner_id = auth.uid()
        )
    );

-- Staff and admins can manage all reports
CREATE POLICY "Staff can manage all reports" ON public.reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('staff', 'admin')
        )
    );

-- Property owners can create reports for their properties
CREATE POLICY "Owners can create reports for own properties" ON public.reports
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.properties
            WHERE id = property_id AND owner_id = auth.uid()
        )
    );

-- =============================================================================
-- NOTIFICATIONS TABLE POLICIES
-- =============================================================================
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Staff can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Staff and admins can create notifications for any user
CREATE POLICY "Staff can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('staff', 'admin')
        )
    );

-- System can create notifications (for automated processes)
CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- =============================================================================
-- PROFILE CREATION TRIGGER
-- =============================================================================
-- Automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'client')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
