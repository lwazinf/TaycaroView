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
  serverTimestamp,
  setDoc,
  getDoc,
  limit,
  Timestamp
} from 'firebase/firestore';
import { firestore } from '../utils/firebase';
import { NursingStudent, AttendanceRecord, AttendanceList, StudentMessage, DailyAttendance, AttendanceView } from '../types';
import { formatDateForId } from '../utils/helpers';
export { loadStudentDocuments } from '../services/documentsService';

// Helper function to handle Firestore data conversion
const convertFirestoreData = (data: Record<string, unknown>): Partial<NursingStudent> => {
  return {
    studentId: data.studentId as string,
    name: data.name as string,
    email: data.email as string,
    academicYear: data.academicYear as string,
    nursingLevel: data.nursingLevel as string,
    createdAt: data.createdAt as Timestamp,
    telegramId: data.telegramId as string,
    phoneNumber: data.phoneNumber as string,
    clinicalRotation: data.clinicalRotation as string,
    overallGrade: (data.overallGrade as number) || 0,
    completedAssignments: (data.completedAssignments as number) || 0,
    totalAssignments: (data.totalAssignments as number) || 0,
    attendanceRate: (data.attendanceRate as number) || 0,
    lastActive: data.lastActive as Timestamp,
    profileImage: data.profileImage as string
  };
};

export const loadStudents = async (): Promise<NursingStudent[]> => {
  try {
    const q = query(collection(firestore, 'nursingStudents'), orderBy('name'));
    const snapshot = await getDocs(q);
    const loadedStudents: NursingStudent[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      const studentData = convertFirestoreData(data);
      
      // Only push if required fields exist
      if (studentData.studentId && studentData.name && studentData.email && 
          studentData.academicYear && studentData.nursingLevel && studentData.createdAt) {
        loadedStudents.push({
          id: docSnap.id,
          studentId: studentData.studentId,
          name: studentData.name,
          email: studentData.email,
          academicYear: studentData.academicYear,
          nursingLevel: studentData.nursingLevel,
          createdAt: studentData.createdAt,
          telegramId: studentData.telegramId,
          phoneNumber: studentData.phoneNumber,
          clinicalRotation: studentData.clinicalRotation,
          overallGrade: studentData.overallGrade,
          completedAssignments: studentData.completedAssignments,
          totalAssignments: studentData.totalAssignments,
          attendanceRate: studentData.attendanceRate,
          lastActive: studentData.lastActive,
          profileImage: studentData.profileImage
        });
      }
    });
    
    // Get document counts
    const studentsWithCounts = await Promise.all(
      loadedStudents.map(async (student) => {
        try {
          const docQuery = query(
            collection(firestore, 'studentDocuments'),
            where('studentId', '==', student.studentId)
          );
          const docSnapshot = await getDocs(docQuery);
          return { ...student, documentCount: docSnapshot.size };
        } catch (error: unknown) {
          console.error(`Error loading document count for student ${student.studentId}:`, error);
          return { ...student, documentCount: 0 };
        }
      })
    );
    
    return studentsWithCounts;
  } catch (error: unknown) {
    console.error('Error loading students:', error);
    throw error;
  }
};

// Define the student data interface for adding
interface AddStudentData {
  studentId: string;
  name: string;
  email: string;
  academicYear: string;
  nursingLevel: string;
  telegramId?: string;
  phoneNumber?: string;
  clinicalRotation?: string;
}

export const addStudent = async (studentData: AddStudentData): Promise<void> => {
  try {
    await addDoc(collection(firestore, 'nursingStudents'), {
      ...studentData,
      createdAt: serverTimestamp(),
      overallGrade: 0,
      completedAssignments: 0,
      totalAssignments: 0,
      attendanceRate: 100,
      profileImage: ''
    });
  } catch (error: unknown) {
    console.error('Error adding student:', error);
    throw error;
  }
};

