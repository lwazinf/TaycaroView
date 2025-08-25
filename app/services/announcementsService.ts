import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { firestore } from '../utils/firebase';
import { sendIndividualTelegramMessage, sendBulkTelegramAnnouncement } from './telegramService';

// Update the sendAnnouncement function
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

    // Send to Telegram if enabled
    if (announcementData.sendToTelegram) {
      if (announcementData.messageType === 'individual' || announcementData.targetAudience === 'individual') {
        // Send individual messages
        await sendIndividualTelegramMessages(
          docRef.id,
          announcementData.title,
          announcementData.message,
          announcementData.targetStudents,
          announcementData.urgent
        );
      } else {
        // Send bulk announcement to group
        await sendBulkTelegramAnnouncement(
          announcementData.title,
          announcementData.message,
          docRef.id,
          announcementData.targetAudience,
          announcementData.targetLevels,
          announcementData.targetStudents,
          announcementData.urgent
        );
      }
    }

    return docRef.id;
  } catch (error) {
    console.error('Error sending announcement:', error);
    throw error;
  }
};

// Helper function to send individual messages
const sendIndividualTelegramMessages = async (
  announcementId: string,
  title: string,
  message: string,
  targetStudents: string[],
  urgent: boolean
) => {
  try {
    // Get students with their Telegram IDs
    const studentsQuery = query(
      collection(firestore, 'nursingStudents'),
      where('studentId', 'in', targetStudents)
    );
    const studentsSnapshot = await getDocs(studentsQuery);
    
    const telegramPromises = studentsSnapshot.docs.map(async (studentDoc) => {
      const student = studentDoc.data();
      if (student.telegramId) {
        try {
          await sendIndividualTelegramMessage(
            student.telegramId,
            title,
            message,
            announcementId,
            urgent
          );
          console.log(`Message sent to ${student.name} (${student.telegramId})`);
        } catch (error) {
          console.error(`Failed to send message to ${student.name}:`, error);
        }
      } else {
        console.log(`Student ${student.name} has no Telegram ID`);
      }
    });

    await Promise.allSettled(telegramPromises);
  } catch (error) {
    console.error('Error sending individual Telegram messages:', error);
    throw error;
  }
};