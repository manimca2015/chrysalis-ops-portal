
export type MgmtRole = 'admin' | 'staff';

export interface StaffProfile {
  id: string;
  email: string;
  name: string;
  role: MgmtRole;
  status: 'active' | 'deactivated';
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
  preferences?: string[];
}

export interface ProjectAssignment {
  staffId: string;
  staffName: string;
  role: 'Senior Staff' | 'Team Lead' | 'Assisting Member';
}

export interface ProjectActivity {
  id: string;
  type: 'status_change' | 'assignment' | 'note' | 'system' | 'document_sent' | 'task_update' | 'anomaly' | 'questionnaire_sent' | 'bill_added' | 'payment_recorded' | 'finalization';
  content: string;
  authorId: string;
  authorName: string;
  timestamp: any;
  isAnomaly?: boolean;
}

export interface RoomingConfig {
  type: string;
  quantity: number;
  costPerRoom: number;
}

export interface Project {
  id: string;
  title: string;
  customerDetails: CustomerDetails;
  status: ProjectStatus;
  teamAssignments: ProjectAssignment[];
  category: 'custom-tour' | 'corporate' | 'transport' | 'education';
  notes?: string;
  provisionalPax: number;
  actualPax?: number;
  agreedPriceSgd?: number;
  finalPriceSgd?: number;
  roomingList?: RoomingConfig[];
  createdAt: any;
  updatedAt: any;
}

export interface QuestionnaireTemplate {
  id: string;
  category: string;
  title: string;
  questions: string[];
  updatedAt: any;
}

export interface TaskTemplate {
  id: string;
  category: string;
  title: string;
  tasks: {
    title: string;
    priority: 'low' | 'medium' | 'high';
    role: string;
  }[];
  updatedAt: any;
}

export interface Enquiry {
  id: string;
  rawText: string;
  parsedDetails?: {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    projectSummary: string;
  };
  status: 'pending' | 'converted' | 'ignored' | 'spam';
  receivedAt: any;
}

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
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
  blockedBy?: string;
  subTasks: SubTask[];
  createdAt: any;
  updatedAt: any;
}

export interface Supplier {
  id: string;
  name: string;
  location: string;
  contactPerson: string;
  email: string;
  phone: string;
  tags: string[];
  operationalNotes?: { content: string; projectId: string; timestamp: any }[];
  services: { id: string; name: string; cost: number; currency: string }[];
  updatedAt: any;
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

export interface AuditEntry {
  id: string;
  event: string;
  severity: 'info' | 'warning' | 'critical';
  projectId?: string;
  userId: string;
  userName: string;
  details: string;
  changes?: { field: string; before: any; after: any };
  timestamp: any;
}
