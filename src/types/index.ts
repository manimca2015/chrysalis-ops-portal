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
  role: 'Senior Staff' | 'Team Lead' | 'Assisting Member';
}

export interface Project {
  id: string;
  title: string;
  customerDetails: CustomerDetails;
  status: ProjectStatus;
  teamAssignments: ProjectAssignment[];
  category: string;
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

export interface CostingItem {
  id: string;
  costingSetId: string;
  description: string;
  supplierId: string;
  costPrice: number;
  markup: number;
  sellingPrice: number;
  currency: string;
}

export interface CostingSet {
  id: string;
  projectId: string;
  name: string;
  isBaseline: boolean;
  totalCost: number;
  totalSelling: number;
  profitMargin: number;
  createdAt: any;
}