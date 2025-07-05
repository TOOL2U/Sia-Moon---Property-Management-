-- Manual Database Setup for Villa Management System
-- Run this in the Supabase SQL Editor if automated migrations fail

-- First, let's check what tables already exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('client', 'staff', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'read');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'client',
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  max_guests INTEGER DEFAULT 1,
  price_per_night DECIMAL(10,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  amenities TEXT[],
  images TEXT[],
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status booking_status DEFAULT 'pending',
  booking_source TEXT DEFAULT 'direct',
  special_requests TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure check_out is after check_in
  CONSTRAINT valid_dates CHECK (check_out > check_in)
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT DEFAULT 'general',
  status task_status DEFAULT 'pending',
  priority task_priority DEFAULT 'normal',
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cost DECIMAL(10,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update or create reports table with correct structure
DROP TABLE IF EXISTS reports CASCADE;
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2050),
  total_income DECIMAL(12,2) DEFAULT 0.00,
  total_expenses DECIMAL(12,2) DEFAULT 0.00,
  net_income DECIMAL(12,2) DEFAULT 0.00,
  occupancy_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (occupancy_rate >= 0 AND occupancy_rate <= 100),
  total_bookings INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one report per property per month/year
  UNIQUE(property_id, month, year)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT DEFAULT 'in_app',
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  status notification_status DEFAULT 'pending',
  priority notification_priority DEFAULT 'normal',
  channels TEXT[] DEFAULT ARRAY['in_app'],
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  email_subject TEXT,
  email_template TEXT,
  push_title TEXT,
  push_body TEXT,
  push_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email_enabled BOOLEAN DEFAULT true,
  email_reports BOOLEAN DEFAULT true,
  email_tasks BOOLEAN DEFAULT true,
  email_invoices BOOLEAN DEFAULT true,
  email_bookings BOOLEAN DEFAULT true,
  email_maintenance BOOLEAN DEFAULT true,
  email_marketing BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  push_tasks BOOLEAN DEFAULT true,
  push_urgent_only BOOLEAN DEFAULT false,
  push_quiet_hours_start TIME,
  push_quiet_hours_end TIME,
  in_app_enabled BOOLEAN DEFAULT true,
  in_app_sound BOOLEAN DEFAULT true,
  onesignal_player_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  subject_template TEXT,
  email_template TEXT,
  push_template TEXT,
  variables TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_active ON properties(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_tasks_property_id ON tasks(property_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_reports_property_date ON reports(property_id, year DESC, month DESC);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (drop first if they exist)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_templates_updated_at ON notification_templates;
CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('reports', 'reports', true),
  ('property-images', 'property-images', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample notification templates
INSERT INTO notification_templates (name, category, subject_template, email_template, push_template, variables, is_active) VALUES
(
  'report_generated',
  'report_generated',
  'Monthly Report Available - {{property_name}} ({{month}} {{year}})',
  'Your monthly property report for {{property_name}} is now available for {{month}} {{year}}. Net income: {{net_income}}. Download: {{pdf_url}}',
  'Your {{month}} {{year}} report for {{property_name}} is ready. Net income: {{net_income}}',
  ARRAY['property_name', 'month', 'year', 'net_income', 'pdf_url'],
  true
),
(
  'task_assigned',
  'task_assigned',
  'New Task Assigned - {{task_title}}',
  'You have been assigned a new task: {{task_title}} for {{property_name}}. Due: {{due_date}}. Priority: {{priority}}',
  'New task: {{task_title}} - {{property_name}}',
  ARRAY['task_title', 'property_name', 'due_date', 'priority'],
  true
),
(
  'task_completed',
  'task_completed',
  'Task Completed - {{task_title}}',
  'Task "{{task_title}}" has been completed for {{property_name}}. Completed on: {{completed_date}}',
  'Task completed: {{task_title}} - {{property_name}}',
  ARRAY['task_title', 'property_name', 'completed_date'],
  true
)
ON CONFLICT (name) DO NOTHING;

-- Function to create a sample user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')::user_role
  );
  
  -- Create default notification preferences
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to calculate report metrics
CREATE OR REPLACE FUNCTION calculate_report_metrics(
  p_property_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS TABLE (
  total_income DECIMAL(12,2),
  total_expenses DECIMAL(12,2),
  net_income DECIMAL(12,2),
  occupancy_rate DECIMAL(5,2),
  total_bookings INTEGER
) AS $$
DECLARE
  start_date DATE;
  end_date DATE;
  total_nights INTEGER;
  occupied_nights INTEGER;
BEGIN
  -- Calculate date range
  start_date := DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-01');
  end_date := (start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  total_nights := EXTRACT(DAY FROM end_date);
  
  -- Calculate income from completed bookings
  SELECT COALESCE(SUM(b.total_amount), 0)
  INTO total_income
  FROM bookings b
  WHERE b.property_id = p_property_id
    AND b.status = 'completed'
    AND b.check_in >= start_date
    AND b.check_out <= end_date;
  
  -- Calculate expenses from tasks
  SELECT COALESCE(SUM(t.cost), 0)
  INTO total_expenses
  FROM tasks t
  WHERE t.property_id = p_property_id
    AND t.status = 'completed'
    AND t.completed_at >= start_date
    AND t.completed_at <= (end_date + INTERVAL '1 day');
  
  -- Calculate occupied nights
  SELECT COALESCE(SUM(EXTRACT(DAY FROM (b.check_out - b.check_in))), 0)
  INTO occupied_nights
  FROM bookings b
  WHERE b.property_id = p_property_id
    AND b.status = 'completed'
    AND b.check_in >= start_date
    AND b.check_out <= end_date;
  
  -- Calculate booking count
  SELECT COUNT(*)
  INTO total_bookings
  FROM bookings b
  WHERE b.property_id = p_property_id
    AND b.status = 'completed'
    AND b.check_in >= start_date
    AND b.check_out <= end_date;
  
  -- Calculate derived values
  net_income := total_income - total_expenses;
  occupancy_rate := CASE 
    WHEN total_nights > 0 THEN (occupied_nights::DECIMAL / total_nights) * 100
    ELSE 0
  END;
  
  RETURN QUERY SELECT 
    calculate_report_metrics.total_income,
    calculate_report_metrics.total_expenses,
    calculate_report_metrics.net_income,
    calculate_report_metrics.occupancy_rate,
    calculate_report_metrics.total_bookings;
END;
$$ LANGUAGE plpgsql;

-- Function to generate monthly report
CREATE OR REPLACE FUNCTION generate_monthly_report(
  p_property_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS UUID AS $$
DECLARE
  report_id UUID;
  metrics RECORD;
BEGIN
  -- Get calculated metrics
  SELECT * INTO metrics
  FROM calculate_report_metrics(p_property_id, p_month, p_year);
  
  -- Insert or update report
  INSERT INTO reports (
    property_id,
    month,
    year,
    total_income,
    total_expenses,
    net_income,
    occupancy_rate,
    total_bookings,
    currency
  ) VALUES (
    p_property_id,
    p_month,
    p_year,
    metrics.total_income,
    metrics.total_expenses,
    metrics.net_income,
    metrics.occupancy_rate,
    metrics.total_bookings,
    'USD'
  )
  ON CONFLICT (property_id, month, year)
  DO UPDATE SET
    total_income = EXCLUDED.total_income,
    total_expenses = EXCLUDED.total_expenses,
    net_income = EXCLUDED.net_income,
    occupancy_rate = EXCLUDED.occupancy_rate,
    total_bookings = EXCLUDED.total_bookings,
    updated_at = NOW()
  RETURNING id INTO report_id;
  
  RETURN report_id;
END;
$$ LANGUAGE plpgsql;

-- Function to send notification
CREATE OR REPLACE FUNCTION send_notification(
  p_user_id UUID,
  p_category TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT NULL,
  p_priority notification_priority DEFAULT 'normal',
  p_channels TEXT[] DEFAULT ARRAY['in_app']
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    category,
    title,
    message,
    data,
    priority,
    channels
  ) VALUES (
    p_user_id,
    p_category,
    p_title,
    p_message,
    p_data,
    p_priority,
    p_channels
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Database setup completed successfully!' as status;
