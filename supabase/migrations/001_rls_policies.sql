-- Row Level Security Policies for Villa Management System

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Property owners can manage their properties" ON properties;
DROP POLICY IF EXISTS "Anyone can view active properties" ON properties;
DROP POLICY IF EXISTS "Property owners and staff can view bookings" ON bookings;
DROP POLICY IF EXISTS "Property owners and staff can manage bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Property owners and staff can manage tasks" ON tasks;
DROP POLICY IF EXISTS "Property owners can view their reports" ON reports;
DROP POLICY IF EXISTS "Property owners and staff can manage reports" ON reports;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Staff can create notifications for users" ON notifications;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Properties policies
CREATE POLICY "Property owners can manage their properties" ON properties
  FOR ALL USING (
    auth.uid() = owner_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
  );

CREATE POLICY "Anyone can view active properties" ON properties
  FOR SELECT USING (is_active = true);

-- Bookings policies
CREATE POLICY "Property owners and staff can view bookings" ON bookings
  FOR SELECT USING (
    property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
  );

CREATE POLICY "Property owners and staff can manage bookings" ON bookings
  FOR ALL USING (
    property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
  );

-- Tasks policies
CREATE POLICY "Users can view assigned tasks" ON tasks
  FOR SELECT USING (
    auth.uid() = assigned_to OR
    property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
  );

CREATE POLICY "Property owners and staff can manage tasks" ON tasks
  FOR ALL USING (
    property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
  );

-- Reports policies
CREATE POLICY "Property owners can view their reports" ON reports
  FOR SELECT USING (
    property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
  );

CREATE POLICY "Property owners and staff can manage reports" ON reports
  FOR ALL USING (
    property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
  );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Staff can create notifications for users" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
  );

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', COALESCE(NEW.raw_user_meta_data->>'role', 'client'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
