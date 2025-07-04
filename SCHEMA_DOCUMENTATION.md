# 🏖️ Villa Property Management Database Schema

## Overview

This document describes the complete database schema for the Sia Moon Villa Property Management application. The schema is designed for Supabase PostgreSQL and includes all necessary tables, relationships, indexes, and security policies.

## 📊 Database Tables

### 1. **users** - User Management
```sql
- id (UUID, Primary Key)
- name (TEXT, NOT NULL)
- email (TEXT, UNIQUE, NOT NULL)
- role (TEXT, CHECK: 'client' or 'staff')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Purpose**: Manages both property owners (clients) and staff members.

### 2. **properties** - Villa Properties
```sql
- id (UUID, Primary Key)
- name (TEXT, NOT NULL)
- address (TEXT, NOT NULL)
- client_id (UUID, Foreign Key → users.id)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Purpose**: Stores villa property information owned by clients.

### 3. **bookings** - Guest Reservations
```sql
- id (UUID, Primary Key)
- property_id (UUID, Foreign Key → properties.id)
- guest_name (TEXT, NOT NULL)
- check_in_date (DATE, NOT NULL)
- check_out_date (DATE, NOT NULL)
- total_amount (DECIMAL(10,2), NOT NULL)
- status (TEXT, CHECK: 'pending', 'confirmed', 'cancelled', 'completed')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Purpose**: Tracks guest bookings and reservations for properties.

### 4. **tasks** - Staff Assignments
```sql
- id (UUID, Primary Key)
- property_id (UUID, Foreign Key → properties.id)
- staff_id (UUID, Foreign Key → users.id)
- task_type (TEXT, NOT NULL)
- status (TEXT, CHECK: 'pending', 'in_progress', 'completed', 'cancelled')
- due_date (DATE)
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Purpose**: Manages maintenance and service tasks assigned to staff.

### 5. **reports** - Monthly Performance
```sql
- id (UUID, Primary Key)
- property_id (UUID, Foreign Key → properties.id)
- month (INTEGER, 1-12)
- year (INTEGER, ≥2020)
- income (DECIMAL(12,2))
- expenses (DECIMAL(12,2))
- occupancy_rate (DECIMAL(5,2), 0-100%)
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- UNIQUE(property_id, month, year)
```

**Purpose**: Stores monthly financial and performance reports for each property.

## 🔗 Relationships

```
users (clients) ──┐
                  ├─→ properties ──┐
users (staff) ────┘                ├─→ bookings
                                   ├─→ tasks
                                   └─→ reports
```

## 📈 Performance Indexes

- `idx_properties_client_id` - Fast property lookups by owner
- `idx_bookings_property_id` - Fast booking queries by property
- `idx_bookings_check_in_date` - Date range queries
- `idx_bookings_status` - Status filtering
- `idx_tasks_property_id` - Task lookups by property
- `idx_tasks_staff_id` - Staff task assignments
- `idx_tasks_status` - Task status filtering
- `idx_tasks_due_date` - Due date sorting
- `idx_reports_property_id` - Report lookups
- `idx_reports_year_month` - Time-based reporting
- `idx_users_role` - Role-based queries
- `idx_users_email` - Email lookups

## 🔒 Security (Row Level Security)

### Users Table
- ✅ Users can view all users (for staff assignments)
- ✅ Users can only update their own profile

### Properties Table
- ✅ Clients can view only their own properties
- ✅ Staff can view all properties
- ✅ Clients can only create properties for themselves

### Bookings Table
- ✅ Clients can view bookings for their properties
- ✅ Staff can view all bookings

### Tasks Table
- ✅ Staff can view tasks assigned to them
- ✅ Staff can view all tasks (for management)

### Reports Table
- ✅ Clients can view reports for their properties
- ✅ Staff can view all reports

## 📊 Helpful Views

### 1. **property_summary**
Combines property info with client details and revenue totals.

### 2. **monthly_performance**
Shows monthly income, expenses, and booking counts per property.

### 3. **staff_task_summary**
Displays task counts and status breakdown per staff member.

## ⚙️ Utility Functions

### 1. **calculate_occupancy_rate(property_id, start_date, end_date)**
Returns occupancy percentage for a property in a date range.

### 2. **get_property_revenue(property_id, start_date, end_date)**
Returns total revenue for a property in a date range.

## 🌱 Seed Data

The schema includes test data:
- **1 Client**: John Smith (john.smith@example.com)
- **1 Staff**: Sarah Johnson (sarah.johnson@siamoon.com)
- **1 Property**: Villa Paradise in Phuket
- **1 Booking**: 5-day confirmed reservation
- **1 Task**: Pool cleaning assignment
- **1 Report**: January 2024 performance report

## 🚀 Setup Instructions

1. **Copy the Schema**:
   ```bash
   cp villa-management-schema.sql /path/to/your/project
   ```

2. **Run in Supabase**:
   - Open Supabase Dashboard
   - Go to SQL Editor
   - Paste the entire schema
   - Execute the script

3. **Verify Setup**:
   ```sql
   SELECT * FROM users;
   SELECT * FROM properties;
   SELECT * FROM property_summary;
   ```

## 📝 Common Queries

### Get all properties for a client:
```sql
SELECT * FROM properties WHERE client_id = 'client-uuid';
```

### Get upcoming bookings:
```sql
SELECT * FROM bookings 
WHERE check_in_date >= CURRENT_DATE 
AND status = 'confirmed'
ORDER BY check_in_date;
```

### Get pending tasks for staff:
```sql
SELECT * FROM tasks 
WHERE staff_id = 'staff-uuid' 
AND status = 'pending'
ORDER BY due_date;
```

### Get monthly revenue for a property:
```sql
SELECT SUM(total_amount) as revenue
FROM bookings 
WHERE property_id = 'property-uuid'
AND EXTRACT(MONTH FROM check_in_date) = 1
AND EXTRACT(YEAR FROM check_in_date) = 2024
AND status = 'completed';
```

### Get property performance summary:
```sql
SELECT * FROM monthly_performance 
WHERE property_id = 'property-uuid'
ORDER BY year DESC, month DESC;
```

## 🔄 Automatic Features

- **Updated Timestamps**: All tables automatically update `updated_at` on changes
- **UUID Generation**: All primary keys use UUID v4
- **Constraint Validation**: Status fields, dates, and percentages are validated
- **Cascade Deletes**: Related records are properly cleaned up

## 🛠️ Maintenance

### Regular Tasks:
1. **Monitor Performance**: Check query execution times
2. **Update Statistics**: Run `ANALYZE` on large tables
3. **Archive Old Data**: Consider partitioning for large datasets
4. **Backup Strategy**: Regular database backups

### Scaling Considerations:
- Add partitioning for bookings table by date
- Consider read replicas for reporting queries
- Monitor index usage and optimize as needed

This schema provides a solid foundation for a professional villa property management system with proper security, performance, and maintainability features.
