
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
  role: 'Team Lead' | 'Assisting Member' | 'Senior Staff';
}

export interface ProjectActivity {
  id: string;
  type: 'status_change' | 'assignment' | 'note' | 'system' | 'document_sent' | 'task_update' | 'anomaly' | 'questionnaire_sent' | 'bill_added' | 'payment_recorded';
  content: string;
  authorId: string;
  authorName: string;
  timestamp: any;
  isAnomaly?: boolean;
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
  subTasks: SubTask[];
  createdAt: any;
  updatedAt: any;
}

export interface SupplierService {
  id: string;
  name: string;
  cost: number;
  currency: string;
}

export interface Supplier {
  id: string;
  name: string;
  location: string;
  contactPerson: string;
  email: string;
  phone: string;
  tags: string[];
  services: SupplierService[];
  updatedAt: any;
}

export interface CostingItem {
  id: string;
  costingSetId: string;
  supplierId?: string;
  supplierName: string;
  serviceId?: string;
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
  exchangeRateManual?: number;
  createdAt: any;
  updatedAt: any;
}

export interface SupplierBill {
  id: string;
  projectId: string;
  costingItemId: string;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  issueDate: any;
  dueDate: any;
  status: 'awaiting_payment' | 'paid' | 'overdue';
  fileUrl?: string;
  createdAt: any;
}

export interface SupplierPayment {
  id: string;
  billId: string;
  amount: number;
  date: any;
  method: string;
  proofUrl?: string;
  recordedBy: string;
  recordedByName: string;
}

export type DocumentType = 'quotation' | 'contract' | 'invoice' | 'receipt' | 'client_file';

export interface DocumentMetadata {
  id: string;
  projectId: string;
  type: DocumentType;
  title: string;
  fileUrl?: string;
  status: 'draft' | 'sent' | 'signed' | 'paid' | 'uploaded';
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

export type AuditEventType = 
  | 'auth_login' 
  | 'auth_logout' 
  | 'financial_override' 
  | 'status_jump' 
  | 'deletion' 
  | 'settings_change' 
  | 'clone_project'
  | 'bill_created'
  | 'supplier_payment'
  | 'document_generated';

export interface AuditEntry {
  id: string;
  event: AuditEventType;
  severity: 'info' | 'warning' | 'critical';
  projectId?: string;
  userId: string;
  userName: string;
  details: string;
  metadata?: any;
  timestamp: any;
}
