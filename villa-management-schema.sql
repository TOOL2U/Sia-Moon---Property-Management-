-- Villa Property Management Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create users table (main user management)
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create properties table
CREATE TABLE properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create bookings table
CREATE TABLE bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Create tasks table
CREATE TABLE tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Create reports table
CREATE TABLE reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  income DECIMAL(12,2) DEFAULT 0,
  expenses DECIMAL(12,2) DEFAULT 0,
  occupancy_rate DECIMAL(5,2) DEFAULT 0 CHECK (occupancy_rate >= 0 AND occupancy_rate <= 100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(property_id, month, year)
);

-- 6. Create indexes for better performance
CREATE INDEX idx_properties_client_id ON properties(client_id);
CREATE INDEX idx_bookings_property_id ON bookings(property_id);
CREATE INDEX idx_bookings_check_in_date ON bookings(check_in_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_tasks_property_id ON tasks(property_id);
CREATE INDEX idx_tasks_staff_id ON tasks(staff_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_reports_property_id ON reports(property_id);
CREATE INDEX idx_reports_year_month ON reports(year, month);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS Policies

-- Users policies
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Properties policies
CREATE POLICY "Clients can view own properties" ON properties FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = properties.client_id AND auth.uid()::text = users.id::text)
  OR EXISTS (SELECT 1 FROM users WHERE auth.uid()::text = users.id::text AND users.role = 'staff')
);

CREATE POLICY "Clients can insert own properties" ON properties FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = client_id AND auth.uid()::text = users.id::text AND users.role = 'client')
);

-- Bookings policies
CREATE POLICY "Users can view relevant bookings" ON bookings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM properties p 
    JOIN users u ON p.client_id = u.id 
    WHERE p.id = bookings.property_id 
    AND (auth.uid()::text = u.id::text OR EXISTS (SELECT 1 FROM users WHERE auth.uid()::text = users.id::text AND users.role = 'staff'))
  )
);

-- Tasks policies
CREATE POLICY "Staff can view assigned tasks" ON tasks FOR SELECT USING (
  auth.uid()::text = staff_id::text 
  OR EXISTS (SELECT 1 FROM users WHERE auth.uid()::text = users.id::text AND users.role = 'staff')
);

-- Reports policies
CREATE POLICY "Users can view relevant reports" ON reports FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM properties p 
    JOIN users u ON p.client_id = u.id 
    WHERE p.id = reports.property_id 
    AND (auth.uid()::text = u.id::text OR EXISTS (SELECT 1 FROM users WHERE auth.uid()::text = users.id::text AND users.role = 'staff'))
  )
);

-- 9. Insert seed data for testing

-- Insert test users (1 client, 1 staff)
INSERT INTO users (id, name, email, role) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'John Smith', 'john.smith@example.com', 'client'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Sarah Johnson', 'sarah.johnson@siamoon.com', 'staff');

-- Insert test property
INSERT INTO properties (id, name, address, client_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440003', 'Villa Paradise', '123 Beach Road, Phuket, Thailand 83110', '550e8400-e29b-41d4-a716-446655440001');

-- Insert test booking
INSERT INTO bookings (id, property_id, guest_name, check_in_date, check_out_date, total_amount, status) VALUES
  ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'Mike Wilson', '2024-02-15', '2024-02-20', 15000.00, 'confirmed');

-- Insert test task
INSERT INTO tasks (id, property_id, staff_id, task_type, status, due_date, notes) VALUES
  ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Pool Cleaning', 'pending', '2024-02-10', 'Weekly pool maintenance and chemical balance check');

-- Insert test report
INSERT INTO reports (id, property_id, month, year, income, expenses, occupancy_rate, notes) VALUES
  ('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 1, 2024, 45000.00, 12000.00, 75.5, 'Strong month with good occupancy. Pool heater repair needed.');

-- 10. Create helpful views for common queries

-- View for property summary with client info
CREATE VIEW property_summary AS
SELECT 
  p.id,
  p.name AS property_name,
  p.address,
  u.name AS client_name,
  u.email AS client_email,
  p.created_at,
  COUNT(b.id) AS total_bookings,
  COALESCE(SUM(b.total_amount), 0) AS total_revenue
FROM properties p
JOIN users u ON p.client_id = u.id
LEFT JOIN bookings b ON p.id = b.property_id AND b.status = 'completed'
GROUP BY p.id, p.name, p.address, u.name, u.email, p.created_at;

-- View for monthly property performance
CREATE VIEW monthly_performance AS
SELECT 
  p.id AS property_id,
  p.name AS property_name,
  r.month,
  r.year,
  r.income,
  r.expenses,
  (r.income - r.expenses) AS net_profit,
  r.occupancy_rate,
  COUNT(b.id) AS bookings_count
FROM properties p
LEFT JOIN reports r ON p.id = r.property_id
LEFT JOIN bookings b ON p.id = b.property_id 
  AND EXTRACT(MONTH FROM b.check_in_date) = r.month 
  AND EXTRACT(YEAR FROM b.check_in_date) = r.year
  AND b.status = 'completed'
GROUP BY p.id, p.name, r.month, r.year, r.income, r.expenses, r.occupancy_rate;

-- View for staff task summary
CREATE VIEW staff_task_summary AS
SELECT 
  u.id AS staff_id,
  u.name AS staff_name,
  COUNT(t.id) AS total_tasks,
  COUNT(CASE WHEN t.status = 'pending' THEN 1 END) AS pending_tasks,
  COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) AS in_progress_tasks,
  COUNT(CASE WHEN t.status = 'completed' THEN 1 END) AS completed_tasks,
  COUNT(CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'completed' THEN 1 END) AS overdue_tasks
FROM users u
LEFT JOIN tasks t ON u.id = t.staff_id
WHERE u.role = 'staff'
GROUP BY u.id, u.name;

-- 11. Create functions for common operations

-- Function to calculate property occupancy rate for a given period
CREATE OR REPLACE FUNCTION calculate_occupancy_rate(
  property_uuid UUID,
  start_date DATE,
  end_date DATE
) RETURNS DECIMAL(5,2) AS $$
DECLARE
  total_days INTEGER;
  booked_days INTEGER;
BEGIN
  total_days := end_date - start_date + 1;
  
  SELECT COALESCE(SUM(check_out_date - check_in_date), 0)
  INTO booked_days
  FROM bookings
  WHERE property_id = property_uuid
    AND status IN ('confirmed', 'completed')
    AND check_in_date <= end_date
    AND check_out_date >= start_date;
  
  IF total_days = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((booked_days::DECIMAL / total_days::DECIMAL) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to get property revenue for a given period
CREATE OR REPLACE FUNCTION get_property_revenue(
  property_uuid UUID,
  start_date DATE,
  end_date DATE
) RETURNS DECIMAL(12,2) AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(total_amount)
     FROM bookings
     WHERE property_id = property_uuid
       AND status IN ('confirmed', 'completed')
       AND check_in_date >= start_date
       AND check_in_date <= end_date),
    0
  );
END;
$$ LANGUAGE plpgsql;

-- 12. Create triggers for automatic updates

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at column to tables that need it
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;
ALTER TABLE properties ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;
ALTER TABLE bookings ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;
ALTER TABLE tasks ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;
ALTER TABLE reports ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Grant permissions (adjust as needed for your setup)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Schema creation complete!
-- You can now use this database structure for your villa property management application.
