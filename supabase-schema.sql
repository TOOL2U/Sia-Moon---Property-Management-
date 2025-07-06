-- Villa Property Management Database Schema
-- Run this in your Supabase SQL Editor

-- 1. Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  role TEXT CHECK (role IN ('owner', 'staff')) NOT NULL DEFAULT 'owner',
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (id)
);

-- 2. Create villa_onboarding table for comprehensive villa data
CREATE TABLE villa_onboarding (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Owner Details
  owner_full_name TEXT NOT NULL,
  owner_nationality TEXT,
  owner_contact_number TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('phone', 'whatsapp', 'line', 'email')),
  bank_details JSONB,

  -- Property Details
  property_name TEXT NOT NULL,
  property_address TEXT NOT NULL,
  google_maps_url TEXT,
  bedrooms INTEGER,
  bathrooms INTEGER,
  land_size_sqm DECIMAL(10,2),
  villa_size_sqm DECIMAL(10,2),
  year_built INTEGER,

  -- Amenities
  has_pool BOOLEAN DEFAULT false,
  has_garden BOOLEAN DEFAULT false,
  has_air_conditioning BOOLEAN DEFAULT false,
  internet_provider TEXT,
  has_parking BOOLEAN DEFAULT false,
  has_laundry BOOLEAN DEFAULT false,
  has_backup_power BOOLEAN DEFAULT false,

  -- Access & Staff
  access_details JSONB,
  has_smart_lock BOOLEAN DEFAULT false,
  gate_remote_details TEXT,
  onsite_staff JSONB,

  -- Utilities
  electricity_provider TEXT,
  water_source TEXT,
  internet_package TEXT,

  -- Rental & Marketing
  rental_rates JSONB,
  platforms_listed TEXT[],
  average_occupancy_rate DECIMAL(5,2),
  minimum_stay_requirements TEXT,
  target_guests TEXT,
  owner_blackout_dates JSONB,

  -- Preferences & Rules
  pets_allowed BOOLEAN DEFAULT false,
  parties_allowed BOOLEAN DEFAULT false,
  smoking_allowed BOOLEAN DEFAULT false,
  maintenance_auto_approval_limit DECIMAL(10,2),

  -- Current Condition
  repairs_needed TEXT,
  last_septic_service DATE,
  pest_control_schedule TEXT,

  -- Photos & Media
  professional_photos_status TEXT CHECK (professional_photos_status IN ('available', 'not_available', 'need_photos')),
  floor_plan_images_available BOOLEAN DEFAULT false,
  video_walkthrough_available BOOLEAN DEFAULT false,

  -- Emergency Contact
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,

  -- File uploads (stored as Supabase Storage URLs)
  furniture_appliances_list_url TEXT,
  floor_plans_url TEXT,
  title_deed_url TEXT,
  house_registration_url TEXT,
  insurance_policy_url TEXT,
  licenses_url TEXT,

  -- Confirmation
  information_confirmed BOOLEAN DEFAULT false,

  -- Status and timestamps
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Keep the simplified properties table for approved villas
CREATE TABLE properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  villa_onboarding_id UUID REFERENCES villa_onboarding(id) ON DELETE SET NULL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  max_guests INTEGER,
  price_per_night DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Create bookings table
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
  total_amount DECIMAL(10,2),
  guest_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE villa_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 6. Create policies for properties
CREATE POLICY "Owners can view own properties" ON properties FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE id = auth.uid() AND role = 'owner'
  ) OR owner_id = auth.uid()
);

CREATE POLICY "Staff can view all properties" ON properties FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE id = auth.uid() AND role = 'staff'
  )
);

CREATE POLICY "Owners can manage own properties" ON properties FOR ALL USING (owner_id = auth.uid());

-- 7. Create policies for bookings
CREATE POLICY "Property owners can view bookings" ON bookings FOR SELECT USING (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Staff can view all bookings" ON bookings FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE id = auth.uid() AND role = 'staff'
  )
);

-- 8. Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'owner');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 10. Insert demo users for testing
-- Note: You'll need to create these users through Supabase Auth first, then update their profiles

-- Demo data (run after creating users)
-- INSERT INTO profiles (id, email, role, first_name, last_name) VALUES
-- ('user-id-here', 'demo@owner.com', 'owner', 'Demo', 'Owner'),
-- ('user-id-here', 'demo@staff.com', 'staff', 'Demo', 'Staff');

-- 11. Create storage bucket for villa documents (run this in Supabase Dashboard > Storage)
-- CREATE BUCKET villa-documents;

-- 12. Set up storage policies for villa documents
-- INSERT INTO storage.buckets (id, name, public) VALUES ('villa-documents', 'villa-documents', true);

-- 13. Add missing RLS policies for tasks
CREATE POLICY "Property owners can view tasks for their properties" ON tasks FOR SELECT USING (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Staff can view assigned tasks" ON tasks FOR SELECT USING (
  assigned_to = auth.uid() OR
  auth.uid() IN (
    SELECT id FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin')
  )
);

CREATE POLICY "Staff can update assigned tasks" ON tasks FOR UPDATE USING (
  assigned_to = auth.uid() OR
  auth.uid() IN (
    SELECT id FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin')
  )
);

CREATE POLICY "Property owners and staff can create tasks" ON tasks FOR INSERT WITH CHECK (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  ) OR
  auth.uid() IN (
    SELECT id FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin')
  )
);

-- 14. Add missing RLS policies for reports
CREATE POLICY "Property owners can view own reports" ON reports FOR SELECT USING (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Staff can view all reports" ON reports FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin')
  )
);

CREATE POLICY "Property owners can manage own reports" ON reports FOR ALL USING (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  ) OR
  auth.uid() IN (
    SELECT id FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin')
  )
);

-- 15. Add missing RLS policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (
  user_id = auth.uid()
);

CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (
  user_id = auth.uid()
);

CREATE POLICY "System can create notifications for users" ON notifications FOR INSERT WITH CHECK (
  user_id = auth.uid() OR
  auth.uid() IN (
    SELECT id FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin')
  )
);

-- 16. Add missing RLS policies for notification preferences
CREATE POLICY "Users can view own preferences" ON notification_preferences FOR SELECT USING (
  user_id = auth.uid()
);

CREATE POLICY "Users can manage own preferences" ON notification_preferences FOR ALL USING (
  user_id = auth.uid()
);

-- 13. Create storage policies
-- CREATE POLICY "Anyone can upload villa documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'villa-documents');
-- CREATE POLICY "Anyone can view villa documents" ON storage.objects FOR SELECT USING (bucket_id = 'villa-documents');

-- Sample properties (update owner_id with actual user ID)
-- INSERT INTO properties (name, address, description, owner_id, bedrooms, bathrooms, max_guests, price_per_night) VALUES
-- ('Villa Sunset', '123 Ocean Drive, Miami, FL', 'Beautiful oceanfront villa with stunning sunset views', 'owner-user-id', 4, 3, 8, 450.00),
-- ('Mountain Retreat', '456 Pine Ridge, Aspen, CO', 'Cozy mountain cabin perfect for winter getaways', 'owner-user-id', 3, 2, 6, 350.00);
