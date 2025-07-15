import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface StaffProfile {
  id: string;
  firebaseUid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  hasCredentials: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  loginCount: number;
}

interface AuthContextType {
  user: User | null;
  staffProfile: StaffProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch staff profile from Firestore
  const fetchStaffProfile = async (uid: string): Promise<StaffProfile | null> => {
    try {
      console.log('📱 Fetching staff profile for UID:', uid);
      
      const staffDocRef = doc(db, 'staff_accounts', uid);
      const staffDoc = await getDoc(staffDocRef);
      
      if (staffDoc.exists()) {
        const data = staffDoc.data();
        const profile: StaffProfile = {
          id: staffDoc.id,
          firebaseUid: data.firebaseUid || uid,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          isActive: data.isActive,
          hasCredentials: data.hasCredentials,
          mustChangePassword: data.mustChangePassword,
          createdAt: data.createdAt,
          lastLoginAt: data.lastLoginAt,
          loginCount: data.loginCount || 0
        };
        
        console.log('✅ Staff profile loaded:', profile.firstName, profile.lastName);
        return profile;
      } else {
        console.log('❌ No staff profile found for UID:', uid);
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching staff profile:', error);
      return null;
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      console.log('📱 Attempting to sign in:', email);
      setLoading(true);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('✅ Firebase auth successful for:', user.email);
      
      // Fetch staff profile
      const profile = await fetchStaffProfile(user.uid);
      if (!profile) {
        throw new Error('Staff profile not found. Please contact your administrator.');
      }
      
      if (!profile.isActive) {
        throw new Error('Your account has been deactivated. Please contact your administrator.');
      }
      
      setStaffProfile(profile);
      console.log('✅ Sign in complete for:', profile.firstName, profile.lastName);
      
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      console.log('📱 Signing out...');
      await firebaseSignOut(auth);
      setStaffProfile(null);
      console.log('✅ Sign out complete');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
  };

  // Refresh profile function
  const refreshProfile = async () => {
    if (user) {
      const profile = await fetchStaffProfile(user.uid);
      setStaffProfile(profile);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    console.log('📱 Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔄 Auth state changed:', firebaseUser ? 'User signed in' : 'User signed out');
      
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Fetch staff profile
        const profile = await fetchStaffProfile(firebaseUser.uid);
        setStaffProfile(profile);
        
        if (profile && !profile.isActive) {
          console.log('⚠️ User account is inactive, signing out...');
          await firebaseSignOut(auth);
        }
      } else {
        setUser(null);
        setStaffProfile(null);
      }
      
      setLoading(false);
    });

    return () => {
      console.log('🧹 Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    staffProfile,
    loading,
    signIn,
    signOut,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
