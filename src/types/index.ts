
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
  type: 'status_change' | 'assignment' | 'note' | 'system' | 'document_sent' | 'task_update';
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

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface TaskComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: any;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  assignedToId?: string;
  assignedToName?: string;
  verifierId?: string;
  status: 'pending' | 'ready_for_verification' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: any;
  subTasks: SubTask[];
  createdAt: any;
  updatedAt: any;
}

// Module 3: Costing Types
export interface Supplier {
  id: string;
  name: string;
  category: string;
  email?: string;
  phone?: string;
  baseCurrency: string;
  notes?: string;
}

export interface CostingItem {
  id: string;
  costingSetId: string;
  supplierId?: string;
  supplierName: string;
  description: string;
  unitCost: number;
  quantity: number;
  currency: string;
  exchangeRate: number;
  markupPercent: number;
  isManualOverride: boolean;
  totalCostSgd: number;
  sellingPriceSgd: number;
}

export interface CostingSet {
  id: string;
  projectId: string;
  name: string; 
  isWinningOption: boolean;
  totalCostSgd: number;
  totalSellingSgd: number;
  profitSgd: number;
  marginPercent: number;
  createdAt: any;
  updatedAt: any;
}

// Module 4: Documents & Payments
export type DocumentType = 'quotation' | 'contract' | 'invoice' | 'receipt';

export interface DocumentMetadata {
  id: string;
  projectId: string;
  type: DocumentType;
  title: string;
  fileUrl?: string;
  status: 'draft' | 'sent' | 'signed' | 'paid';
  recipientEmail: string;
  version: number;
  createdAt: any;
  sentAt?: any;
}

export interface Installment {
  label: string;
  percentage: number;
  amount: number;
  dueDate?: any;
  status: 'pending' | 'paid';
}

export interface PaymentPlan {
  id: string;
  projectId: string;
  totalAmount: number;
  currency: string;
  installments: Installment[];
  updatedAt: any;
}
