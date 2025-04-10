// User-related types
export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    deviceToken?: string;
    phoneNumber?: string;
    profilePicture?: string;
  }
  
  export type UserRole = 
    | 'producer' 
    | 'booking_officer' 
    | 'camera_operator' 
    | 'sound_operator' 
    | 'lighting_operator'
    | 'evs_operator'
    | 'director'
    | 'stream_operator'
    | 'technician'
    | 'electrician';
  
  // Production-related types
  export interface Production {
    id: string;
    name: string;
    date: Date;
    callTime: Date;
    venue: Venue;
    locationDetails?: string;
    startTime: Date;
    endTime: Date;
    status: ProductionStatus;
    isOutsideBroadcast: boolean;
    notes?: string;
    requestedById: string;
    processedById?: string;
    assignedStaff: AssignedStaff;
    transportDetails?: string;
    overtimeReported: boolean;
    overtimeReason?: string;
    actualEndTime?: Date;
    completionNotes?: string;
    createdAt: Date;
  }
  
  export type Venue = 'Studio 1' | 'Studio 2' | 'Studio 3' | 'Studio 4' | 'Location';
  
  export type ProductionStatus = 'requested' | 'confirmed' | 'completed' | 'cancelled' | 'overtime';
  
  export interface AssignedStaff {
    cameraOperators: string[];
    soundOperators: string[];
    lightingOperators: string[];
    evsOperator?: string;
    director?: string;
    streamOperator?: string;
    technician?: string;
    electrician?: string;
  }
  

  // User-related types
export interface User {
  id: string;
  name: string;
  email: string;
  secondaryEmail?: string | null;
  role: UserRole;
  roles: UserRole[]; // Array of all assigned roles
  department: Department;
  deviceToken?: string;
  phoneNumber: string;
  secondaryPhone?: string | null;
  profilePicture?: string;
  profileComplete: boolean; // To track if profile setup is complete
  createdAt: Date;
  updatedAt?: Date;
}

export type Department = 'Current Affairs' | 'News Desk' | 'Content Hub' | 'TV Operations';

// Announcement-related types
export interface Announcement {
  id: string;
  title: string;
  message: string;
  targetGroup: 'all' | 'producers' | 'operators';
  createdById: string;
  createdAt: Date;
  isPinned: boolean;
}

  // Notification-related types
  export interface Notification {
    id: string;
    recipientId: string;
    productionId?: string;
    type: NotificationType;
    message: string;
    read: boolean;
    createdAt: Date;
  }
  
  export type NotificationType = 'assignment' | 'confirmation' | 'reminder' | 'issue' | 'overtime';
  
  // Issue-related types
  export interface Issue {
    id: string;
    reportedById: string;
    productionId: string;
    description: string;
    status: IssueStatus;
    createdAt: Date;
    resolvedAt?: Date;
    priority: IssuePriority;
  }
  
  export type IssueStatus = 'pending' | 'in-progress' | 'resolved';
  export type IssuePriority = 'low' | 'medium' | 'high';
  
  // Navigation types
  export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    ForgotPassword: undefined;
    
    // Producer screens
    ProducerDashboard: undefined;
    NewProductionRequest: undefined;
    ProductionDetails: { productionId: string };
    
    // Booking officer screens
    BookingDashboard: undefined;
    StaffAssignment: { production: Production };
    SchedulePrinting: { productionId?: string };
    
    // Operator screens
    OperatorDashboard: undefined;
    OperatorSchedule: undefined;
    IssueReporting: { productionId?: string };
    
    // Common screens
    ProductionHistory: undefined;
    ProductionHistoryDetail: { production: Production };
    ProductionAnalytics: undefined;
    PrintPreview: { html: string; title: string };
  };