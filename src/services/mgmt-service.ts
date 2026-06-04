
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
  Supplier
} from '@/types';

const { db } = initializeFirebase();

// Staff
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

// Projects
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
  await updateDoc(ref, { status, updatedAt: serverTimestamp() });
  await addProjectActivity(projectId, { type: 'status_change', content: `Status -> ${status}`, authorId, authorName });
};

// CRM Memory Sync (Requirement 6.6 Enhancement)
export const logPostProjectFeedback = async (projectId: string, customerFeedback: string, supplierFeedback: {id: string, content: string}[], authorId: string, authorName: string) => {
  const project = await getProjectById(projectId);
  if (!project) return;

  // 1. Sync to Customer
  const customerEmail = project.customerDetails.email.toLowerCase();
  const projectsRef = collection(db, 'mgmt_projects');
  const q = query(projectsRef, where('customerDetails.email', '==', project.customerDetails.email));
  const snap = await getDocs(q);
  
  // Update customer profile preferences in all project records (simulating CRM sync)
  const batch = writeBatch(db);
  snap.docs.forEach(d => {
    batch.update(d.ref, { 'customerDetails.preferences': arrayUnion(customerFeedback) });
  });

  // 2. Sync to Suppliers
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

// Common
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

export const getSuppliers = async () => {
  const snapshot = await getDocs(collection(db, 'mgmt_suppliers'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Supplier[];
};

export const getProjectTasks = async (projectId: string) => {
  const q = query(collection(db, 'mgmt_tasks'), where('projectId', '==', projectId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
};

export const getDocuments = async (projectId: string) => {
  const q = query(collection(db, 'mgmt_documents'), where('projectId', '==', projectId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DocumentMetadata[];
};
