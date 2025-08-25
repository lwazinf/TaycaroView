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
  limit
} from 'firebase/firestore';
import { firestore } from '../utils/firebase';
import { NursingStudent, AttendanceRecord, AttendanceList, StudentMessage, DailyAttendance, AttendanceView } from '../types';
import { formatDateForId } from '../utils/helpers';
export { loadStudentDocuments } from '../services/documentsService';

export const loadStudents = async (): Promise<NursingStudent[]> => {
  try {
    const q = query(collection(firestore, 'nursingStudents'), orderBy('name'));
    const snapshot = await getDocs(q);
    const loadedStudents: NursingStudent[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      loadedStudents.push({
        id: docSnap.id,
        studentId: data.studentId,
        name: data.name,
        email: data.email,
        academicYear: data.academicYear,
        nursingLevel: data.nursingLevel,
        createdAt: data.createdAt,
        telegramId: data.telegramId,
        phoneNumber: data.phoneNumber,
        clinicalRotation: data.clinicalRotation,
        overallGrade: data.overallGrade || 0,
        completedAssignments: data.completedAssignments || 0,
        totalAssignments: data.totalAssignments || 0,
        attendanceRate: data.attendanceRate || 0,
        lastActive: data.lastActive,
        profileImage: data.profileImage
      });
    });
    
    // Get document counts
    const studentsWithCounts = await Promise.all(
      loadedStudents.map(async (student) => {
        const docQuery = query(
          collection(firestore, 'studentDocuments'),
          where('studentId', '==', student.studentId)
        );
        const docSnapshot = await getDocs(docQuery);
        return { ...student, documentCount: docSnapshot.size };
      })
    );
    
    return studentsWithCounts;
  } catch (error) {
    console.error('Error loading students:', error);
    throw error;
  }
};

export const addStudent = async (studentData: any): Promise<void> => {
  try {
    await addDoc(collection(firestore, 'nursingStudents'), {
      ...studentData,
      createdAt: serverTimestamp(),
      overallGrade: 0,
      completedAssignments: 0,
      totalAssignments: 0,
      attendanceRate: 100
    });
  } catch (error) {
    console.error('Error adding student:', error);
    throw error;
  }
};

export const loadTodaysAttendance = async (date: string): Promise<{ attendance: DailyAttendance, records: AttendanceRecord[] }> => {
  try {
    const formattedDate = formatDateForId(date);
    
    const attendanceListDoc = await getDoc(doc(firestore, 'admin', `attendance_${formattedDate}`));
    
    if (attendanceListDoc.exists() && attendanceListDoc.data().isFinalized) {
      const attendanceList = attendanceListDoc.data() as AttendanceList;
      const attendanceData: DailyAttendance = {};
      
      attendanceList.attendanceRecords.forEach(record => {
        attendanceData[record.studentId] = record.present;
      });
      
      return {
        attendance: attendanceData,
        records: attendanceList.attendanceRecords
      };
    } else {
      const q = query(
        collection(firestore, 'attendance'),
        where('date', '==', date)
      );
      const snapshot = await getDocs(q);
      
      const attendanceData: DailyAttendance = {};
      const records: AttendanceRecord[] = [];
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as AttendanceRecord;
        attendanceData[data.studentId] = data.present;
        records.push({ ...data, id: docSnap.id });
      });
      
      return {
        attendance: attendanceData,
        records: records
      };
    }
  } catch (error) {
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
    
    let presentStudents: NursingStudent[] = [];
    let absentStudents: NursingStudent[] = [];
    let takenBy = '';
    let submittedAt: any;

    if (attendanceListDoc.exists()) {
      // Use finalized attendance data
      const attendanceList = attendanceListDoc.data() as AttendanceList;
      takenBy = attendanceList.takenBy;
      submittedAt = attendanceList.submittedAt;

      const attendanceMap: { [key: string]: boolean } = {};
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
      
      const attendanceMap: { [key: string]: boolean } = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as AttendanceRecord;
        attendanceMap[data.studentId] = data.present;
        if (!takenBy && data.markedBy) {
          takenBy = data.markedBy;
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
  } catch (error) {
    console.error('Error loading attendance view:', error);
    throw error;
  }
};

export const toggleAttendance = async (studentId: string, date: string, newStatus: boolean): Promise<void> => {
  try {
    const attendanceId = `${studentId}_${date}`;
    
    const attendanceData: AttendanceRecord = {
      studentId: studentId,
      date: date,
      present: newStatus,
      markedAt: serverTimestamp() as any,
      markedBy: 'instructor'
    };

    await setDoc(doc(firestore, 'attendance', attendanceId), attendanceData);
  } catch (error) {
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
        markedAt: serverTimestamp() as any,
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
      submittedAt: serverTimestamp() as any,
      totalStudents: students.length,
      presentCount: presentCount,
      absentCount: absentCount,
      attendanceRecords: attendanceRecords,
      isFinalized: true
    };

    await setDoc(doc(firestore, 'admin', `attendance_${formattedDate}`), attendanceList);
  } catch (error) {
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
    snapshot.forEach((doc) => {
      history.push({ ...doc.data() as AttendanceRecord, id: doc.id });
    });
    
    return history;
  } catch (error) {
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
      const data = docSnap.data();
      messages.push({
        id: docSnap.id,
        studentId: data.studentId,
        fromInstructor: data.fromInstructor,
        message: data.message,
        createdAt: data.createdAt,
        read: data.read,
        urgent: data.urgent
      });
    });
    
    return messages;
  } catch (error) {
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
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};