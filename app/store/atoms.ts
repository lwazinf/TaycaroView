import { atom } from 'jotai';
import { studentsAtom } from './studentsAtoms';

// UI State
export const activeViewAtom = atom<string>('students');
export const searchTermAtom = atom<string>('');
export const loadingAtom = atom<boolean>(false);
export const errorAtom = atom<string | null>(null);

// Modal State
export const showModalAtom = atom<boolean>(false);
export const modalTypeAtom = atom<string>('');

// Navigation
export const selectedMenuItemAtom = atom<string>('students');

// Re-export students atom for convenience
export { studentsAtom };

// Re-export other commonly used atoms
export { 
  selectedStudentForSidebarAtom,
  showAttendanceModeAtom,
  selectedAttendanceDateAtom,
  attendanceChangedAtom,
  attendanceViewLoadingAtom
} from './studentsAtoms';