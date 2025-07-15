// Job Assignment Types for Mobile App
export type JobStatus = 'pending' | 'assigned' | 'accepted' | 'declined' | 'in_progress' | 'completed' | 'cancelled';
export type JobPriority = 'low' | 'medium' | 'high' | 'urgent';
export type JobType = 'cleaning' | 'maintenance' | 'checkin_prep' | 'checkout_process' | 'inspection' | 'setup' | 'concierge' | 'security' | 'custom';

export interface JobAssignment {
  id: string;
  
  // Booking Integration
  bookingId: string;
  bookingReference?: string;
  propertyId: string;
  propertyName: string;
  propertyAddress?: string;
  
  // Guest Information
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  
  // Job Details
  jobType: JobType;
  title: string;
  description: string;
  priority: JobPriority;
  estimatedDuration: number; // in minutes
  
  // Staff Assignment
  assignedStaffId: string;
  assignedStaffName: string;
  assignedStaffEmail: string;
  assignedStaffPhone?: string;
  assignedStaffRole: string;
  
  // Scheduling
  scheduledDate: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  deadline: string;
  
  // Status and Progress
  status: JobStatus;
  progress: number; // 0-100
  
  // Assignment Workflow
  assignedAt: string;
  assignedBy: string;
  assignedByName: string;
  acceptedAt?: string;
  declinedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  
  // Staff Response
  staffResponse?: {
    accepted: boolean;
    responseAt: string;
    notes?: string;
    estimatedArrival?: string;
    alternativeTime?: string;
  };
  
  // Instructions and Requirements
  specialInstructions?: string;
  requiredSkills: string[];
  requiredSupplies?: string[];
  accessInstructions?: string;
  
  // Completion Data
  completionNotes?: string;
  completionPhotos?: string[];
  qualityRating?: number; // 1-5
  issuesReported?: string[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  syncVersion: number;
  lastSyncedAt: string;
  
  // Mobile App Sync
  mobileNotificationSent: boolean;
  mobileNotificationId?: string;
  lastMobileSync?: string;
}

export interface JobCompletionData {
  jobId: string;
  completionNotes: string;
  completionPhotos: string[];
  qualityRating?: number;
  issuesReported?: string[];
  completedAt: string;
}

export interface JobResponse {
  jobId: string;
  accepted: boolean;
  responseAt: string;
  notes?: string;
  estimatedArrival?: string;
  alternativeTime?: string;
}
