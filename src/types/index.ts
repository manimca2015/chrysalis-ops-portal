
export type MgmtRole = 'admin' | 'staff';

export interface StaffProfile {
  id: string;
  email: string;
  name: string;
  role: MgmtRole;
  avatarUrl?: string;
  createdAt: any;
  updatedAt: any;
}

export type ProjectStatus = 
  | 'draft' 
  | 'enquiry' 
  | 'costing' 
  | 'quotation_sent' 
  | 'confirmed' 
  | 'in_progress' 
  | 'completed' 
  | 'archived';

export interface CustomerDetails {
  name: string;
  email: string;
  phone?: string;
}

export interface ProjectAssignment {
  staffId: string;
  staffName: string;
  role: 'Senior Staff' | 'Team Lead' | 'Assisting Member';
}

export interface ProjectActivity {
  id: string;
  type: 'status_change' | 'assignment' | 'note' | 'system';
  content: string;
  authorId: string;
  authorName: string;
  timestamp: any;
}

export interface Project {
  id: string;
  title: string;
  customerDetails: CustomerDetails;
  status: ProjectStatus;
  teamAssignments: ProjectAssignment[];
  category: 'custom-tour' | 'corporate' | 'transport' | 'education';
  notes?: string;
  chrysalisBookingId?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  assignedTo?: string; // staffId
  status: 'pending' | 'ready_for_verification' | 'approved' | 'rejected' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: any;
  createdAt: any;
  updatedAt: any;
}
