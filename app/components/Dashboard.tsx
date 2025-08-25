'use client'

import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faGraduationCap, 
  faUpload,
  faFileAlt,
  faUserGraduate,
  faStar,
  faUser,
  faTimes,
  faPlus,
  faBullhorn,
  faSearch,
  faFilter,
  faChevronDown,
  faEllipsisVertical,
  faSpinner,
  faShieldAlt,
  faEdit,
  faTrash,
  faSave,
  faCalendar,
  faSort,
  faEye,
  faPaperPlane,
  faBell,
  faExclamationTriangle,
  faCheck,
  faUsers,
  faCheckSquare,
  faSquare,
  faBookOpen,
  faDownload,
  faTags,
  faChartLine,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faIdCard,
  faAward,
  faClipboardList,
  faComments,
  faChevronRight,
  faChevronLeft,
  faUserCheck,
  faUserTimes,
  faGraduationCap as faGradCap,
  faClock,
  faCheckCircle,
  faTimesCircle,
  faInfoCircle,
  faHistory,
  faCalendarCheck
} from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { 
  getFirestore, 
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
  Timestamp,
  onSnapshot,
  limit,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { faTelegram } from '@fortawesome/free-brands-svg-icons';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC60mARhkNcWib6F7O5aUMxMfQh8a-yxmc",
  authDomain: "sasinelwa-76ed4.firebaseapp.com",
  projectId: "sasinelwa-76ed4",
  storageBucket: "sasinelwa-76ed4.firebasestorage.app",
  messagingSenderId: "502211323750",
  appId: "1:502211323750:web:bf7b5433bf52d1eff08aa7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const firestore = getFirestore(app);

// Types
interface NursingStudent {
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

interface AttendanceRecord {
  id?: string;
  studentId: string;
  date: string;
  present: boolean;
  markedAt: Timestamp;
  markedBy: string;
}

interface AttendanceList {
  id: string;
  date: string; // dd-mm-yyyy format
  takenBy: string;
  submittedAt: Timestamp;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  attendanceRecords: AttendanceRecord[];
  isFinalized: boolean;
}

interface DailyAttendance {
  [studentId: string]: boolean;
}

interface AttendanceView {
  date: string;
  presentStudents: NursingStudent[];
  absentStudents: NursingStudent[];
  totalEnrolled: number;
  presentCount: number;
  absentCount: number;
  takenBy?: string;
  submittedAt?: Timestamp;
}

const NURSING_LEVELS = [
  { value: 'first-year', label: 'First Year' },
  { value: 'second-year', label: 'Second Year' },
  { value: 'third-year', label: 'Third Year' },
  { value: 'fourth-year', label: 'Fourth Year' },
  { value: 'postgraduate', label: 'Postgraduate' }
];

const STUDENT_SIDEBAR_TABS = [
  { id: 'details', label: 'Details', icon: faUser },
  { id: 'files', label: 'Files', icon: faFileAlt },
  { id: 'messages', label: 'Messages', icon: faComments },
  { id: 'performance', label: 'Performance', icon: faChartLine },
  { id: 'attendance', label: 'Attendance', icon: faUserCheck }
];

const NursingStudentManagement: React.FC = () => {
  // All existing state variables
  const [students, setStudents] = useState<NursingStudent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeView, setActiveView] = useState<string>('students');
  const [error, setError] = useState<string | null>(null);
  
  // Attendance state
  const [showAttendanceMode, setShowAttendanceMode] = useState<boolean>(false);
  const [todaysAttendance, setTodaysAttendance] = useState<DailyAttendance>({});
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceLoading, setAttendanceLoading] = useState<boolean>(false);
  const [attendanceChanged, setAttendanceChanged] = useState<boolean>(false);
  const [showAttendanceSubmitDialog, setShowAttendanceSubmitDialog] = useState<boolean>(false);
  
  // New state for viewing attendance
  const [showAttendanceViewer, setShowAttendanceViewer] = useState<boolean>(false);
  const [attendanceViewData, setAttendanceViewData] = useState<AttendanceView | null>(null);
  const [attendanceViewLoading, setAttendanceViewLoading] = useState<boolean>(false);
  
  // Student sidebar state
  const [selectedStudentForSidebar, setSelectedStudentForSidebar] = useState<NursingStudent | null>(null);
  const [sidebarActiveTab, setSidebarActiveTab] = useState<string>('details');
  const [studentAttendanceHistory, setStudentAttendanceHistory] = useState<AttendanceRecord[]>([]);

  // Modal states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<string>('');

  // Format date as dd-mm-yyyy
  const formatDateForId = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Load attendance view data
  const loadAttendanceViewData = async (date: string) => {
    setAttendanceViewLoading(true);
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
          // If no record exists, we don't include them in either list
        });
      }

      // Sort students by name
      presentStudents.sort((a, b) => a.name.localeCompare(b.name));
      absentStudents.sort((a, b) => a.name.localeCompare(b.name));

      const viewData: AttendanceView = {
        date: formattedDate,
        presentStudents,
        absentStudents,
        totalEnrolled: enrolledStudents.length,
        presentCount: presentStudents.length,
        absentCount: absentStudents.length,
        takenBy,
        submittedAt
      };

      setAttendanceViewData(viewData);
      setShowAttendanceViewer(true);

    } catch (err) {
      console.error('Error loading attendance view:', err);
      setError('Failed to load attendance data');
    } finally {
      setAttendanceViewLoading(false);
    }
  };

  // Load students (keeping existing implementation)
  const loadStudents = async () => {
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
      
      setStudents(studentsWithCounts);
      await updateAttendanceRates(studentsWithCounts);
      
    } catch (err) {
      console.error('Error loading students:', err);
      setError('Failed to load students');
    }
  };

  // Load today's attendance (keeping existing implementation)
  const loadTodaysAttendance = async (date: string = getTodayDateString()) => {
    try {
      setAttendanceLoading(true);
      const formattedDate = formatDateForId(date);
      
      const attendanceListDoc = await getDoc(doc(firestore, 'admin', `attendance_${formattedDate}`));
      
      if (attendanceListDoc.exists() && attendanceListDoc.data().isFinalized) {
        const attendanceList = attendanceListDoc.data() as AttendanceList;
        const attendanceData: DailyAttendance = {};
        
        attendanceList.attendanceRecords.forEach(record => {
          attendanceData[record.studentId] = record.present;
        });
        
        setTodaysAttendance(attendanceData);
        setAttendanceHistory(attendanceList.attendanceRecords);
        setAttendanceChanged(false);
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
        
        setTodaysAttendance(attendanceData);
        setAttendanceHistory(records);
        setAttendanceChanged(Object.keys(attendanceData).length > 0);
      }
      
    } catch (err) {
      console.error('Error loading attendance:', err);
      setError('Failed to load attendance data');
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Toggle student attendance (keeping existing implementation)
  const toggleAttendance = async (studentId: string, currentStatus?: boolean) => {
    const newStatus = currentStatus !== undefined ? !currentStatus : !todaysAttendance[studentId];
    const attendanceId = `${studentId}_${selectedAttendanceDate}`;
    
    try {
      const attendanceData: AttendanceRecord = {
        studentId: studentId,
        date: selectedAttendanceDate,
        present: newStatus,
        markedAt: serverTimestamp() as Timestamp,
        markedBy: 'instructor'
      };

      await setDoc(doc(firestore, 'attendance', attendanceId), attendanceData);
      
      setTodaysAttendance(prev => ({
        ...prev,
        [studentId]: newStatus
      }));
      
      setAttendanceChanged(true);
      await updateAttendanceRates(students);
      
    } catch (err) {
      console.error('Error updating attendance:', err);
      setError('Failed to update attendance');
    }
  };

  // Submit attendance list (keeping existing implementation)
  const submitAttendanceList = async () => {
    try {
      const formattedDate = formatDateForId(selectedAttendanceDate);
      const attendanceRecords: AttendanceRecord[] = [];
      
      let presentCount = 0;
      let absentCount = 0;
      
      students.forEach(student => {
        const isPresent = todaysAttendance[student.studentId] || false;
        attendanceRecords.push({
          studentId: student.studentId,
          date: selectedAttendanceDate,
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
      
      setShowAttendanceSubmitDialog(false);
      setShowAttendanceMode(false);
      setAttendanceChanged(false);
      
      alert(`Attendance list for ${formattedDate} has been finalized and saved!`);
      
    } catch (err) {
      console.error('Error submitting attendance list:', err);
      setError('Failed to submit attendance list');
    }
  };

  // Exit attendance mode with confirmation
  const exitAttendanceMode = () => {
    if (attendanceChanged) {
      setShowAttendanceSubmitDialog(true);
    } else {
      setShowAttendanceMode(false);
    }
  };

  // Update attendance rates (keeping existing implementation)
  const updateAttendanceRates = async (studentsList: NursingStudent[]) => {
    try {
      const updatedStudents = await Promise.all(
        studentsList.map(async (student) => {
          const q = query(
            collection(firestore, 'attendance'),
            where('studentId', '==', student.studentId)
          );
          const snapshot = await getDocs(q);
          
          let totalDays = 0;
          let presentDays = 0;
          
          snapshot.forEach((doc) => {
            const data = doc.data() as AttendanceRecord;
            totalDays++;
            if (data.present) presentDays++;
          });
          
          const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
          
          if (student.attendanceRate !== attendanceRate) {
            await updateDoc(doc(firestore, 'nursingStudents', student.id), {
              attendanceRate: attendanceRate
            });
          }
          
          return {
            ...student,
            attendanceRate: attendanceRate
          };
        })
      );
      
      setStudents(updatedStudents);
    } catch (err) {
      console.error('Error updating attendance rates:', err);
    }
  };

  // Load student details for sidebar (keeping existing implementation)
  const loadStudentDetails = async (student: NursingStudent) => {
    setSelectedStudentForSidebar(student);
    await loadStudentAttendanceHistory(student.studentId);
  };

  // Load student attendance history (keeping existing implementation)
  const loadStudentAttendanceHistory = async (studentId: string) => {
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
      
      setStudentAttendanceHistory(history);
    } catch (err) {
      console.error('Error loading student attendance:', err);
    }
  };

  // Generate student initials and colors
  const getStudentInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().substring(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-gradient-to-br from-blue-400 to-blue-600', 
      'bg-gradient-to-br from-green-400 to-green-600', 
      'bg-gradient-to-br from-purple-400 to-purple-600', 
      'bg-gradient-to-br from-pink-400 to-pink-600', 
      'bg-gradient-to-br from-indigo-400 to-indigo-600', 
      'bg-gradient-to-br from-red-400 to-red-600', 
      'bg-gradient-to-br from-yellow-400 to-yellow-600', 
      'bg-gradient-to-br from-teal-400 to-teal-600'
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  const closeStudentSidebar = () => {
    setSelectedStudentForSidebar(null);
    setSidebarActiveTab('details');
    setStudentAttendanceHistory([]);
  };

  // Load initial data
  useEffect(() => {
    loadStudents().finally(() => setLoading(false));
  }, []);

  // Load attendance when date changes
  useEffect(() => {
    loadTodaysAttendance(selectedAttendanceDate);
  }, [selectedAttendanceDate]);

  // Close sidebar when not on students page
  useEffect(() => {
    if (activeView !== 'students') {
      closeStudentSidebar();
    }
  }, [activeView]);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.nursingLevel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-600 text-4xl mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      {/* Main Sidebar - keeping existing implementation */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faGraduationCap} className="text-white text-sm" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">TaycaroView</div>
              <div className="text-xs text-gray-500">Instructor Portal</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2 mb-3">
            Main
          </div>
          
          <button
            onClick={() => setActiveView('students')}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeView === 'students'
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <FontAwesomeIcon icon={faUserGraduate} className="mr-3 text-sm" />
            Students
            <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
              {students.length}
            </span>
          </button>

          {/* Other navigation items remain the same */}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">I</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">Instructor</div>
              <div className="text-xs text-gray-500 truncate">instructor@nursing.edu</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
        selectedStudentForSidebar && activeView === 'students' ? 'mr-96' : ''
      }`}>
        
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-lg font-semibold text-gray-900">Students</span>
              
              {activeView === 'students' && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => showAttendanceMode ? exitAttendanceMode() : setShowAttendanceMode(true)}
                    className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-lg transition-colors ${
                      showAttendanceMode
                        ? 'border-red-600 text-red-600 bg-red-50 hover:bg-red-100'
                        : 'border-green-600 text-green-600 bg-green-50 hover:bg-green-100'
                    }`}
                  >
                    <FontAwesomeIcon icon={showAttendanceMode ? faTimes : faUserCheck} className="mr-2 text-xs" />
                    {showAttendanceMode ? 'Exit Attendance' : 'Take Attendance'}
                    {attendanceChanged && showAttendanceMode && (
                      <span className="ml-2 w-2 h-2 bg-orange-500 rounded-full"></span>
                    )}
                  </button>

                  <button
                    onClick={() => loadAttendanceViewData(selectedAttendanceDate)}
                    disabled={attendanceViewLoading}
                    className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 bg-blue-50 hover:bg-blue-100 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={attendanceViewLoading ? faSpinner : faHistory} className={`mr-2 text-xs ${attendanceViewLoading ? 'animate-spin' : ''}`} />
                    View Attendance
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {/* Attendance Date Picker */}
              {activeView === 'students' && (showAttendanceMode || attendanceViewLoading) && (
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Date:</label>
                  <input
                    type="date"
                    value={selectedAttendanceDate}
                    onChange={(e) => setSelectedAttendanceDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="relative">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="px-6 py-6">
            
            {/* Students View */}
            {activeView === 'students' && (
              <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">
                      Students ({filteredStudents.length})
                      {showAttendanceMode && (
                        <span className="ml-2 text-xs text-blue-600 font-medium">
                          - Taking Attendance for {new Date(selectedAttendanceDate).toLocaleDateString()}
                        </span>
                      )}
                    </h3>
                    <div className="text-xs text-gray-500">
                      {showAttendanceMode ? 'Click attendance icons to toggle' : 'Click on a student to view details'}
                    </div>
                  </div>
                </div>

                {attendanceLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-600 mr-2" />
                    <span className="text-gray-600">Loading attendance...</span>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredStudents.map((student) => {
                      const isPresent = todaysAttendance[student.studentId];
                      
                      return (
                        <div 
                          key={student.id} 
                          className={`p-4 transition-all duration-200 ${
                            showAttendanceMode 
                              ? 'hover:bg-blue-50' 
                              : 'hover:bg-gray-50 cursor-pointer hover:shadow-sm'
                          }`}
                          onClick={showAttendanceMode ? undefined : () => loadStudentDetails(student)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {/* Profile Picture or Attendance Toggle */}
                              {showAttendanceMode ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleAttendance(student.studentId, isPresent);
                                  }}
                                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
                                    isPresent
                                      ? 'bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white transform scale-105'
                                      : 'bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white'
                                  }`}
                                  title={isPresent ? 'Present - Click to mark absent' : 'Absent - Click to mark present'}
                                >
                                  <FontAwesomeIcon 
                                    icon={isPresent ? faCheck : faTimes} 
                                    className="text-lg"
                                  />
                                </button>
                              ) : (
                                <div className={`h-12 w-12 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-105 ${getAvatarColor(student.name)}`}>
                                  <span className="text-white font-bold text-sm">
                                    {getStudentInitials(student.name)}
                                  </span>
                                </div>
                              )}
                              
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="text-sm font-semibold text-gray-900">{student.name}</h4>
                                  {student.telegramId && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      <FontAwesomeIcon icon={faTelegram} className="mr-1" />
                                      Connected
                                    </span>
                                  )}
                                  {showAttendanceMode && (
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                                      isPresent
                                        ? 'bg-green-100 text-green-800 border border-green-200'
                                        : 'bg-red-100 text-red-800 border border-red-200'
                                    }`}>
                                      <FontAwesomeIcon icon={isPresent ? faCheckCircle : faTimesCircle} className="mr-1" />
                                      {isPresent ? 'Present' : 'Absent'}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="text-sm text-gray-500 mt-1">
                                  {student.studentId} • {NURSING_LEVELS.find(l => l.value === student.nursingLevel)?.label}
                                  {student.clinicalRotation && ` • ${student.clinicalRotation}`}
                                </div>
                                
                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                  <span className="flex items-center">
                                    <FontAwesomeIcon icon={faFileAlt} className="mr-1" />
                                    {student.documentCount || 0} docs
                                  </span>
                                  <span className="flex items-center">
                                    <FontAwesomeIcon icon={faAward} className="mr-1" />
                                    {student.overallGrade || 0}% avg
                                  </span>
                                  <span className="flex items-center">
                                    <FontAwesomeIcon icon={faUserCheck} className="mr-1" />
                                    {(student.attendanceRate || 0).toFixed(1)}% attendance
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {!showAttendanceMode && (
                              <div className="flex items-center">
                                <FontAwesomeIcon icon={faChevronRight} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {filteredStudents.length === 0 && (
                      <div className="text-center py-12">
                        <FontAwesomeIcon icon={faUserGraduate} className="mx-auto text-gray-400 mb-4 text-4xl" />
                        <h3 className="text-sm font-medium text-gray-900">No students found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Add the first nursing student to get started.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Student Details Sidebar - keeping existing implementation */}
      {selectedStudentForSidebar && activeView === 'students' && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-2xl z-30 transform transition-transform duration-300 ease-in-out">
          {/* Sidebar content remains the same as previous implementation */}
        </div>
      )}

      {/* Attendance Viewer Modal */}
      {showAttendanceViewer && attendanceViewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl max-h-[90vh] mx-4 w-full overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <FontAwesomeIcon icon={faCalendarCheck} className="mr-3 text-blue-600" />
                    Attendance Report
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Date: {new Date(selectedAttendanceDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setShowAttendanceViewer(false)}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-gray-500 text-lg" />
                </button>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{attendanceViewData.totalEnrolled}</div>
                  <div className="text-xs text-gray-600">Total Enrolled</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{attendanceViewData.presentCount}</div>
                  <div className="text-xs text-gray-600">Present</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{attendanceViewData.absentCount}</div>
                  <div className="text-xs text-gray-600">Absent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {attendanceViewData.totalEnrolled > 0 
                      ? Math.round((attendanceViewData.presentCount / attendanceViewData.totalEnrolled) * 100)
                      : 0}%
                  </div>
                  <div className="text-xs text-gray-600">Attendance Rate</div>
                </div>
              </div>

              {attendanceViewData.takenBy && (
                <div className="mt-3 flex items-center justify-center text-xs text-gray-500">
                  <FontAwesomeIcon icon={faUser} className="mr-1" />
                  Taken by: {attendanceViewData.takenBy}
                  {attendanceViewData.submittedAt && (
                    <>
                      <span className="mx-2">•</span>
                      <FontAwesomeIcon icon={faClock} className="mr-1" />
                      {attendanceViewData.submittedAt.toDate().toLocaleString()}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Present Students */}
                <div>
                  <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center">
                    <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                    Present Students ({attendanceViewData.presentCount})
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {attendanceViewData.presentStudents.length > 0 ? (
                      attendanceViewData.presentStudents.map((student) => (
                        <div key={student.id} className="flex items-center p-3 bg-green-50 rounded-lg border border-green-100">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center shadow-sm mr-3 ${getAvatarColor(student.name)}`}>
                            <span className="text-white font-bold text-sm">
                              {getStudentInitials(student.name)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{student.name}</p>
                            <p className="text-xs text-gray-500">
                              {student.studentId} • {NURSING_LEVELS.find(l => l.value === student.nursingLevel)?.label}
                            </p>
                          </div>
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <FontAwesomeIcon icon={faCheck} className="text-white text-sm" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FontAwesomeIcon icon={faUsers} className="text-gray-300 text-3xl mb-2" />
                        <p className="text-sm text-gray-500">No students marked present</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Absent Students */}
                <div>
                  <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center">
                    <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
                    Absent Students ({attendanceViewData.absentCount})
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {attendanceViewData.absentStudents.length > 0 ? (
                      attendanceViewData.absentStudents.map((student) => (
                        <div key={student.id} className="flex items-center p-3 bg-red-50 rounded-lg border border-red-100">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center shadow-sm mr-3 ${getAvatarColor(student.name)}`}>
                            <span className="text-white font-bold text-sm">
                              {getStudentInitials(student.name)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{student.name}</p>
                            <p className="text-xs text-gray-500">
                              {student.studentId} • {NURSING_LEVELS.find(l => l.value === student.nursingLevel)?.label}
                            </p>
                          </div>
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <FontAwesomeIcon icon={faTimes} className="text-white text-sm" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FontAwesomeIcon icon={faUsers} className="text-gray-300 text-3xl mb-2" />
                        <p className="text-sm text-gray-500">No students marked absent</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {attendanceViewData.totalEnrolled === 0 ? (
                    "No students were enrolled on this date"
                  ) : attendanceViewData.presentCount + attendanceViewData.absentCount === 0 ? (
                    "No attendance was taken for this date"
                  ) : (
                    `Showing ${attendanceViewData.presentCount + attendanceViewData.absentCount} of ${attendanceViewData.totalEnrolled} enrolled students`
                  )}
                </div>
                <button
                  onClick={() => setShowAttendanceViewer(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Submit Confirmation Dialog - keeping existing implementation */}
      {showAttendanceSubmitDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-orange-600 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Submit Attendance List</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                You are about to finalize the attendance list for <strong>{formatDateForId(selectedAttendanceDate)}</strong>.
              </p>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex justify-between mb-2">
                  <span>Total Students:</span>
                  <span className="font-semibold">{students.length}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Present:</span>
                  <span className="font-semibold text-green-600">
                    {Object.values(todaysAttendance).filter(Boolean).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Absent:</span>
                  <span className="font-semibold text-red-600">
                    {students.length - Object.values(todaysAttendance).filter(Boolean).length}
                  </span>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500 flex items-center">
                <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
                Once submitted, this attendance record will be saved permanently and cannot be modified.
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAttendanceSubmitDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitAttendanceList}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Submit & Finalize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg z-50 shadow-lg">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-3 text-red-500 hover:text-red-700"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NursingStudentManagement;