import { Timestamp } from 'firebase/firestore';

export interface NursingStudent {
  id: string;
  studentId: string;
  name: string;
  email: string;
  academicYear: string;
  nursingLevel: string;
  createdAt: Timestamp;
  documentCount?: number;
  telegramId?: string;
  phoneNumber?: string;
  clinicalRotation?: string;
  overallGrade?: number;
  completedAssignments?: number;
  totalAssignments?: number;
  attendanceRate?: number;
  lastActive?: Timestamp;
  profileImage?: string;
}

export interface StudyResource {
  id: string;
  title: string;
  description: string;
  fileName: string;
  url: string;
  size: number;
  type: string;
  category: string;
  targetLevels: string[];
  targetRotations: string[];
  uploadedAt: Timestamp;
  uploadedBy: string;
  storagePath: string;
  downloadCount: number;
}

export interface StudentDocument {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  category: string;
  uploadedAt: Timestamp;
  storagePath: string;
  studentId: string;
  studentName: string;
  academicYear: string;
  nursingLevel: string;
  grade?: number;
  maxGrade?: number;
  feedback?: string;
  dateGraded?: Timestamp;
  isGraded: boolean;
  isStarred?: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  messageType: 'announcement' | 'individual' | 'resource';
  targetAudience: 'all' | 'level' | 'individual';
  targetLevels?: string[];
  targetStudents?: string[];
  createdAt: Timestamp;
  urgent: boolean;
  sentToTelegram: boolean;
  readBy: string[];
  createdBy: string;
  resourceId?: string;
}

export interface AttendanceRecord {
  id?: string;
  studentId: string;
  date: string;
  present: boolean;
  markedAt: Timestamp;
  markedBy: string;
}

export interface AttendanceList {
  id: string;
  date: string;
  takenBy: string;
  submittedAt: Timestamp;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  attendanceRecords: AttendanceRecord[];
  isFinalized: boolean;
}

export interface AttendanceView {
  date: string;
  presentStudents: NursingStudent[];
  absentStudents: NursingStudent[];
  totalEnrolled: number;
  presentCount: number;
  absentCount: number;
  takenBy?: string;
  submittedAt?: Timestamp;
}

export interface DailyAttendance {
  [studentId: string]: boolean;
}

export interface StudentMessage {
  id: string;
  studentId: string;
  fromInstructor: boolean;
  message: string;
  createdAt: Timestamp;
  read: boolean;
  urgent?: boolean;
}

export interface StudentPerformance {
  studentId: string;
  averageGrade: number;
  submissionRate: number;
  attendanceRate: number;
  improvementTrend: 'up' | 'down' | 'stable';
  recentGrades: { assignment: string; grade: number; date: Timestamp }[];
}

// Constants
export const CATEGORIES = [
  { value: 'assignments', label: 'Assignments' },
  { value: 'clinical-reports', label: 'Clinical Reports' },
  { value: 'care-plans', label: 'Care Plans' },
  { value: 'case-studies', label: 'Case Studies' },
  { value: 'research', label: 'Research Papers' },
  { value: 'presentations', label: 'Presentations' },
  { value: 'portfolios', label: 'Portfolios' }
];

export const RESOURCE_CATEGORIES = [
  { value: 'lecture-notes', label: 'Lecture Notes' },
  { value: 'study-guides', label: 'Study Guides' },
  { value: 'textbooks', label: 'Textbooks & References' },
  { value: 'case-studies', label: 'Case Studies' },
  { value: 'procedures', label: 'Clinical Procedures' },
  { value: 'assessments', label: 'Assessment Tools' },
  { value: 'videos', label: 'Video Resources' },
  { value: 'research', label: 'Research Articles' }
];

export const NURSING_LEVELS = [
  { value: 'first-year', label: 'First Year' },
  { value: 'second-year', label: 'Second Year' },
  { value: 'third-year', label: 'Third Year' },
  { value: 'fourth-year', label: 'Fourth Year' },
  { value: 'postgraduate', label: 'Postgraduate' }
];

export const CLINICAL_ROTATIONS = [
  'Medical Ward',
  'Surgical Ward',
  'ICU/Critical Care',
  'Emergency Department',
  'Pediatrics',
  'Obstetrics & Gynecology',
  'Psychiatry',
  'Community Health',
  'Operating Theatre',
  'Maternity Ward'
];

export const STUDENT_SIDEBAR_TABS = [
  { id: 'details', label: 'Details' },
  { id: 'files', label: 'Files' },
  { id: 'messages', label: 'Messages' },
  { id: 'performance', label: 'Performance' },
  { id: 'attendance', label: 'Attendance' }
];