
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
  Timestamp
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
  Supplier,
  DocumentMetadata,
  PaymentPlan,
  SubTask,
  TaskComment
} from '@/types';

const { db } = initializeFirebase();

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

export const updateProjectStatus = async (projectId: string, status: ProjectStatus, authorId: string, authorName: string) => {
  const projectRef = doc(db, 'mgmt_projects', projectId);
  await updateDoc(projectRef, {
    status,
    updatedAt: serverTimestamp(),
  });

  await addProjectActivity(projectId, {
    type: 'status_change',
    content: `Status updated to ${status.replace('_', ' ')}`,
    authorId,
    authorName
  });
};

export const assignStaffToProject = async (projectId: string, assignment: ProjectAssignment, authorId: string, authorName: string) => {
  const projectRef = doc(db, 'mgmt_projects', projectId);
  await updateDoc(projectRef, {
    teamAssignments: arrayUnion(assignment),
    updatedAt: serverTimestamp(),
  });

  await addProjectActivity(projectId, {
    type: 'assignment',
    content: `Assigned ${assignment.staffName} as ${assignment.role}`,
    authorId,
    authorName
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

export const getSuppliers = async () => {
  const q = query(collection(db, 'mgmt_suppliers'), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Supplier[];
};

// Module 4: Document Services
export const getDocuments = async (projectId: string) => {
  const q = query(collection(db, 'mgmt_documents'), where('projectId', '==', projectId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DocumentMetadata[];
};

export const logDocumentCreation = async (docData: Omit<DocumentMetadata, 'id' | 'createdAt'>) => {
  return await addDoc(collection(db, 'mgmt_documents'), {
    ...docData,
    createdAt: serverTimestamp(),
  });
};

export const savePaymentPlan = async (projectId: string, plan: Omit<PaymentPlan, 'id' | 'updatedAt'>) => {
  const planRef = doc(db, 'mgmt_payment_plans', projectId); 
  return await setDoc(planRef, {
    ...plan,
    updatedAt: serverTimestamp(),
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

// Activity Log
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

// Module 5: Task Management
export const getProjectTasks = async (projectId: string) => {
  const q = query(
    collection(db, 'mgmt_tasks'), 
    where('projectId', '==', projectId),
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

  // Log to project activity if status changed
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

export const addTaskComment = async (taskId: string, comment: Omit<TaskComment, 'id' | 'timestamp'>) => {
  return await addDoc(collection(db, 'mgmt_tasks', taskId, 'comments'), {
    ...comment,
    timestamp: serverTimestamp(),
  });
};

export const getTaskComments = async (taskId: string) => {
  const q = query(collection(db, 'mgmt_tasks', taskId, 'comments'), orderBy('timestamp', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TaskComment[];
};
