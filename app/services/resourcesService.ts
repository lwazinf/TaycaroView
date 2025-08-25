import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { firestore, storage } from '../utils/firebase';
import { StudyResource } from '../types';

export const loadStudyResources = async (): Promise<StudyResource[]> => {
  try {
    const q = query(collection(firestore, 'studyResources'), orderBy('uploadedAt', 'desc'));
    const snapshot = await getDocs(q);
    const resources: StudyResource[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      resources.push({
        id: docSnap.id,
        title: data.title as string,
        description: data.description as string,
        fileName: data.fileName as string,
        url: data.url as string,
        size: data.size as number,
        type: data.type as string,
        category: data.category as string,
        targetLevels: data.targetLevels as string[],
        targetRotations: data.targetRotations as string[],
        uploadedAt: data.uploadedAt as Timestamp,
        uploadedBy: data.uploadedBy as string,
        storagePath: data.storagePath as string,
        downloadCount: data.downloadCount as number || 0
      });
    });
    
    return resources;
  } catch (error: unknown) {
    console.error('Error loading study resources:', error);
    throw error;
  }
};

export const uploadStudyResource = async (
  resourceData: {
    title: string;
    description: string;
    category: string;
    targetLevels: string[];
    targetRotations: string[];
  },
  file: File
): Promise<void> => {
  try {
    const storagePath = `study-resources/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, storagePath);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    await addDoc(collection(firestore, 'studyResources'), {
      title: resourceData.title,
      description: resourceData.description,
      fileName: file.name,
      url: downloadURL,
      size: file.size,
      type: file.type,
      category: resourceData.category,
      targetLevels: resourceData.targetLevels,
      targetRotations: resourceData.targetRotations,
      uploadedAt: serverTimestamp(),
      uploadedBy: 'instructor',
      storagePath: storagePath,
      downloadCount: 0
    });
  } catch (error: unknown) {
    console.error('Error uploading study resource:', error);
    throw error;
  }
};

export const deleteStudyResource = async (resource: StudyResource): Promise<void> => {
  try {
    const storageRef = ref(storage, resource.storagePath);
    await deleteObject(storageRef);
    await deleteDoc(doc(firestore, 'studyResources', resource.id));
  } catch (error: unknown) {
    console.error('Error deleting study resource:', error);
    throw error;
  }
};