export const loadTodaysAttendance = async (date: string): Promise<{ attendance: DailyAttendance, records: AttendanceRecord[] }> => {
  try {
    const formattedDate = formatDateForId(date);
    
    const attendanceListDoc = await getDoc(doc(firestore, 'admin', `attendance_${formattedDate}`));
    
    if (attendanceListDoc.exists()) {
      const data = attendanceListDoc.data() as Record<string, unknown>;
      if (data.isFinalized) {
        // Properly convert the data to AttendanceList type
        const attendanceList: AttendanceList = {
          id: data.id as string,
          date: data.date as string,
          takenBy: data.takenBy as string,
          submittedAt: data.submittedAt as Timestamp,
          totalStudents: data.totalStudents as number,
          presentCount: data.presentCount as number,
          absentCount: data.absentCount as number,
          attendanceRecords: (data.attendanceRecords as Record<string, unknown>[]).map(record => ({
            id: record.id as string | undefined,
            studentId: record.studentId as string,
            date: record.date as string,
            present: record.present as boolean,
            markedAt: record.markedAt as Timestamp,
            markedBy: record.markedBy as string
          })),
          isFinalized: data.isFinalized as boolean
        };

        const attendanceData: DailyAttendance = {};
        
        attendanceList.attendanceRecords.forEach(record => {
          attendanceData[record.studentId] = record.present;
        });
        
        return {
          attendance: attendanceData,
          records: attendanceList.attendanceRecords
        };
      }
    }
    
    // Fallback to individual records
    const q = query(
      collection(firestore, 'attendance'),
      where('date', '==', date)
    );
    const snapshot = await getDocs(q);
    
    const attendanceData: DailyAttendance = {};
    const records: AttendanceRecord[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      const record: AttendanceRecord = {
        id: docSnap.id,
        studentId: data.studentId as string,
        date: data.date as string,
        present: data.present as boolean,
        markedAt: data.markedAt as Timestamp,
        markedBy: data.markedBy as string
      };
      attendanceData[record.studentId] = record.present;
      records.push(record);
    });
    
    return {
      attendance: attendanceData,
      records: records
    };
  } catch (error: unknown) {
    console.error('Error loading attendance:', error);
    throw error;
  }
};

export const loadAttendanceViewData = async (date: string, students: NursingStudent[]): Promise<AttendanceView> => {
  try {
    const formattedDate = formatDateForId(date);
    const selectedDate = new Date(date);
    
    // Get students who were enrolled on or before the selected date
    const enrolledStudents = students.filter(student => {
      const enrollmentDate = student.createdAt.toDate();
      return enrollmentDate <= selectedDate;
    });

    // Try to get attendance data from admin collection first
    const attendanceListDoc = await getDoc(doc(firestore, 'admin', `attendance_${formattedDate}`));
    
    const presentStudents: NursingStudent[] = [];
    const absentStudents: NursingStudent[] = [];
    let takenBy = '';
    let submittedAt: Timestamp | undefined;

    if (attendanceListDoc.exists()) {
      // Use finalized attendance data
      const data = attendanceListDoc.data() as Record<string, unknown>;
      
      // Properly convert the data to AttendanceList type
      const attendanceList: AttendanceList = {
        id: data.id as string,
        date: data.date as string,
        takenBy: data.takenBy as string,
        submittedAt: data.submittedAt as Timestamp,
        totalStudents: data.totalStudents as number,
        presentCount: data.presentCount as number,
        absentCount: data.absentCount as number,
        attendanceRecords: (data.attendanceRecords as Record<string, unknown>[]).map(record => ({
          id: record.id as string | undefined,
          studentId: record.studentId as string,
          date: record.date as string,
          present: record.present as boolean,
          markedAt: record.markedAt as Timestamp,
          markedBy: record.markedBy as string
        })),
        isFinalized: data.isFinalized as boolean
      };

      takenBy = attendanceList.takenBy;
      submittedAt = attendanceList.submittedAt;

      const attendanceMap: Record<string, boolean> = {};
      attendanceList.attendanceRecords.forEach(record => {
        attendanceMap[record.studentId] = record.present;
      });

      enrolledStudents.forEach(student => {
        if (attendanceMap[student.studentId] === true) {
          presentStudents.push(student);
        } else {
          absentStudents.push(student);
        }
      });
    } else {
      // Fallback to individual attendance records
      const q = query(
        collection(firestore, 'attendance'),
        where('date', '==', date)
      );
      const snapshot = await getDocs(q);
      
      const attendanceMap: Record<string, boolean> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        const record: AttendanceRecord = {
          id: docSnap.id,
          studentId: data.studentId as string,
          date: data.date as string,
          present: data.present as boolean,
          markedAt: data.markedAt as Timestamp,
          markedBy: data.markedBy as string
        };
        attendanceMap[record.studentId] = record.present;
        if (!takenBy && record.markedBy) {
          takenBy = record.markedBy;
        }
      });

      enrolledStudents.forEach(student => {
        if (attendanceMap[student.studentId] === true) {
          presentStudents.push(student);
        } else if (attendanceMap[student.studentId] === false) {
          absentStudents.push(student);
        }
      });
    }

    // Sort students by name
    presentStudents.sort((a, b) => a.name.localeCompare(b.name));
    absentStudents.sort((a, b) => a.name.localeCompare(b.name));

    return {
      date: formattedDate,
      presentStudents,
      absentStudents,
      totalEnrolled: enrolledStudents.length,
      presentCount: presentStudents.length,
      absentCount: absentStudents.length,
      takenBy,
      submittedAt
    };
  } catch (error: unknown) {
    console.error('Error loading attendance view:', error);
    throw error;
  }
};

