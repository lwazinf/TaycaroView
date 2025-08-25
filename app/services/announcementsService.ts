import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  arrayUnion,
  where,
  Timestamp
} from 'firebase/firestore';
import { firestore } from '../utils/firebase';
import { Announcement } from '../types';
import { sendIndividualTelegramMessage, sendBulkTelegramAnnouncement } from './telegramService';

export const loadAnnouncements = async (): Promise<Announcement[]> => {
  try {
    const q = query(collection(firestore, 'announcements'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const announcements: Announcement[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      announcements.push({
        id: docSnap.id,
        title: data.title as string,
        message: data.message as string,
        messageType: data.messageType as 'announcement' | 'individual' | 'resource',
        targetAudience: data.targetAudience as 'all' | 'level' | 'individual',
        targetLevels: data.targetLevels as string[] || [],
        targetStudents: data.targetStudents as string[] || [],
        createdAt: data.createdAt as Timestamp,
        urgent: data.urgent as boolean,
        sentToTelegram: data.sentToTelegram as boolean,
        readBy: data.readBy as string[] || [],
        createdBy: data.createdBy as string,
        resourceId: data.resourceId as string
      });
    });
    
    return announcements;
  } catch (error: unknown) {
    console.error('Error loading announcements:', error);
    throw error;
  }
};

export const deleteAnnouncement = async (announcementId: string): Promise<void> => {
  try {
    await deleteDoc(doc(firestore, 'announcements', announcementId));
  } catch (error: unknown) {
    console.error('Error deleting announcement:', error);
    throw error;
  }
};

export const resendAnnouncement = async (announcement: Announcement): Promise<void> => {
  try {
    if (announcement.messageType === 'individual') {
      const promises = (announcement.targetStudents || []).map(studentId => 
        sendIndividualTelegramMessage(
          studentId,
          announcement.title,
          announcement.message,
          announcement.id,
          announcement.urgent
        )
      );
      await Promise.all(promises);
    } else {
      await sendBulkTelegramAnnouncement(
        announcement.title,
        announcement.message,
        announcement.id,
        announcement.targetAudience,
        announcement.targetLevels || [],
        announcement.targetStudents || [],
        announcement.urgent
      );
    }
  } catch (error: unknown) {
    console.error('Error resending announcement:', error);
    throw error;
  }
};

export const sendAnnouncement = async (announcementData: {
  title: string;
  message: string;
  messageType: string;
  targetAudience: string;
  targetLevels: string[];
  targetStudents: string[];
  urgent: boolean;
  sendToTelegram: boolean;
}): Promise<string> => {
  try {
    const docRef = await addDoc(collection(firestore, 'announcements'), {
      title: announcementData.title,
      message: announcementData.message,
      messageType: announcementData.messageType,
      targetAudience: announcementData.targetAudience,
      targetLevels: announcementData.targetLevels,
      targetStudents: announcementData.targetStudents,
      createdAt: serverTimestamp(),
      urgent: announcementData.urgent,
      sentToTelegram: announcementData.sendToTelegram,
      readBy: [],
      createdBy: 'instructor'
    });

    return docRef.id;
  } catch (error: unknown) {
    console.error('Error sending announcement:', error);
    throw error;
  }
};

const createStudentNotifications = async (announcementId: string, announcementData: Record<string, unknown>): Promise<void> => {
  // Implementation for creating student notifications
  console.log('Creating notifications for announcement:', announcementId, announcementData);
};