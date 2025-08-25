import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc,
  updateDoc,
  query,
  orderBy,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { firestore, storage } from '../utils/firebase';
import { StudentDocument, NursingStudent } from '../types';

export const loadAllDocuments = async (): Promise<StudentDocument[]> => {
  try {
    const q = query(collection(firestore, 'studentDocuments'), orderBy('uploadedAt', 'desc'));
    const snapshot = await getDocs(q);
    const loadedDocs: StudentDocument[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      loadedDocs.push({
        id: docSnap.id,
        name: data.name,
        url: data.url,
        size: data.size,
        type: data.type,
        category: data.category,
        uploadedAt: data.uploadedAt,
        storagePath: data.storagePath,
        studentId: data.studentId,
        studentName: data.studentName,
        academicYear: data.academicYear,
        nursingLevel: data.nursingLevel,
        grade: data.grade,
        maxGrade: data.maxGrade,
        feedback: data.feedback,
        dateGraded: data.dateGraded,
        isGraded: data.isGraded || false,
        isStarred: data.isStarred || false
      });
    });
    
    return loadedDocs;
  } catch (error) {
    console.error('Error loading documents:', error);
    throw error;
  }
};

export const uploadDocument = async (
  files: FileList, 
  studentId: string, 
  category: string, 
  student: NursingStudent
): Promise<void> => {
  try {
    const uploadPromises = Array.from(files).map(async (file) => {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const sanitizedStudentName = student.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      
      const storagePath = `student-documents/${student.academicYear}/${sanitizedStudentName}_${student.studentId}/${category}/${timestamp}_${sanitizedName}`;
      
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      await addDoc(collection(firestore, 'studentDocuments'), {
        name: file.name,
        url: downloadURL,
        size: file.size,
        type: file.type,
        category: category,
        uploadedAt: serverTimestamp(),
        storagePath: storagePath,
        studentId: student.studentId,
        studentName: student.name,
        academicYear: student.academicYear,
        nursingLevel: student.nursingLevel,
        isGraded: false,
        isStarred: false
      });
    });
    
    await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

export const deleteDocument = async (document: StudentDocument): Promise<void> => {
  try {
    // Delete from storage
    await deleteObject(ref(storage, document.storagePath));
    
    // Delete from firestore
    await deleteDoc(doc(firestore, 'studentDocuments', document.id));
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
};

export const updateDocumentGrade = async (
  documentId: string, 
  grade: number, 
  maxGrade: number, 
  feedback: string
): Promise<void> => {
  try {
    await updateDoc(doc(firestore, 'studentDocuments', documentId), {
      grade: grade,
      maxGrade: maxGrade,
      feedback: feedback.trim(),
      dateGraded: serverTimestamp(),
      isGraded: true
    });
  } catch (error) {
    console.error('Update error:', error);
    throw error;
  }
};

export const toggleDocumentStar = async (documentId: string, isStarred: boolean): Promise<void> => {
  try {
    await updateDoc(doc(firestore, 'studentDocuments', documentId), {
      isStarred: !isStarred
    });
  } catch (error) {
    console.error('Star error:', error);
    throw error;
  }
};

export const loadStudentDocuments = async (studentId: string): Promise<StudentDocument[]> => {
  try {
    const q = query(
      collection(firestore, 'studentDocuments'),
      where('studentId', '==', studentId),
      orderBy('uploadedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const docs: StudentDocument[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      docs.push({
        id: docSnap.id,
        name: data.name,
        url: data.url,
        size: data.size,
        type: data.type,
        category: data.category,
        uploadedAt: data.uploadedAt,
        storagePath: data.storagePath,
        studentId: data.studentId,
        studentName: data.studentName,
        academicYear: data.academicYear,
        nursingLevel: data.nursingLevel,
        grade: data.grade,
        maxGrade: data.maxGrade,
        feedback: data.feedback,
        dateGraded: data.dateGraded,
        isGraded: data.isGraded || false,
        isStarred: data.isStarred || false
      });
    });
    
    return docs;
  } catch (error) {
    console.error('Error loading student documents:', error);
    throw error;
  }
};

export const getDocumentsByCategory = async (category: string): Promise<StudentDocument[]> => {
  try {
    const q = query(
      collection(firestore, 'studentDocuments'),
      where('category', '==', category),
      orderBy('uploadedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const docs: StudentDocument[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      docs.push({
        id: docSnap.id,
        ...data
      } as StudentDocument);
    });
    
    return docs;
  } catch (error) {
    console.error('Error loading documents by category:', error);
    throw error;
  }
};

export const getUngradedDocuments = async (): Promise<StudentDocument[]> => {
  try {
    const q = query(
      collection(firestore, 'studentDocuments'),
      where('isGraded', '==', false),
      orderBy('uploadedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const docs: StudentDocument[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      docs.push({
        id: docSnap.id,
        ...data
      } as StudentDocument);
    });
    
    return docs;
  } catch (error) {
    console.error('Error loading ungraded documents:', error);
    throw error;
  }
};

export const getStarredDocuments = async (): Promise<StudentDocument[]> => {
  try {
    const q = query(
      collection(firestore, 'studentDocuments'),
      where('isStarred', '==', true),
      orderBy('uploadedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const docs: StudentDocument[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      docs.push({
        id: docSnap.id,
        ...data
      } as StudentDocument);
    });
    
    return docs;
  } catch (error) {
    console.error('Error loading starred documents:', error);
    throw error;
  }
};