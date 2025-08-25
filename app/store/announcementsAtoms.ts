import { atom } from 'jotai';
import { Announcement } from '../types';

// Define notification interface
interface StudentNotification {
  id: string;
  studentId: string;
  announcementId: string;
  title: string;
  message: string;
  type: 'announcement' | 'message' | 'alert';
  urgent: boolean;
  read: boolean;
  createdAt: Date;
  readAt?: Date;
}

// Announcements Data
export const announcementsAtom = atom<Announcement[]>([]);
export const announcementsLoadingAtom = atom<boolean>(false);
export const selectedAnnouncementAtom = atom<Announcement | null>(null);

// Announcement Sorting and Filtering
export const announcementSortByAtom = atom<string>('date');
export const announcementFilterByAtom = atom<string>('all');

// Announcement Form
export const newAnnouncementAtom = atom({
  title: '',
  message: '',
  messageType: 'announcement',
  targetAudience: 'all',
  targetLevels: [] as string[],
  targetStudents: [] as string[],
  urgent: false,
  sendToTelegram: true
});

// Student Selection for Messages
export const selectedStudentsForMessageAtom = atom<string[]>([]);
export const selectAllAtom = atom<boolean>(false);

// Send State
export const sendingAnnouncementAtom = atom<boolean>(false);

// Notification State
export const unreadNotificationsAtom = atom<number>(0);
export const studentNotificationsAtom = atom<StudentNotification[]>([]);