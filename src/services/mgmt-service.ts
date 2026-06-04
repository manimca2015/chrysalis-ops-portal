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
  Enquiry,
  QuestionnaireTemplate,
  TaskTemplate,
  Supplier,
  SupplierBill,
  SupplierPayment
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

// Suppliers
export const getSuppliers = async () => {
  const q = query(collection(db, 'mgmt_suppliers'), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Supplier[];
};

export const addSupplier = async (data: Omit<Supplier, 'id' | 'updatedAt'>) => {
  return await addDoc(collection(db, 'mgmt_suppliers'), {
    ...data,
    updatedAt: serverTimestamp(),
  });
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

export const updateEnquiryStatus = async (enquiryId: string, status: Enquiry['status']) => {
  return await updateDoc(doc(db, 'mgmt_enquiries', enquiryId), { status });
};

// Templates
export const getQuestionnaireTemplates = async () => {
  const q = query(collection(db, 'mgmt_questionnaire_templates'), orderBy('category', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as QuestionnaireTemplate[];
};

export const saveQuestionnaireTemplate = async (data: Omit<QuestionnaireTemplate, 'id' | 'updatedAt'>) => {
  return await addDoc(collection(db, 'mgmt_questionnaire_templates'), {
    ...data,
    updatedAt: serverTimestamp(),
  });
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
    content: `Project initiated: ${data.title}`,
    authorId: 'system',
    authorName: 'System'
  });

  return docRef;
};

export const cloneProject = async (projectId: string, authorId: string, authorName: string) => {
  const original = await getProjectById(projectId);
  if (!original) throw new Error('Project not found');

  const { id, createdAt, updatedAt, ...clonedData } = original;
  
  const docRef = await addDoc(collection(db, 'mgmt_projects'), {
    ...clonedData,
    title: `CLONE: ${clonedData.title}`,
    status: 'enquiry',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Clone costing sets
  const sets = await getCostingSets(projectId);
  for (const set of sets) {
    const newSetRef = await createCostingSet(docRef.id, set.name);
    const items = await getCostingItems(set.id);
    for (const item of items) {
      const { id: itemId, costingSetId, ...itemData } = item;
      await addCostingItem(newSetRef.id, itemData);
    }
  }

  await logAuditEvent({
    event: 'clone_project',
    severity: 'info',
    projectId: docRef.id,
    userId: authorId,
    userName: authorName,
    details: `Project cloned from ${projectId}`,
  });

  return docRef.id;
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
  if (newIdx > oldIdx + 1 && newStatus !== 'archived' && newStatus !== 'completed') {
    isAnomaly = true;
    await logAuditEvent({
      event: 'status_jump',
      severity: 'warning',
      projectId,
      userId: authorId,
      userName: authorName,
      details: `Project status jumped from ${oldStatus} to ${newStatus}.`,
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

// Activity & Audit
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
  const q = query(collection(db, 'mgmt_audit_log'), orderBy('timestamp', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AuditEntry[];
};

// Costing Engine
export const getCostingSets = async (projectId: string) => {
  const q = query(collection(db, 'mgmt_costing_sets'), where('projectId', '==', projectId));
  const snapshot = await getDocs(q);
  const sets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CostingSet[];
  return sets.sort((a, b) => {
    const timeA = a.createdAt?.toMillis?.() || 0;
    const timeB = b.createdAt?.toMillis?.() || 0;
    return timeA - timeB;
  });
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

export const duplicateCostingSet = async (setId: string, newName: string) => {
  const setRef = doc(db, 'mgmt_costing_sets', setId);
  const setSnap = await getDoc(setRef);
  if (!setSnap.exists()) throw new Error('Set not found');

  const { id, createdAt, updatedAt, ...setData } = setSnap.data();
  const newSetRef = await addDoc(collection(db, 'mgmt_costing_sets'), {
    ...setData,
    name: newName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const items = await getCostingItems(setId);
  for (const item of items) {
    const { id: itemId, costingSetId, ...itemData } = item;
    await addCostingItem(newSetRef.id, itemData);
  }

  return newSetRef.id;
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
  
  if (item.isManualOverride) {
    const setSnap = await getDoc(doc(db, 'mgmt_costing_sets', setId));
    if (setSnap.exists()) {
      await logAuditEvent({
        event: 'financial_override',
        severity: 'info',
        projectId: setSnap.data().projectId,
        userId: 'system', // Ideally passed from UI
        userName: 'Staff',
        details: `Manual price override for ${item.description}: ${item.currency} ${item.unitCost}`,
      });
    }
  }

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

// Supplier Bills & Payments
export const getSupplierBills = async (projectId: string) => {
  const q = query(collection(db, 'mgmt_supplier_bills'), where('projectId', '==', projectId));
  const snapshot = await getDocs(q);
  const bills = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SupplierBill[];
  return bills.sort((a, b) => {
    const timeA = a.dueDate?.toMillis?.() || 0;
    const timeB = b.dueDate?.toMillis?.() || 0;
    return timeA - timeB;
  });
};

export const createSupplierBill = async (projectId: string, bill: Omit<SupplierBill, 'id' | 'createdAt'>, authorId: string, authorName: string) => {
  const docRef = await addDoc(collection(db, 'mgmt_supplier_bills'), {
    ...bill,
    createdAt: serverTimestamp(),
  });

  await addProjectActivity(projectId, {
    type: 'bill_added',
    content: `Supplier bill added: ${bill.supplierName} - ${bill.invoiceNumber}`,
    authorId,
    authorName
  });

  await logAuditEvent({
    event: 'bill_created',
    severity: 'info',
    projectId,
    userId: authorId,
    userName: authorName,
    details: `Supplier bill created for ${bill.supplierName} (Inv: ${bill.invoiceNumber})`,
  });

  return docRef;
};

export const recordSupplierPayment = async (billId: string, payment: Omit<SupplierPayment, 'id'>, authorId: string, authorName: string) => {
  const docRef = await addDoc(collection(db, 'mgmt_supplier_payments'), {
    ...payment,
    recordedBy: authorId,
    recordedByName: authorName
  });

  const billRef = doc(db, 'mgmt_supplier_bills', billId);
  await updateDoc(billRef, { status: 'paid' });

  const billSnap = await getDoc(billRef);
  if (billSnap.exists()) {
    const bill = billSnap.data() as SupplierBill;
    await addProjectActivity(bill.projectId, {
      type: 'payment_recorded',
      content: `Supplier payment recorded: ${bill.supplierName} - ${bill.invoiceNumber}`,
      authorId,
      authorName
    });

    await logAuditEvent({
      event: 'supplier_payment',
      severity: 'info',
      projectId: bill.projectId,
      userId: authorId,
      userName: authorName,
      details: `Payment of ${payment.amount} recorded for bill ${bill.invoiceNumber}`,
    });
  }

  return docRef;
};

// Tasks
export const getProjectTasks = async (projectId: string) => {
  const q = query(collection(db, 'mgmt_tasks'), where('projectId', '==', projectId));
  const snapshot = await getDocs(q);
  const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
  return tasks.sort((a, b) => {
    const timeA = a.dueDate?.toMillis?.() || 0;
    const timeB = b.dueDate?.toMillis?.() || 0;
    return timeA - timeB;
  });
};

export const getUserTasks = async (userId: string) => {
  const q = query(collection(db, 'mgmt_tasks'), where('assignedToId', '==', userId), where('status', 'in', ['pending', 'ready_for_verification']));
  const snapshot = await getDocs(q);
  const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
  return tasks.sort((a, b) => {
    const timeA = a.dueDate?.toMillis?.() || 0;
    const timeB = b.dueDate?.toMillis?.() || 0;
    return timeA - timeB;
  });
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
};

// Documents & Payments
export const getDocuments = async (projectId: string) => {
  const q = query(collection(db, 'mgmt_documents'), where('projectId', '==', projectId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DocumentMetadata[];
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
  await setDoc(docRef, {
    ...plan,
    updatedAt: serverTimestamp(),
  });
  
  await logAuditEvent({
    event: 'financial_override',
    severity: 'info',
    projectId,
    userId: 'system',
    userName: 'Staff',
    details: `Payment plan updated with ${plan.installments.length} milestones.`,
  });
};

export const logDocumentCreation = async (docData: Omit<DocumentMetadata, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, 'mgmt_documents'), {
    ...docData,
    createdAt: serverTimestamp(),
  });

  await logAuditEvent({
    event: 'document_generated',
    severity: 'info',
    projectId: docData.projectId,
    userId: 'system',
    userName: 'Staff',
    details: `Generated ${docData.type}: ${docData.title}`,
  });

  return docRef;
};

// Insights
export const getLowMarginSets = async () => {
  const q = query(collection(db, 'mgmt_costing_sets'), where('marginPercent', '<', 15), limit(10));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CostingSet[];
};