export const toggleAttendance = async (studentId: string, date: string, newStatus: boolean): Promise<void> => {
  try {
    const attendanceId = `${studentId}_${date}`;
    
    const attendanceData: Omit<AttendanceRecord, 'id'> = {
      studentId: studentId,
      date: date,
      present: newStatus,
      markedAt: serverTimestamp() as Timestamp,
      markedBy: 'instructor'
    };

    await setDoc(doc(firestore, 'attendance', attendanceId), attendanceData);
  } catch (error: unknown) {
    console.error('Error updating attendance:', error);
    throw error;
  }
};

export const submitAttendanceList = async (
  students: NursingStudent[], 
  attendance: DailyAttendance, 
  date: string
): Promise<void> => {
  try {
    const formattedDate = formatDateForId(date);
    const attendanceRecords: AttendanceRecord[] = [];
    
    let presentCount = 0;
    let absentCount = 0;
    
    students.forEach(student => {
      const isPresent = attendance[student.studentId] || false;
      attendanceRecords.push({
        studentId: student.studentId,
        date: date,
        present: isPresent,
        markedAt: serverTimestamp() as Timestamp,
        markedBy: 'instructor'
      });
      
      if (isPresent) {
        presentCount++;
      } else {
        absentCount++;
      }
    });
    
    const attendanceList: AttendanceList = {
      id: `attendance_${formattedDate}`,
      date: formattedDate,
      takenBy: 'instructor',
      submittedAt: serverTimestamp() as Timestamp,
      totalStudents: students.length,
      presentCount: presentCount,
      absentCount: absentCount,
      attendanceRecords: attendanceRecords,
      isFinalized: true
    };

    await setDoc(doc(firestore, 'admin', `attendance_${formattedDate}`), attendanceList);
  } catch (error: unknown) {
    console.error('Error submitting attendance list:', error);
    throw error;
  }
};

export const loadStudentAttendanceHistory = async (studentId: string): Promise<AttendanceRecord[]> => {
  try {
    const q = query(
      collection(firestore, 'attendance'),
      where('studentId', '==', studentId),
      orderBy('date', 'desc'),
      limit(30)
    );
    const snapshot = await getDocs(q);
    
    const history: AttendanceRecord[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      history.push({
        id: docSnap.id,
        studentId: data.studentId as string,
        date: data.date as string,
        present: data.present as boolean,
        markedAt: data.markedAt as Timestamp,
        markedBy: data.markedBy as string
      });
    });
    
    return history;
  } catch (error: unknown) {
    console.error('Error loading student attendance:', error);
    throw error;
  }
};

export const loadStudentMessages = async (studentId: string): Promise<StudentMessage[]> => {
  try {
    const q = query(
      collection(firestore, 'studentMessages'),
      where('studentId', '==', studentId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const messages: StudentMessage[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      messages.push({
        id: docSnap.id,
        studentId: data.studentId as string,
        fromInstructor: data.fromInstructor as boolean,
        message: data.message as string,
        createdAt: data.createdAt as Timestamp,
        read: data.read as boolean,
        urgent: (data.urgent as boolean) || false
      });
    });
    
    return messages;
  } catch (error: unknown) {
    console.error('Error loading student messages:', error);
    throw error;
  }
};

export const sendMessageToStudent = async (studentId: string, message: string): Promise<void> => {
  try {
    await addDoc(collection(firestore, 'studentMessages'), {
      studentId: studentId,
      fromInstructor: true,
      message: message,
      createdAt: serverTimestamp(),
      read: false,
      urgent: false
    });
  } catch (error: unknown) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Remove unused imports - deleteDoc and updateDoc are imported but never used
// If you need them later, you can add them back