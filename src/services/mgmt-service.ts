
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
  limit,
  writeBatch
} from 'firebase/firestore';
import { 
  Project, 
  Task, 
  ProjectStatus, 
  StaffProfile, 
  ProjectActivity, 
  CostingSet,
  CostingItem,
  DocumentMetadata,
  AuditEntry,
  Enquiry,
  QuestionnaireTemplate,
  TaskTemplate,
  Supplier,
  PaymentPlan
} from '@/types';

const { db } = initializeFirebase();

// --- Staff ---
export const getStaffProfiles = async () => {
  const q = query(collection(db, 'mgmt_staff'), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StaffProfile[];
};

export const upsertStaffProfile = async (uid: string, data: Partial<StaffProfile>) => {
  const staffRef = doc(db, 'mgmt_staff', uid);
  return await setDoc(staffRef, {
    ...data,
    status: data.status || 'active',
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

// --- Projects ---
export const createProject = async (data: any) => {
  const docRef = await addDoc(collection(db, 'mgmt_projects'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  await addProjectActivity(docRef.id, {
    type: 'system',
    content: `Project initiated by staff. Category: ${data.category}`,
    authorId: 'system',
    authorName: 'System'
  });

  return docRef;
};

export const updateProject = async (projectId: string, data: any) => {
  const ref = doc(db, 'mgmt_projects', projectId);
  return await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const finalizeProjectDetails = async (projectId: string, data: any, authorId: string, authorName: string) => {
  const projectRef = doc(db, 'mgmt_projects', projectId);
  
  await updateDoc(projectRef, {
    ...data,
    updatedAt: serverTimestamp()
  });

  await addProjectActivity(projectId, {
    type: 'finalization',
    content: `Finalized Pax: ${data.actualPax}. Re-calculating final pricing.`,
    authorId,
    authorName
  });

  await logAuditEvent({
    event: 'finalize_details',
    severity: 'info',
    projectId,
    userId: authorId,
    userName: authorName,
    details: `Updated actual pax to ${data.actualPax}`,
  });
};

export const getProjects = async () => {
  const q = query(collection(db, 'mgmt_projects'), orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[];
};

export const getProjectById = async (id: string) => {
  const docRef = doc(db, 'mgmt_projects', id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Project : null;
};

export const updateProjectStatus = async (projectId: string, status: ProjectStatus, authorId: string, authorName: string) => {
  const ref = doc(db, 'mgmt_projects', projectId);
  const oldDoc = await getProjectById(projectId);
  
  await updateDoc(ref, { status, updatedAt: serverTimestamp() });
  await addProjectActivity(projectId, { type: 'status_change', content: `Status -> ${status}`, authorId, authorName });

  // Anomaly Detection: Status Jump
  const statusOrder: ProjectStatus[] = ['enquiry', 'costing', 'quotation_sent', 'confirmed', 'in_progress', 'completed'];
  const oldIdx = statusOrder.indexOf(oldDoc?.status || 'enquiry');
  const newIdx = statusOrder.indexOf(status);
  
  if (newIdx > oldIdx + 1) {
    await logAuditEvent({
      event: 'status_jump',
      severity: 'warning',
      projectId,
      userId: authorId,
      userName: authorName,
      details: `Project status jumped from ${oldDoc?.status} to ${status}. Stages skipped.`,
    });
  }
};

export const cloneProject = async (projectId: string, newTitle: string) => {
  const original = await getProjectById(projectId);
  if (!original) throw new Error('Original project not found');

  const { id, createdAt, updatedAt, ...clonableData } = original;
  return await createProject({
    ...clonableData,
    title: newTitle,
    status: 'enquiry'
  });
};

// --- Enquiries ---
export const getEnquiries = async () => {
  const q = query(collection(db, 'mgmt_enquiries'), orderBy('receivedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Enquiry[];
};

export const createEnquiry = async (data: any) => {
  return await addDoc(collection(db, 'mgmt_enquiries'), {
    ...data,
    receivedAt: serverTimestamp(),
  });
};

export const updateEnquiryStatus = async (id: string, status: string) => {
  const ref = doc(db, 'mgmt_enquiries', id);
  return await updateDoc(ref, { status });
};

// --- Suppliers ---
export const getSuppliers = async () => {
  const snapshot = await getDocs(collection(db, 'mgmt_suppliers'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Supplier[];
};

export const addSupplier = async (data: any) => {
  return await addDoc(collection(db, 'mgmt_suppliers'), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// --- Costing ---
export const createCostingSet = async (projectId: string, name: string) => {
  const ref = await addDoc(collection(db, 'mgmt_costing_sets'), {
    projectId,
    name,
    isWinningOption: false,
    totalCostSgd: 0,
    totalSellingSgd: 0,
    profitSgd: 0,
    marginPercent: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return ref.id;
};

export const duplicateCostingSet = async (setId: string, newName: string) => {
  const originalDoc = await getDoc(doc(db, 'mgmt_costing_sets', setId));
  if (!originalDoc.exists()) throw new Error('Set not found');
  
  const originalData = originalDoc.data();
  const newSetRef = await addDoc(collection(db, 'mgmt_costing_sets'), {
    ...originalData,
    name: newName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  const itemsSnap = await getDocs(query(collection(db, 'mgmt_costing_items'), where('costingSetId', '==', setId)));
  const batch = writeBatch(db);
  itemsSnap.docs.forEach(itemDoc => {
    const itemData = itemDoc.data();
    const newItemRef = doc(collection(db, 'mgmt_costing_items'));
    batch.set(newItemRef, { ...itemData, costingSetId: newSetRef.id });
  });
  await batch.commit();

  return newSetRef.id;
};

export const getCostingSets = async (projectId: string) => {
  const q = query(collection(db, 'mgmt_costing_sets'), where('projectId', '==', projectId));
  const snapshot = await getDocs(q);
  // Manual sorting to avoid index requirements for prototyping
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CostingSet))
    .sort((a, b) => b.updatedAt?.toMillis() - a.updatedAt?.toMillis());
};

export const getAllCostingSets = async () => {
  const snapshot = await getDocs(collection(db, 'mgmt_costing_sets'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CostingSet[];
};

export const getLowMarginSets = async () => {
  const q = query(collection(db, 'mgmt_costing_sets'), where('marginPercent', '<', 15));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CostingSet[];
};

export const addCostingItem = async (setId: string, data: any) => {
  const ref = await addDoc(collection(db, 'mgmt_costing_items'), {
    ...data,
    costingSetId: setId,
  });

  // Re-calculate set totals
  await recalculateCostingSet(setId);

  if (data.isManualOverride) {
    await logAuditEvent({
      event: 'financial_override',
      severity: 'info',
      userId: 'system', // Replace with real user context in production
      userName: 'Staff',
      details: `Manual cost override for ${data.description}. Final Cost: ${data.unitCost}`,
    });
  }

  return ref;
};

export const deleteCostingItem = async (setId: string, itemId: string) => {
  await deleteDoc(doc(db, 'mgmt_costing_items', itemId));
  await recalculateCostingSet(setId);
};

export const getCostingItems = async (setId: string) => {
  const q = query(collection(db, 'mgmt_costing_items'), where('costingSetId', '==', setId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CostingItem[];
};

const recalculateCostingSet = async (setId: string) => {
  const items = await getCostingItems(setId);
  const totalCostSgd = items.reduce((sum, item) => sum + item.totalCostSgd, 0);
  const totalSellingSgd = items.reduce((sum, item) => sum + item.sellingPriceSgd, 0);
  const profitSgd = totalSellingSgd - totalCostSgd;
  const marginPercent = totalSellingSgd > 0 ? (profitSgd / totalSellingSgd) * 100 : 0;

  await updateDoc(doc(db, 'mgmt_costing_sets', setId), {
    totalCostSgd,
    totalSellingSgd,
    profitSgd,
    marginPercent,
    updatedAt: serverTimestamp()
  });
};

// --- Documents & Payment Plans ---
export const savePaymentPlan = async (projectId: string, data: any) => {
  const ref = doc(db, 'mgmt_payment_plans', projectId);
  return await setDoc(ref, data);
};

export const getPaymentPlan = async (projectId: string) => {
  const docSnap = await getDoc(doc(db, 'mgmt_payment_plans', projectId));
  return docSnap.exists() ? docSnap.data() as PaymentPlan : null;
};

export const logDocumentCreation = async (data: any) => {
  return await addDoc(collection(db, 'mgmt_documents'), {
    ...data,
    createdAt: serverTimestamp()
  });
};

export const getDocuments = async (projectId: string) => {
  const q = query(collection(db, 'mgmt_documents'), where('projectId', '==', projectId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DocumentMetadata[];
};

// --- Tasks ---
export const getTaskTemplates = async () => {
  const snapshot = await getDocs(collection(db, 'mgmt_task_templates'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TaskTemplate[];
};

export const saveTaskTemplate = async (data: any) => {
  return await addDoc(collection(db, 'mgmt_task_templates'), {
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const getProjectTasks = async (projectId: string) => {
  const q = query(collection(db, 'mgmt_tasks'), where('projectId', '==', projectId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
};

export const getUserTasks = async (userId: string) => {
  const q = query(collection(db, 'mgmt_tasks'), where('assignedToId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
};

export const createTask = async (data: any) => {
  return await addDoc(collection(db, 'mgmt_tasks'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateTask = async (taskId: string, data: any, authorId: string, authorName: string) => {
  const ref = doc(db, 'mgmt_tasks', taskId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  
  if (data.status) {
    const task = (await getDoc(ref)).data() as Task;
    await addProjectActivity(task.projectId, {
      type: 'task_update',
      content: `Task "${task.title}" -> ${data.status}`,
      authorId,
      authorName
    });
  }
};

export const applyTaskTemplateToProject = async (projectId: string, templateId: string, authorId: string, authorName: string) => {
  const tplDoc = await getDoc(doc(db, 'mgmt_task_templates', templateId));
  if (!tplDoc.exists()) throw new Error('Template not found');
  
  const tplData = tplDoc.data() as TaskTemplate;
  const batch = writeBatch(db);
  
  tplData.tasks.forEach(t => {
    const taskRef = doc(collection(db, 'mgmt_tasks'));
    batch.set(taskRef, {
      projectId,
      title: t.title,
      priority: t.priority,
      status: 'pending',
      subTasks: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });

  await batch.commit();
  await addProjectActivity(projectId, {
    type: 'system',
    content: `Applied task template: ${tplData.title}`,
    authorId,
    authorName
  });

  return tplData.tasks.length;
};

// --- Templates (Questionnaires) ---
export const getQuestionnaireTemplates = async () => {
  const snapshot = await getDocs(collection(db, 'mgmt_questionnaire_templates'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as QuestionnaireTemplate[];
};

export const saveQuestionnaireTemplate = async (data: any) => {
  return await addDoc(collection(db, 'mgmt_questionnaire_templates'), {
    ...data,
    updatedAt: serverTimestamp()
  });
};

// --- CRM & Activity ---
export const addProjectActivity = async (projectId: string, activity: Omit<ProjectActivity, 'id' | 'timestamp'>) => {
  return await addDoc(collection(db, 'mgmt_projects', projectId, 'activity'), { ...activity, timestamp: serverTimestamp() });
};

export const getProjectActivity = async (projectId: string) => {
  const q = query(collection(db, 'mgmt_projects', projectId, 'activity'), orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProjectActivity[];
};

export const logAuditEvent = async (event: Omit<AuditEntry, 'id' | 'timestamp'>) => {
  return await addDoc(collection(db, 'mgmt_audit_log'), { ...event, timestamp: serverTimestamp() });
};

export const getAuditLogs = async (limitCount = 50) => {
  const q = query(collection(db, 'mgmt_audit_log'), orderBy('timestamp', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AuditEntry[];
};

export const logPostProjectFeedback = async (projectId: string, customerFeedback: string, supplierFeedback: {id: string, content: string}[], authorId: string, authorName: string) => {
  const project = await getProjectById(projectId);
  if (!project) return;

  const batch = writeBatch(db);
  
  // Sync to Customer
  const projectsRef = collection(db, 'mgmt_projects');
  const q = query(projectsRef, where('customerDetails.email', '==', project.customerDetails.email));
  const snap = await getDocs(q);
  snap.docs.forEach(d => {
    batch.update(d.ref, { 'customerDetails.preferences': arrayUnion(customerFeedback) });
  });

  // Sync to Suppliers
  for (const f of supplierFeedback) {
    const sRef = doc(db, 'mgmt_suppliers', f.id);
    batch.update(sRef, {
      operationalNotes: arrayUnion({ content: f.content, projectId, timestamp: new Date() })
    });
  }

  await batch.commit();
  await logAuditEvent({
    event: 'crm_sync',
    severity: 'info',
    projectId,
    userId: authorId,
    userName: authorName,
    details: `Post-project feedback synced to CRM profiles.`,
  });
};

// --- Supplier Billing ---
export const getSupplierBills = async (projectId: string) => {
  const q = query(collection(db, 'mgmt_supplier_bills'), where('projectId', '==', projectId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
};

export const createSupplierBill = async (projectId: string, data: any, authorId: string, authorName: string) => {
  const ref = await addDoc(collection(db, 'mgmt_supplier_bills'), {
    ...data,
    projectId,
    createdAt: serverTimestamp()
  });

  await addProjectActivity(projectId, {
    type: 'bill_added',
    content: `Added bill from ${data.supplierName}: ${data.currency} ${data.amount}`,
    authorId,
    authorName
  });

  return ref;
};

export const recordSupplierPayment = async (billId: string, data: any, authorId: string, authorName: string) => {
  const billRef = doc(db, 'mgmt_supplier_bills', billId);
  const billDoc = await getDoc(billRef);
  const billData = billDoc.data();

  await updateDoc(billRef, { status: 'paid' });
  
  await addDoc(collection(db, 'mgmt_supplier_payments'), {
    ...data,
    billId,
    authorId,
    authorName,
    timestamp: serverTimestamp()
  });

  if (billData) {
    await addProjectActivity(billData.projectId, {
      type: 'payment_recorded',
      content: `Recorded payment for ${billData.supplierName}: ${billData.currency} ${data.amount}`,
      authorId,
      authorName
    });
  }
};
