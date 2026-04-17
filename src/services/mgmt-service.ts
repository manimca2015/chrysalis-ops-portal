
import { initializeFirebase } from '@/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc, 
  serverTimestamp,
  getDoc,
  setDoc,
  arrayUnion,
  deleteDoc,
  Timestamp,
  limit
} from 'firebase/firestore';
import { 
  Project, 
  Task, 
  ProjectStatus, 
  StaffProfile, 
  ProjectActivity, 
  ProjectAssignment,
  CostingSet,
  CostingItem,
  DocumentMetadata,
  PaymentPlan,
  AuditEntry,
  AuditEventType,
  Enquiry
} from '@/types';

const { db } = initializeFirebase();

const STATUS_ORDER: ProjectStatus[] = [
  'enquiry',
  'costing',
  'quotation_sent',
  'confirmed',
  'in_progress',
  'completed'
];

// Staff Management
export const getStaffProfiles = async () => {
  const q = query(collection(db, 'mgmt_staff'), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StaffProfile[];
};

export const upsertStaffProfile = async (uid: string, data: Partial<StaffProfile>) => {
  const staffRef = doc(db, 'mgmt_staff', uid);
  return await setDoc(staffRef, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

// Enquiries
export const createEnquiry = async (data: Omit<Enquiry, 'id' | 'receivedAt'>) => {
  return await addDoc(collection(db, 'mgmt_enquiries'), {
    ...data,
    receivedAt: serverTimestamp(),
  });
};

export const getEnquiries = async () => {
  const q = query(collection(db, 'mgmt_enquiries'), orderBy('receivedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Enquiry[];
};

export const updateEnquiryStatus = async (enquiryId: string, status: 'converted' | 'ignored') => {
  return await updateDoc(doc(db, 'mgmt_enquiries', enquiryId), { status });
};

// Projects
export const createProject = async (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
  const docRef = await addDoc(collection(db, 'mgmt_projects'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  await addProjectActivity(docRef.id, {
    type: 'system',
    content: `Project created with status: ${data.status}`,
    authorId: 'system',
    authorName: 'System'
  });

  return docRef;
};

export const getProjects = async () => {
  const q = query(collection(db, 'mgmt_projects'), orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[];
};

export const getProjectById = async (id: string) => {
  const docRef = doc(db, 'mgmt_projects', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Project;
  }
  return null;
};

export const updateProjectStatus = async (projectId: string, newStatus: ProjectStatus, authorId: string, authorName: string) => {
  const projectRef = doc(db, 'mgmt_projects', projectId);
  const projectSnap = await getDoc(projectRef);
  
  if (!projectSnap.exists()) throw new Error('Project not found');
  
  const oldStatus = projectSnap.data().status as ProjectStatus;
  
  const oldIdx = STATUS_ORDER.indexOf(oldStatus);
  const newIdx = STATUS_ORDER.indexOf(newStatus);
  
  let isAnomaly = false;
  if (newIdx > oldIdx + 1 && newStatus !== 'archived') {
    isAnomaly = true;
    await logAuditEvent({
      event: 'status_jump',
      severity: 'warning',
      projectId,
      userId: authorId,
      userName: authorName,
      details: `Project status jumped from ${oldStatus} directly to ${newStatus}.`,
    });
  }

  await updateDoc(projectRef, {
    status: newStatus,
    updatedAt: serverTimestamp(),
  });

  await addProjectActivity(projectId, {
    type: isAnomaly ? 'anomaly' : 'status_change',
    content: `Status updated to ${newStatus.replace('_', ' ')}`,
    authorId,
    authorName,
    isAnomaly
  });
};

// Costing Engine
export const getCostingSets = async (projectId: string) => {
  const q = query(collection(db, 'mgmt_costing_sets'), where('projectId', '==', projectId), orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CostingSet[];
};

export const createCostingSet = async (projectId: string, name: string) => {
  return await addDoc(collection(db, 'mgmt_costing_sets'), {
    projectId,
    name,
    isWinningOption: false,
    totalCostSgd: 0,
    totalSellingSgd: 0,
    profitSgd: 0,
    marginPercent: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const getCostingItems = async (setId: string) => {
  const q = query(collection(db, 'mgmt_costing_items'), where('costingSetId', '==', setId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CostingItem[];
};

export const addCostingItem = async (setId: string, item: Omit<CostingItem, 'id' | 'costingSetId'>) => {
  const docRef = await addDoc(collection(db, 'mgmt_costing_items'), {
    ...item,
    costingSetId: setId,
  });
  await recalculateCostingSet(setId);
  return docRef;
};

export const deleteCostingItem = async (setId: string, itemId: string) => {
  await deleteDoc(doc(db, 'mgmt_costing_items', itemId));
  await recalculateCostingSet(setId);
};

const recalculateCostingSet = async (setId: string) => {
  const items = await getCostingItems(setId);
  const totalCost = items.reduce((sum, item) => sum + item.totalCostSgd, 0);
  const totalSelling = items.reduce((sum, item) => sum + item.sellingPriceSgd, 0);
  const profit = totalSelling - totalCost;
  const margin = totalSelling > 0 ? (profit / totalSelling) * 100 : 0;

  await updateDoc(doc(db, 'mgmt_costing_sets', setId), {
    totalCostSgd: totalCost,
    totalSellingSgd: totalSelling,
    profitSgd: profit,
    marginPercent: margin,
    updatedAt: serverTimestamp(),
  });
};

// Documents & Payments
export const logDocumentCreation = async (docData: Omit<DocumentMetadata, 'id' | 'createdAt'>) => {
  return await addDoc(collection(db, 'mgmt_documents'), {
    ...docData,
    createdAt: serverTimestamp(),
  });
};

export const getPaymentPlan = async (projectId: string) => {
  const docRef = doc(db, 'mgmt_payment_plans', projectId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as PaymentPlan;
  }
  return null;
};

export const savePaymentPlan = async (projectId: string, plan: Omit<PaymentPlan, 'id' | 'updatedAt'>) => {
  const docRef = doc(db, 'mgmt_payment_plans', projectId);
  return await setDoc(docRef, {
    ...plan,
    updatedAt: serverTimestamp(),
  });
};

// Activity & Audit Logging
export const addProjectActivity = async (projectId: string, activity: Omit<ProjectActivity, 'id' | 'timestamp'>) => {
  return await addDoc(collection(db, 'mgmt_projects', projectId, 'activity'), {
    ...activity,
    timestamp: serverTimestamp(),
  });
};

export const getProjectActivity = async (projectId: string) => {
  const q = query(collection(db, 'mgmt_projects', projectId, 'activity'), orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProjectActivity[];
};

export const logAuditEvent = async (event: Omit<AuditEntry, 'id' | 'timestamp'>) => {
  return await addDoc(collection(db, 'mgmt_audit_log'), {
    ...event,
    timestamp: serverTimestamp(),
  });
};

export const getAuditLogs = async (limitCount = 50) => {
  const q = query(
    collection(db, 'mgmt_audit_log'), 
    orderBy('timestamp', 'desc'), 
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AuditEntry[];
};

// Task Management
export const getProjectTasks = async (projectId: string) => {
  const q = query(
    collection(db, 'mgmt_tasks'), 
    where('projectId', '==', projectId),
    orderBy('dueDate', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
};

export const getUserTasks = async (userId: string) => {
  const q = query(
    collection(db, 'mgmt_tasks'),
    where('assignedToId', '==', userId),
    where('status', 'in', ['pending', 'ready_for_verification']),
    orderBy('dueDate', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
};

export const createTask = async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
  return await addDoc(collection(db, 'mgmt_tasks'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateTask = async (taskId: string, data: Partial<Task>, authorId: string, authorName: string) => {
  const taskRef = doc(db, 'mgmt_tasks', taskId);
  await updateDoc(taskRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });

  if (data.status) {
    const taskSnap = await getDoc(taskRef);
    const projectId = taskSnap.data()?.projectId;
    if (projectId) {
      await addProjectActivity(projectId, {
        type: 'task_update',
        content: `Task "${taskSnap.data()?.title}" status updated to ${data.status.replace('_', ' ')}`,
        authorId,
        authorName
      });
    }
  }
};

// Analytics & Insights
export const getLowMarginSets = async () => {
  const q = query(
    collection(db, 'mgmt_costing_sets'),
    where('marginPercent', '<', 15),
    limit(10)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CostingSet[];
};
