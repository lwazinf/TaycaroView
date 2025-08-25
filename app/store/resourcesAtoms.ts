import { atom } from 'jotai';
import { StudyResource } from '../types';

// Resources Data
export const studyResourcesAtom = atom<StudyResource[]>([]);
export const resourcesLoadingAtom = atom<boolean>(false);
export const selectedResourceAtom = atom<StudyResource | null>(null);

// Resource Form
export const newResourceAtom = atom({
  title: '',
  description: '',
  category: 'lecture-notes',
  targetLevels: [] as string[],
  targetRotations: [] as string[],
  files: null as FileList | null
});

// Upload State
export const resourceUploadingAtom = atom<boolean>(false);
export const uploadProgressAtom = atom<number>(0);

// Filters and Search
export const resourceCategoryFilterAtom = atom<string>('all');
export const resourceLevelFilterAtom = atom<string>('all');
export const resourceSortByAtom = atom<string>('date');