-- =============================================================================
-- FIX RLS POLICIES AND ADD MISSING TABLES
-- =============================================================================

-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Staff can view all properties" ON public.properties;
DROP POLICY IF EXISTS "Staff can update all properties" ON public.properties;
DROP POLICY IF EXISTS "Staff can manage all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Staff can manage all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Staff can manage all reports" ON public.reports;
DROP POLICY IF EXISTS "Staff can create notifications" ON public.notifications;

-- =============================================================================
-- CREATE VILLA ONBOARDINGS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.villa_onboardings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_name TEXT NOT NULL,
    property_address TEXT,
    property_city TEXT,
    property_country TEXT,
    bedrooms INTEGER,
    bathrooms INTEGER,
    max_guests INTEGER,
    price_per_night DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    amenities JSONB DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    special_instructions TEXT,
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on villa_onboardings
ALTER TABLE public.villa_onboardings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for villa_onboardings
CREATE POLICY "Users can view own villa onboardings" ON public.villa_onboardings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own villa onboardings" ON public.villa_onboardings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own villa onboardings" ON public.villa_onboardings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own villa onboardings" ON public.villa_onboardings
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger for villa_onboardings
DROP TRIGGER IF EXISTS handle_villa_onboardings_updated_at ON public.villa_onboardings;
CREATE TRIGGER handle_villa_onboardings_updated_at
    BEFORE UPDATE ON public.villa_onboardings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- FIX PROPERTIES TABLE POLICIES (Remove staff policies that cause recursion)
-- =============================================================================

-- Simple policies without recursion
CREATE POLICY "Staff can view all properties simple" ON public.properties
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' IN ('staff', 'admin')
        )
    );

CREATE POLICY "Staff can update all properties simple" ON public.properties
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' IN ('staff', 'admin')
        )
    );

-- =============================================================================
-- FIX TASKS TABLE POLICIES (Remove staff policies that cause recursion)
-- =============================================================================

CREATE POLICY "Staff can manage all tasks simple" ON public.tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' IN ('staff', 'admin')
        )
    );

-- =============================================================================
-- FIX BOOKINGS TABLE POLICIES
-- =============================================================================

CREATE POLICY "Staff can manage all bookings simple" ON public.bookings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' IN ('staff', 'admin')
        )
    );

-- =============================================================================
-- FIX REPORTS TABLE POLICIES
-- =============================================================================

CREATE POLICY "Staff can manage all reports simple" ON public.reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' IN ('staff', 'admin')
        )
    );

-- =============================================================================
-- FIX NOTIFICATIONS TABLE POLICIES
-- =============================================================================

CREATE POLICY "Staff can create notifications simple" ON public.notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' IN ('staff', 'admin')
        )
    );

-- =============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Villa onboardings indexes
CREATE INDEX IF NOT EXISTS idx_villa_onboardings_user_id ON public.villa_onboardings(user_id);
CREATE INDEX IF NOT EXISTS idx_villa_onboardings_status ON public.villa_onboardings(status);
CREATE INDEX IF NOT EXISTS idx_villa_onboardings_created_at ON public.villa_onboardings(created_at);

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant permissions on villa_onboardings table
GRANT ALL ON public.villa_onboardings TO authenticated;
GRANT ALL ON public.villa_onboardings TO service_role;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
