export interface User {
  id: string;
  email: string;
  role: 'client' | 'staff';
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  property_id: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export interface DashboardStats {
  totalProperties: number;
  totalBookings: number;
  totalRevenue: number;
  occupancyRate: number;
}
