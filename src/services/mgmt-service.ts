
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
  setDoc
} from 'firebase/firestore';
import { Project, Task, ProjectStatus, StaffProfile } from '@/types';

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
    createdAt: serverTimestamp(), // In a real app, you'd check if it exists first
  }, { merge: true });
};

// Projects
export const createProject = async (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
  return await addDoc(collection(db, 'mgmt_projects'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
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
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Project;
  }
  return null;
};

export const updateProjectStatus = async (projectId: string, status: ProjectStatus) => {
  const projectRef = doc(db, 'mgmt_projects', projectId);
  return await updateDoc(projectRef, {
    status,
    updatedAt: serverTimestamp(),
  });
};

// Tasks
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

// Read-only helpers for Chrysalis collections (Production Safety)
export const getChrysalisUserByEmail = async (email: string) => {
  const q = query(collection(db, 'users'), where('email', '==', email));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
};

export const getChrysalisBooking = async (bookingId: string) => {
  const docRef = doc(db, 'bookings', bookingId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};
