import { atom } from 'jotai';
import { StudentDocument } from '../types';

// Documents Data
export const allDocumentsAtom = atom<StudentDocument[]>([]);
export const documentsLoadingAtom = atom<boolean>(false);
export const selectedDocumentAtom = atom<StudentDocument | null>(null);

// Document Organization
export const sortByAtom = atom<string>('date');
export const groupByAtom = atom<string>('none');

// Document Editing
export const editingDocumentAtom = atom<string | null>(null);
export const editGradeAtom = atom({
  grade: 0,
  maxGrade: 100,
  feedback: ''
});

// Upload Form
export const newDocumentAtom = atom({
  studentId: '',
  category: 'assignments',
  files: null as FileList | null
});

// Upload State
export const uploadingAtom = atom<boolean>(false);
export const uploadProgressAtom = atom<number>(0);

// Filters
export const categoryFilterAtom = atom<string>('all');
export const levelFilterAtom = atom<string>('all');
export const gradedFilterAtom = atom<string>('all');
export const starredFilterAtom = atom<string>('all');