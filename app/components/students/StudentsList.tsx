import React, { SetStateAction, useEffect } from 'react';
import { useAtom } from 'jotai';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserGraduate, 
  faSpinner, 
  faCheck, 
  faTimes, 
  faChevronRight,
  faFileAlt,
  faAward,
  faUserCheck,
  faCheckCircle,
  faTimesCircle,
  faFilter,
  faCalendarCheck,
  faEye,
  faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import { 
  studentsAtom, 
  showAttendanceModeAtom,
  todaysAttendanceAtom,
  attendanceLoadingAtom,
  selectedAttendanceDateAtom,
  selectedStudentForSidebarAtom,
  attendanceChangedAtom,
  showAttendanceViewerAtom,
  attendanceViewDataAtom,
  attendanceViewLoadingAtom
} from '../../store/studentsAtoms';
import { loadingAtom, searchTermAtom } from '../../store/atoms';
import { 
  loadTodaysAttendance, 
  toggleAttendance,
  loadAttendanceViewData
} from '../../services/studentsService';
import { getStudentInitials, getAvatarColor } from '../../utils/helpers';
import { NURSING_LEVELS, NursingStudent } from '../../types';
import { faTelegram } from '@fortawesome/free-brands-svg-icons';

const StudentsList: React.FC = () => {
  const [students] = useAtom(studentsAtom);
  const [searchTerm] = useAtom(searchTermAtom);
  const [loading] = useAtom(loadingAtom);
  const [showAttendanceMode] = useAtom(showAttendanceModeAtom);
  const [todaysAttendance, setTodaysAttendance] = useAtom(todaysAttendanceAtom);
  const [attendanceLoading, setAttendanceLoading] = useAtom(attendanceLoadingAtom);
  const [selectedAttendanceDate] = useAtom(selectedAttendanceDateAtom);
  const [, setSelectedStudentForSidebar] = useAtom(selectedStudentForSidebarAtom);
  const [, setAttendanceChanged] = useAtom(attendanceChangedAtom);
  const [showAttendanceViewer, setShowAttendanceViewer] = useAtom(showAttendanceViewerAtom);
  const [attendanceViewData, setAttendanceViewData] = useAtom(attendanceViewDataAtom);
  const [attendanceViewLoading, setAttendanceViewLoading] = useAtom(attendanceViewLoadingAtom);

  useEffect(() => {
    if (selectedAttendanceDate) {
      loadAttendanceForDate();
    }
  }, [selectedAttendanceDate]);

  const loadAttendanceForDate = async () => {
    try {
      setAttendanceLoading(true);
      const { attendance } = await loadTodaysAttendance(selectedAttendanceDate);
      setTodaysAttendance(attendance);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleToggleAttendance = async (studentId: string, currentStatus?: boolean) => {
    const newStatus = currentStatus !== undefined ? !currentStatus : !todaysAttendance[studentId];
    
    try {
      await toggleAttendance(studentId, selectedAttendanceDate, newStatus);
      
      setTodaysAttendance(prev => ({
        ...prev,
        [studentId]: newStatus
      }));
      
      setAttendanceChanged(true);
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  };

  const handleViewAttendance = async () => {
    try {
      setAttendanceViewLoading(true);
      setShowAttendanceViewer(true);
      
      // Pass both date and students to the function
      const viewData = await loadAttendanceViewData(selectedAttendanceDate, students);
      setAttendanceViewData(viewData);
    } catch (error) {
      console.error('Error loading attendance view:', error);
      setShowAttendanceViewer(false);
    } finally {
      setAttendanceViewLoading(false);
    }
  };

  const loadStudentDetails = (student: SetStateAction<NursingStudent | null>) => {
    if (!showAttendanceMode) {
      setSelectedStudentForSidebar(student);
    }
  };

  // Filter students based on attendance view mode
  const getFilteredStudents = () => {
    const filteredBySearch = students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.nursingLevel.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // If we're viewing attendance for a specific date, filter by enrolled students and attendance status
    if (showAttendanceViewer && attendanceViewData) {
      const selectedDate = new Date(selectedAttendanceDate);
      
      // Only show students who were enrolled on or before the selected date
      const enrolledStudents = filteredBySearch.filter(student => {
        const enrollmentDate = student.createdAt.toDate();
        return enrollmentDate <= selectedDate;
      });

      // Further filter based on attendance data
      return enrolledStudents.filter(student => {
        const hasAttendanceRecord = attendanceViewData.presentStudents.some(s => s.studentId === student.studentId) ||
                                   attendanceViewData.absentStudents.some(s => s.studentId === student.studentId);
        return hasAttendanceRecord;
      });
    }

    return filteredBySearch;
  };

  const filteredStudents = getFilteredStudents();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-600 mr-2" />
        <span className="text-gray-600">Loading students...</span>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-sm font-medium text-gray-900">
              {showAttendanceViewer ? (
                <>
                  <FontAwesomeIcon icon={faCalendarCheck} className="mr-2 text-blue-600" />
                  Attendance for {new Date(selectedAttendanceDate).toLocaleDateString()} ({filteredStudents.length})
                </>
              ) : (
                <>
                  
                  Students ({filteredStudents.length})
                  {showAttendanceMode && (
                    <span className="ml-2 text-xs text-blue-600 font-medium">
                      - Taking Attendance for {new Date(selectedAttendanceDate).toLocaleDateString()}
                    </span>
                  )}
                </>
              )}
            </h3>

            {/* Attendance View Toggle */}
            {!showAttendanceMode && (
              <button
                onClick={showAttendanceViewer ? () => {
                  setShowAttendanceViewer(false);
                  setAttendanceViewData(null);
                } : handleViewAttendance}
                disabled={attendanceViewLoading}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
                  showAttendanceViewer
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                <FontAwesomeIcon 
                  icon={attendanceViewLoading ? faSpinner : (showAttendanceViewer ? faEyeSlash : faEye)} 
                  className={`mr-1 ${attendanceViewLoading ? 'animate-spin' : ''}`} 
                />
                {attendanceViewLoading ? 'Loading...' : (showAttendanceViewer ? 'Show All Students' : 'View Attendance')}
              </button>
            )}
          </div>

          <div className="text-xs text-gray-500">
            {showAttendanceViewer ? (
              `Showing students with attendance records for ${new Date(selectedAttendanceDate).toLocaleDateString()}`
            ) : showAttendanceMode ? (
              'Click attendance icons to toggle'
            ) : (
              'Click on a student to view details'
            )}
          </div>
        </div>

        {/* Attendance Summary */}
        {showAttendanceViewer && attendanceViewData && (
          <div className="mt-3 flex items-center space-x-6 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Present: {attendanceViewData.presentCount}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Absent: {attendanceViewData.absentCount}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600">
                Rate: {attendanceViewData.totalEnrolled > 0 
                  ? Math.round((attendanceViewData.presentCount / attendanceViewData.totalEnrolled) * 100)
                  : 0}%
              </span>
            </div>
            {attendanceViewData.takenBy && (
              <div className="flex items-center">
                <span className="text-gray-600">
                  Taken by: {attendanceViewData.takenBy}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Students List */}
      {(attendanceLoading || attendanceViewLoading) ? (
        <div className="flex items-center justify-center py-8">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">
            {attendanceViewLoading ? 'Loading attendance data...' : 'Loading attendance...'}
          </span>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {filteredStudents.map((student) => {
            const isPresent = todaysAttendance[student.studentId];
            const hasAttendanceRecord = showAttendanceViewer && attendanceViewData && 
              (attendanceViewData.presentStudents.some(s => s.studentId === student.studentId) ||
               attendanceViewData.absentStudents.some(s => s.studentId === student.studentId));
            
            // Determine attendance status when viewing attendance
            const attendanceStatus = showAttendanceViewer && attendanceViewData 
              ? attendanceViewData.presentStudents.some(s => s.studentId === student.studentId) 
                ? 'present' 
                : 'absent'
              : null;
            
            return (
              <div 
                key={student.id} 
                className={`p-4 transition-all duration-200 ${
                  showAttendanceMode 
                    ? 'hover:bg-blue-50' 
                    : 'hover:bg-gray-50 cursor-pointer hover:shadow-sm'
                } ${
                  showAttendanceViewer && attendanceStatus === 'present' ? 'bg-green-50 border-l-4 border-green-500' :
                  showAttendanceViewer && attendanceStatus === 'absent' ? 'bg-red-50 border-l-4 border-red-500' : ''
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
                          handleToggleAttendance(student.studentId, isPresent);
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
                        
                        {/* Telegram Badge */}
                        {student.telegramId && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FontAwesomeIcon icon={faTelegram} className="mr-1" />
                            Connected
                          </span>
                        )}
                        
                        {/* Attendance Status Badges */}
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

                        {showAttendanceViewer && attendanceStatus && (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm border ${
                            attendanceStatus === 'present'
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`}>
                            <FontAwesomeIcon icon={attendanceStatus === 'present' ? faCheckCircle : faTimesCircle} className="mr-1" />
                            {attendanceStatus === 'present' ? 'Present' : 'Absent'}
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
                        {showAttendanceViewer && (
                          <span className="flex items-center">
                            <FontAwesomeIcon icon={faCalendarCheck} className="mr-1" />
                            {new Date(selectedAttendanceDate).toLocaleDateString()}
                          </span>
                        )}
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
              <FontAwesomeIcon icon={showAttendanceViewer ? faCalendarCheck : faUserGraduate} className="mx-auto text-gray-400 mb-4 text-4xl" />
              <h3 className="text-sm font-medium text-gray-900">
                {showAttendanceViewer 
                  ? 'No attendance records found'
                  : 'No students found'
                }
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {showAttendanceViewer 
                  ? `No attendance was taken for ${new Date(selectedAttendanceDate).toLocaleDateString()}`
                  : 'Add the first nursing student to get started.'
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentsList;