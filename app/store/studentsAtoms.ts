import { atom } from 'jotai';
import { 
  NursingStudent, 
  AttendanceRecord, 
  DailyAttendance, 
  AttendanceView, 
  StudentMessage, 
  StudentDocument 
} from '../types';

// Define interfaces for typed data
export interface RecentActivity {
  id: string;
  type: 'assignment' | 'attendance' | 'grade' | 'message';
  description: string;
  date: Date;
  status: 'completed' | 'pending' | 'missed';
}

export interface StudentPerformance {
  overallGrade: number;
  completedAssignments: number;
  totalAssignments: number;
  attendanceRate: number;
  recentActivity: RecentActivity[];
}

// Students Data
export const studentsAtom = atom<NursingStudent[]>([]);
export const selectedStudentAtom = atom<NursingStudent | null>(null);

// Attendance State
export const showAttendanceModeAtom = atom<boolean>(false);
export const todaysAttendanceAtom = atom<DailyAttendance>({});
export const attendanceHistoryAtom = atom<AttendanceRecord[]>([]);
export const selectedAttendanceDateAtom = atom<string>(new Date().toISOString().split('T')[0]);
export const attendanceLoadingAtom = atom<boolean>(false);
export const attendanceChangedAtom = atom<boolean>(false);
export const showAttendanceSubmitDialogAtom = atom<boolean>(false);

// Attendance Viewer (replaces modal)
export const showAttendanceViewerAtom = atom<boolean>(false);
export const attendanceViewDataAtom = atom<AttendanceView | null>(null);
export const attendanceViewLoadingAtom = atom<boolean>(false);

// Student Sidebar
export const selectedStudentForSidebarAtom = atom<NursingStudent | null>(null);
export const sidebarActiveTabAtom = atom<string>('details');
export const studentMessagesAtom = atom<StudentMessage[]>([]);
export const studentDocumentsAtom = atom<StudentDocument[]>([]);
export const studentPerformanceAtom = atom<StudentPerformance | null>(null);
export const studentAttendanceHistoryAtom = atom<AttendanceRecord[]>([]);
export const newStudentMessageAtom = atom<string>('');

// Forms
export const newStudentAtom = atom({
  studentId: '',
  name: '',
  email: '',
  academicYear: new Date().getFullYear().toString(),
  nursingLevel: 'first-year',
  telegramId: '',
  phoneNumber: '',
  clinicalRotation: ''
});