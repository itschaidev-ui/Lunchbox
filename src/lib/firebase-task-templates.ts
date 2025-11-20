import { db } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';

export interface TaskTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  text: string;
  tags?: string[];
  dueDate?: string;
  repeating?: boolean;
  repeatPattern?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function createTaskTemplate(userId: string, template: Omit<TaskTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const templateData = {
    ...template,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const docRef = await addDoc(collection(db, 'taskTemplates'), templateData);
  return docRef.id;
}

export async function getUserTaskTemplates(userId: string): Promise<TaskTemplate[]> {
  const q = query(
    collection(db, 'taskTemplates'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  })) as TaskTemplate[];
}

export async function updateTaskTemplate(templateId: string, updates: Partial<TaskTemplate>): Promise<void> {
  await updateDoc(doc(db, 'taskTemplates', templateId), {
    ...updates,
    updatedAt: new Date(),
  });
}

export async function deleteTaskTemplate(templateId: string): Promise<void> {
  await deleteDoc(doc(db, 'taskTemplates', templateId));
}

