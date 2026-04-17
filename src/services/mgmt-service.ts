
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
  Timestamp
} from 'firebase/firestore';
import { Project, Task, ProjectStatus, StaffProfile, ProjectActivity, ProjectAssignment } from '@/types';

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
  
  // Create initial activity log
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
