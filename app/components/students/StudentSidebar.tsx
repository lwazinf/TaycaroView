import React, { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes,
  faUser,
  faFileAlt,
  faComments,
  faChartLine,
  faCalendarCheck,
  faSpinner,
  faEye,
  faDownload,
  faAward,
  faClock,
  faCheckCircle,
  faTimesCircle,
  faEnvelope,
  faPaperPlane,
  faGraduationCap,
  faPhone,
  faCalendar,
  faEdit,
  faTrash,
  faStar as faStarSolid,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import { faTelegram } from '@fortawesome/free-brands-svg-icons';
import {
  selectedStudentForSidebarAtom,
  sidebarActiveTabAtom,
  studentMessagesAtom,
  studentDocumentsAtom,
  studentPerformanceAtom,
  studentAttendanceHistoryAtom,
  newStudentMessageAtom,
  StudentPerformance // Use the one from atoms
} from '../../store/studentsAtoms';
import { 
  loadStudentDocuments,
  loadStudentMessages,
  loadStudentAttendanceHistory,
  sendMessageToStudent
} from '../../services/studentsService';
import { 
  updateDocumentGrade,
  deleteDocument,
  toggleDocumentStar
} from '../../services/documentsService';
import { getStudentInitials, getAvatarColor, formatFileSize } from '../../utils/helpers';
import { 
  NURSING_LEVELS, 
  CATEGORIES, 
  StudentDocument // Use the one from types
} from '../../types';
import { Timestamp } from 'firebase/firestore';

// Define additional interfaces for proper typing
interface GradeEdit {
  grade: number;
  maxGrade: number;
  feedback: string;
}

const StudentSidebar: React.FC = () => {
  const [selectedStudent, setSelectedStudent] = useAtom(selectedStudentForSidebarAtom);
  const [activeTab, setActiveTab] = useAtom(sidebarActiveTabAtom);
  const [studentMessages, setStudentMessages] = useAtom(studentMessagesAtom);
  const [studentDocuments, setStudentDocuments] = useAtom(studentDocumentsAtom);
  const [studentPerformance, setStudentPerformance] = useAtom(studentPerformanceAtom);
  const [attendanceHistory, setAttendanceHistory] = useAtom(studentAttendanceHistoryAtom);
  const [newMessage, setNewMessage] = useAtom(newStudentMessageAtom);

  // Local state with proper typing
  const [loading, setLoading] = useState<boolean>(false);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [editingDocument, setEditingDocument] = useState<string | null>(null);
  const [editGrade, setEditGrade] = useState<GradeEdit>({ grade: 0, maxGrade: 100, feedback: '' });

  useEffect(() => {
    if (selectedStudent) {
      loadStudentData();
    }
  }, [selectedStudent]);

  const loadStudentData = async (): Promise<void> => {
    if (!selectedStudent) return;
    
    setLoading(true);
    try {
      // Load all student-related data
      const [documents, messages, attendance] = await Promise.all([
        loadStudentDocuments(selectedStudent.studentId),
        loadStudentMessages(selectedStudent.studentId),
        loadStudentAttendanceHistory(selectedStudent.studentId)
      ]);

      // Cast to proper types based on what the service actually returns
      setStudentDocuments(documents as StudentDocument[]);
      setStudentMessages(messages);
      setAttendanceHistory(attendance);

      // Calculate performance metrics with proper type checking
      const typedDocuments = documents as StudentDocument[];
      const gradedDocs = typedDocuments.filter((doc): doc is StudentDocument & { grade: number; maxGrade: number } => 
        doc.isGraded && typeof doc.grade === 'number' && typeof doc.maxGrade === 'number'
      );
      
      const totalPoints = gradedDocs.reduce((sum, doc) => sum + doc.grade, 0);
      const maxPoints = gradedDocs.reduce((sum, doc) => sum + doc.maxGrade, 0);
      const avgGrade = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;

      const presentDays = attendance.filter(record => record.present).length;
      const totalDays = attendance.length;
      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 100;

      // Get most recent activity
      const recentActivity = typedDocuments.length > 0 
        ? typedDocuments
            .sort((a, b) => b.uploadedAt.seconds - a.uploadedAt.seconds)
            .slice(0, 3)
            .map(doc => ({
              id: doc.id,
              type: 'assignment' as const,
              description: `Uploaded ${doc.name}`,
              date: doc.uploadedAt.toDate(),
              status: doc.isGraded ? 'completed' as const : 'pending' as const
            }))
        : [];

      setStudentPerformance({
        overallGrade: Math.round(avgGrade * 100) / 100,
        completedAssignments: gradedDocs.length,
        totalAssignments: typedDocuments.length,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        recentActivity: recentActivity
      });

    } catch (error: unknown) {
      console.error('Error loading student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const closeSidebar = (): void => {
    setSelectedStudent(null);
    setActiveTab('details');
    setEditingDocument(null);
    setNewMessage('');
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!selectedStudent || !newMessage.trim()) return;

    setSendingMessage(true);
    try {
      await sendMessageToStudent(selectedStudent.studentId, newMessage.trim());
      setNewMessage('');
      
      // Reload messages
      const messages = await loadStudentMessages(selectedStudent.studentId);
      setStudentMessages(messages);
      
      alert('Message sent successfully!');
    } catch (error: unknown) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateGrade = async (documentId: string): Promise<void> => {
    try {
      await updateDocumentGrade(documentId, editGrade.grade, editGrade.maxGrade, editGrade.feedback);
      setEditingDocument(null);
      setEditGrade({ grade: 0, maxGrade: 100, feedback: '' });
      await loadStudentData(); // Reload to update performance
    } catch (error: unknown) {
      console.error('Error updating grade:', error);
      alert('Failed to update grade. Please try again.');
    }
  };

  const handleDeleteDocument = async (document: StudentDocument): Promise<void> => {
    if (!window.confirm(`Delete "${document.name}"?`)) return;
    
    try {
      await deleteDocument(document);
      await loadStudentData(); // Reload data
    } catch (error: unknown) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const handleToggleStar = async (document: StudentDocument): Promise<void> => {
    try {
      await toggleDocumentStar(document.id, document.isStarred || false);
      await loadStudentData(); // Reload data
    } catch (error: unknown) {
      console.error('Error toggling star:', error);
    }
  };

  const startGrading = (document: StudentDocument): void => {
    setEditingDocument(document.id);
    setEditGrade({
      grade: document.grade || 0,
      maxGrade: document.maxGrade || 100,
      feedback: document.feedback || ''
    });
  };

  const cancelGrading = (): void => {
    setEditingDocument(null);
    setEditGrade({ grade: 0, maxGrade: 100, feedback: '' });
  };

  // Helper function to safely get date string from Timestamp
  const getDateString = (timestamp: Timestamp | undefined): string => {
    if (!timestamp) return 'Unknown date';
    try {
      return timestamp.toDate().toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  if (!selectedStudent) return null;

  const nursingLevel = NURSING_LEVELS.find(l => l.value === selectedStudent.nursingLevel);

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center shadow-lg ${getAvatarColor(selectedStudent.name)}`}>
            <span className="text-white font-bold text-sm">
              {getStudentInitials(selectedStudent.name)}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{selectedStudent.name}</h3>
            <p className="text-sm text-gray-500">{selectedStudent.studentId}</p>
          </div>
        </div>
        <button
          onClick={closeSidebar}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        {[
          { id: 'details', label: 'Details', icon: faUser },
          { id: 'files', label: 'Files', icon: faFileAlt },
          { id: 'messages', label: 'Messages', icon: faComments },
          { id: 'performance', label: 'Performance', icon: faChartLine }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FontAwesomeIcon icon={tab.icon} className="mr-2 text-xs" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Loading...</span>
          </div>
        ) : (
          <>
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Student Information</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Student ID:</span>
                      <span className="font-medium">{selectedStudent.studentId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span className="font-medium">{selectedStudent.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Level:</span>
                      <span className="font-medium">{nursingLevel?.label || selectedStudent.nursingLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Academic Year:</span>
                      <span className="font-medium">{selectedStudent.academicYear}</span>
                    </div>
                    {selectedStudent.clinicalRotation && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Clinical Rotation:</span>
                        <span className="font-medium">{selectedStudent.clinicalRotation}</span>
                      </div>
                    )}
                    {selectedStudent.phoneNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phone:</span>
                        <span className="font-medium">{selectedStudent.phoneNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Telegram:</span>
                      <span className={`font-medium flex items-center ${selectedStudent.telegramId ? 'text-green-600' : 'text-gray-400'}`}>
                        <FontAwesomeIcon icon={faTelegram} className="mr-1" />
                        {selectedStudent.telegramId ? 'Connected' : 'Not connected'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Enrolled:</span>
                      <span className="font-medium">{getDateString(selectedStudent.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Overview</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-blue-600">{studentDocuments.length}</div>
                      <div className="text-xs text-blue-600">Documents</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-green-600">
                        {studentPerformance?.attendanceRate?.toFixed(0) || 0}%
                      </div>
                      <div className="text-xs text-green-600">Attendance</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {studentPerformance?.overallGrade?.toFixed(0) || 0}%
                      </div>
                      <div className="text-xs text-purple-600">Average Grade</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-orange-600">{studentMessages.length}</div>
                      <div className="text-xs text-orange-600">Messages</div>
                    </div>
                  </div>
                </div>

                {/* Recent Attendance */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Attendance</h4>
                  <div className="space-y-2">
                    {attendanceHistory.slice(0, 5).map((record, index) => (
                      <div key={`${record.studentId}-${record.date}-${index}`} className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{record.date}</span>
                        <span className={`flex items-center font-medium ${
                          record.present ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <FontAwesomeIcon 
                            icon={record.present ? faCheckCircle : faTimesCircle} 
                            className="mr-1 text-xs" 
                          />
                          {record.present ? 'Present' : 'Absent'}
                        </span>
                      </div>
                    ))}
                    {attendanceHistory.length === 0 && (
                      <p className="text-gray-500 text-sm italic">No attendance records found</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Files Tab */}
            {activeTab === 'files' && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    Student Documents ({studentDocuments.length})
                  </h4>
                  {studentDocuments.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {studentDocuments.filter(d => d.isGraded).length} graded
                    </span>
                  )}
                </div>

                {studentDocuments.length === 0 ? (
                  <div className="text-center py-8">
                    <FontAwesomeIcon icon={faFileAlt} className="text-gray-400 text-2xl mb-2" />
                    <p className="text-gray-500 text-sm">No documents uploaded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {studentDocuments
                      .sort((a, b) => b.uploadedAt.seconds - a.uploadedAt.seconds)
                      .map((document) => (
                        <div key={document.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h5 className="font-medium text-gray-900 text-sm truncate hover:text-blue-600 cursor-pointer"
                                    onClick={() => window.open(document.url, '_blank')}>
                                  {document.name}
                                </h5>
                                {document.isStarred && (
                                  <FontAwesomeIcon icon={faStarSolid} className="text-yellow-500 text-xs" />
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-3 text-xs text-gray-500 mb-2">
                                <span className="px-2 py-1 bg-white rounded-full">
                                  {CATEGORIES.find(c => c.value === document.category)?.label || document.category}
                                </span>
                                <span>{formatFileSize(document.size)}</span>
                                <span>{getDateString(document.uploadedAt)}</span>
                              </div>

                              {/* Grade Display */}
                              {document.isGraded && typeof document.grade === 'number' && typeof document.maxGrade === 'number' ? (
                                <div className="mb-2">
                                  <div className="flex items-center space-x-2">
                                    <FontAwesomeIcon icon={faAward} className="text-green-500 text-xs" />
                                    <span className="text-sm font-medium text-green-700">
                                      {document.grade}/{document.maxGrade} 
                                      ({((document.grade / document.maxGrade) * 100).toFixed(1)}%)
                                    </span>
                                  </div>
                                  {document.feedback && (
                                    <p className="text-xs text-gray-600 mt-1 p-2 bg-white rounded border-l-2 border-blue-400">
                                      {document.feedback}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="mb-2">
                                  <span className="text-xs text-gray-500 italic">Not graded yet</span>
                                </div>
                              )}

                              {/* Grading Form */}
                              {editingDocument === document.id && (
                                <div className="mt-3 p-3 bg-white rounded border">
                                  <div className="grid grid-cols-2 gap-2 mb-2">
                                    <input
                                      type="number"
                                      value={editGrade.grade}
                                      onChange={(e) => setEditGrade(prev => ({...prev, grade: Number(e.target.value)}))}
                                      className="px-2 py-1 border rounded text-sm"
                                      placeholder="Grade"
                                      min="0"
                                    />
                                    <input
                                      type="number"
                                      value={editGrade.maxGrade}
                                      onChange={(e) => setEditGrade(prev => ({...prev, maxGrade: Number(e.target.value)}))}
                                      className="px-2 py-1 border rounded text-sm"
                                      placeholder="Total"
                                      min="1"
                                    />
                                  </div>
                                  <textarea
                                    value={editGrade.feedback}
                                    onChange={(e) => setEditGrade(prev => ({...prev, feedback: e.target.value}))}
                                    className="w-full px-2 py-1 border rounded text-sm"
                                    rows={2}
                                    placeholder="Feedback (optional)"
                                  />
                                  <div className="flex space-x-2 mt-2">
                                    <button
                                      onClick={() => handleUpdateGrade(document.id)}
                                      className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={cancelGrading}
                                      className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col space-y-1 ml-2">
                              <button
                                onClick={() => window.open(document.url, '_blank')}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="View"
                              >
                                <FontAwesomeIcon icon={faEye} className="text-xs" />
                              </button>
                              
                              <button
                                onClick={() => handleToggleStar(document)}
                                className={`p-1 hover:bg-yellow-50 rounded ${
                                  document.isStarred ? 'text-yellow-500' : 'text-gray-400'
                                }`}
                                title={document.isStarred ? 'Remove Star' : 'Add Star'}
                              >
                                <FontAwesomeIcon 
                                  icon={document.isStarred ? faStarSolid : faStarRegular} 
                                  className="text-xs" 
                                />
                              </button>
                              
                              <button
                                onClick={() => startGrading(document)}
                                disabled={editingDocument === document.id}
                                className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                                title="Grade"
                              >
                                <FontAwesomeIcon icon={faEdit} className="text-xs" />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteDocument(document)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <FontAwesomeIcon icon={faTrash} className="text-xs" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div className="p-6 space-y-4">
                {/* Send New Message */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Send Message</h4>
                  <div className="space-y-3">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      rows={3}
                      placeholder="Type your message to the student..."
                      disabled={sendingMessage}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm"
                    >
                      {sendingMessage ? (
                        <>
                          <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2 text-xs" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faPaperPlane} className="mr-2 text-xs" />
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Message History */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Message History ({studentMessages.length})
                  </h4>
                  
                  {studentMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <FontAwesomeIcon icon={faComments} className="text-gray-400 text-2xl mb-2" />
                      <p className="text-gray-500 text-sm">No messages yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {studentMessages
                        .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)
                        .map((message) => (
                          <div key={message.id} className={`p-3 rounded-lg ${
                            message.fromInstructor ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-green-50 border-l-4 border-green-400'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-700">
                                {message.fromInstructor ? 'You' : selectedStudent.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {getDateString(message.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800">{message.message}</p>
                            {message.urgent && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
                                Urgent
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="p-6 space-y-6">
                {/* Grade Overview */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Academic Performance</h4>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {studentPerformance?.overallGrade?.toFixed(1) || 0}%
                        </div>
                        <div className="text-xs text-blue-600">Overall Grade</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {studentPerformance?.completedAssignments || 0}/{studentPerformance?.totalAssignments || 0}
                        </div>
                        <div className="text-xs text-purple-600">Assignments</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attendance Performance */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Attendance Record</h4>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-900">Attendance Rate</span>
                      <span className="text-lg font-bold text-green-600">
                        {studentPerformance?.attendanceRate?.toFixed(1) || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${studentPerformance?.attendanceRate || 0}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-green-700 mt-2">
                      {attendanceHistory.filter(r => r.present).length} present out of {attendanceHistory.length} days
                    </div>
                  </div>
                </div>

                {/* Document Categories Performance */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Performance by Category</h4>
                  <div className="space-y-3">
                    {CATEGORIES.map(category => {
                      const categoryDocs = studentDocuments.filter(d => d.category === category.value);
                      const gradedDocs = categoryDocs.filter((d): d is StudentDocument & { grade: number; maxGrade: number } => 
                        d.isGraded && typeof d.grade === 'number' && typeof d.maxGrade === 'number'
                      );
                      
                      if (categoryDocs.length === 0) return null;
                      
                      const avgGrade = gradedDocs.length > 0 
                        ? gradedDocs.reduce((sum, doc) => sum + ((doc.grade / doc.maxGrade) * 100), 0) / gradedDocs.length
                        : 0;

                      return (
                        <div key={category.value} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">{category.label}</span>
                            <div className="text-xs text-gray-500">
                              {gradedDocs.length}/{categoryDocs.length} graded
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex-1 mr-3">
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${avgGrade}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {avgGrade.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h4>
                  <div className="space-y-2">
                    {studentPerformance?.recentActivity && studentPerformance.recentActivity.length > 0 ? (
                      studentPerformance.recentActivity.map((activity, index) => (
                        <div key={`${activity.id}-${index}`} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 truncate flex-1 mr-2">{activity.description}</span>
                          <span className="text-xs text-gray-500">
                            {activity.date.toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm italic">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StudentSidebar;