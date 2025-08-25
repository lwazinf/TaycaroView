import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faBullhorn, 
  faPaperPlane, 
  faSpinner,
  faExclamationTriangle,
  faUsers,
  faUserCheck,
  faInfoCircle,
  faSearch,
  faCheck,
  faEnvelope
} from '@fortawesome/free-solid-svg-icons';
import { showModalAtom, modalTypeAtom } from '../../store/atoms';
import { studentsAtom } from '../../store/studentsAtoms';
import {
  newAnnouncementAtom,
  selectedStudentsForMessageAtom,
  selectAllAtom,
  announcementsAtom,
  sendingAnnouncementAtom,
} from '../../store/announcementsAtoms';
import { sendAnnouncement, loadAnnouncements } from '../../services/announcementsService';
import { NURSING_LEVELS } from '../../types';
import { faTelegram } from '@fortawesome/free-brands-svg-icons';

const AnnouncementModals: React.FC = () => {
  const [showModal, setShowModal] = useAtom(showModalAtom);
  const [modalType, setModalType] = useAtom(modalTypeAtom);
  const [students] = useAtom(studentsAtom);
  const [newAnnouncement, setNewAnnouncement] = useAtom(newAnnouncementAtom);
  const [selectedStudentsForMessage, setSelectedStudentsForMessage] = useAtom(selectedStudentsForMessageAtom);
  const [selectAll, setSelectAll] = useAtom(selectAllAtom);
  const [, setAnnouncements] = useAtom(announcementsAtom);
  const [sendingAnnouncement, setSendingAnnouncement] = useAtom(sendingAnnouncementAtom);

  // Local state for student search
  const [studentSearch, setStudentSearch] = useState('');

  const closeModal = () => {
    if (sendingAnnouncement) return; // Prevent closing during send
    
    setShowModal(false);
    setModalType('');
    setNewAnnouncement({
      title: '',
      message: '',
      messageType: 'announcement',
      targetAudience: 'all',
      targetLevels: [],
      targetStudents: [],
      urgent: false,
      sendToTelegram: true
    });
    setSelectedStudentsForMessage([]);
    setSelectAll(false);
    setStudentSearch('');
  };

  const validateForm = () => {
    if (!newAnnouncement.title.trim()) return 'Title is required';
    if (!newAnnouncement.message.trim()) return 'Message is required';
    
    if (modalType === 'individual-message' && selectedStudentsForMessage.length === 0) {
      return 'Please select at least one student';
    }
    
    if (newAnnouncement.targetAudience === 'level' && newAnnouncement.targetLevels.length === 0) {
      return 'Please select at least one nursing level';
    }
    
    if (newAnnouncement.targetAudience === 'individual' && selectedStudentsForMessage.length === 0) {
      return 'Please select at least one student';
    }

    return null;
  };

  const handleSendMessage = async () => {
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    setSendingAnnouncement(true);
    
    try {
      let targetStudents = selectedStudentsForMessage;

      // Determine target students based on message type and audience
      if (modalType === 'announcement') {
        if (newAnnouncement.targetAudience === 'all') {
          targetStudents = students.map(s => s.studentId);
        } else if (newAnnouncement.targetAudience === 'level') {
          targetStudents = students
            .filter(s => newAnnouncement.targetLevels.includes(s.nursingLevel))
            .map(s => s.studentId);
        }
      }

      await sendAnnouncement({
        title: newAnnouncement.title.trim(),
        message: newAnnouncement.message.trim(),
        messageType: modalType === 'individual-message' ? 'individual' : newAnnouncement.messageType,
        targetAudience: modalType === 'individual-message' ? 'individual' : newAnnouncement.targetAudience,
        targetLevels: newAnnouncement.targetLevels,
        targetStudents: targetStudents,
        urgent: newAnnouncement.urgent,
        sendToTelegram: newAnnouncement.sendToTelegram
      });

      // Reload announcements
      const updatedAnnouncements = await loadAnnouncements();
      setAnnouncements(updatedAnnouncements);

      // Show success message
      alert(`${modalType === 'individual-message' ? 'Message' : 'Announcement'} sent successfully to ${targetStudents.length} student${targetStudents.length !== 1 ? 's' : ''}!`);
      
      closeModal();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingAnnouncement(false);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentsForMessage(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedStudentsForMessage([]);
    } else {
      const filteredStudents = getFilteredStudents();
      setSelectedStudentsForMessage(filteredStudents.map(s => s.studentId));
    }
    setSelectAll(!selectAll);
  };

  const getFilteredStudents = () => {
    return students.filter(student =>
      student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.studentId.toLowerCase().includes(studentSearch.toLowerCase())
    );
  };

  const getTargetStudentCount = () => {
    if (modalType === 'individual-message') {
      return selectedStudentsForMessage.length;
    }
    
    if (newAnnouncement.targetAudience === 'all') {
      return students.length;
    } else if (newAnnouncement.targetAudience === 'level') {
      return students.filter(s => newAnnouncement.targetLevels.includes(s.nursingLevel)).length;
    } else if (newAnnouncement.targetAudience === 'individual') {
      return selectedStudentsForMessage.length;
    }
    
    return 0;
  };

  if (!showModal || (modalType !== 'announcement' && modalType !== 'individual-message')) return null;

  const filteredStudents = getFilteredStudents();
  const targetCount = getTargetStudentCount();
  const isFormValid = validateForm() === null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="relative p-6 border w-[600px] max-w-[90vw] shadow-2xl rounded-xl bg-white mx-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <FontAwesomeIcon 
                icon={modalType === 'individual-message' ? faEnvelope : faBullhorn} 
                className={`mr-3 ${modalType === 'individual-message' ? 'text-blue-600' : 'text-purple-600'}`} 
              />
              {modalType === 'individual-message' ? 'Send Individual Message' : 'Create Announcement'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {modalType === 'individual-message' 
                ? 'Send a direct message to selected students'
                : 'Broadcast an announcement to your students'
              }
            </p>
          </div>
          <button 
            onClick={closeModal} 
            disabled={sendingAnnouncement}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faTimes} className="text-lg" />
          </button>
        </div>

        {/* Sending Progress */}
        {sendingAnnouncement && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-600 mr-3" />
              <div>
                <div className="text-sm font-medium text-blue-800">
                  Sending {modalType === 'individual-message' ? 'message' : 'announcement'}...
                </div>
                <div className="text-xs text-blue-600">
                  Please wait while we deliver to {targetCount} student{targetCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column - Message Content */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement(prev => ({...prev, title: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder={modalType === 'individual-message' ? 'Message subject...' : 'Announcement title...'}
                disabled={sendingAnnouncement}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={newAnnouncement.message}
                onChange={(e) => setNewAnnouncement(prev => ({...prev, message: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                rows={6}
                placeholder="Enter your message content..."
                disabled={sendingAnnouncement}
              />
            </div>

            {/* Target Audience (for announcements only) */}
            {modalType === 'announcement' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                <select
                  value={newAnnouncement.targetAudience}
                  onChange={(e) => setNewAnnouncement(prev => ({...prev, targetAudience: e.target.value as any}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={sendingAnnouncement}
                >
                  <option value="all">All Students</option>
                  <option value="level">Specific Nursing Levels</option>
                  <option value="individual">Individual Students</option>
                </select>
              </div>
            )}

            {/* Nursing Levels Selection */}
            {(newAnnouncement.targetAudience === 'level' && modalType === 'announcement') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Nursing Levels</label>
                <div className="border border-gray-200 rounded-lg p-3 max-h-32 overflow-y-auto space-y-2">
                  {NURSING_LEVELS.map(level => (
                    <label key={level.value} className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={newAnnouncement.targetLevels.includes(level.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewAnnouncement(prev => ({
                              ...prev, 
                              targetLevels: [...prev.targetLevels, level.value]
                            }));
                          } else {
                            setNewAnnouncement(prev => ({
                              ...prev, 
                              targetLevels: prev.targetLevels.filter(l => l !== level.value)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        disabled={sendingAnnouncement}
                      />
                      <span className="ml-2 text-sm text-gray-700">{level.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Message Options */}
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newAnnouncement.urgent}
                  onChange={(e) => setNewAnnouncement(prev => ({...prev, urgent: e.target.checked}))}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  disabled={sendingAnnouncement}
                />
                <span className="ml-2 text-sm text-gray-700 flex items-center">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1 text-red-500" />
                  Mark as urgent
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newAnnouncement.sendToTelegram}
                  onChange={(e) => setNewAnnouncement(prev => ({...prev, sendToTelegram: e.target.checked}))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={sendingAnnouncement}
                />
                <span className="ml-2 text-sm text-gray-700 flex items-center">
                  <FontAwesomeIcon icon={faTelegram} className="mr-1 text-blue-500" />
                  Send to Telegram
                </span>
              </label>
            </div>
          </div>

          {/* Right Column - Student Selection */}
          <div className="space-y-4">
            {/* Student Selection for Individual Messages or Individual Target */}
            {(modalType === 'individual-message' || newAnnouncement.targetAudience === 'individual') && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Students <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                    disabled={sendingAnnouncement}
                  >
                    {selectAll ? 'Deselect All' : 'Select All Visible'}
                  </button>
                </div>

                {/* Student Search */}
                <div className="relative mb-3">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="Search students..."
                    disabled={sendingAnnouncement}
                  />
                </div>

                {/* Students List */}
                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                  {filteredStudents.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      {studentSearch ? 'No students match your search' : 'No students available'}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredStudents.map(student => (
                        <label 
                          key={student.id} 
                          className="flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudentsForMessage.includes(student.studentId)}
                            onChange={() => toggleStudentSelection(student.studentId)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            disabled={sendingAnnouncement}
                          />
                          <div className="ml-3 flex-1">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-xs text-gray-500 flex items-center space-x-2">
                              <span>{student.studentId}</span>
                              <span>•</span>
                              <span>{NURSING_LEVELS.find(l => l.value === student.nursingLevel)?.label}</span>
                              {student.telegramId && (
                                <>
                                  <span>•</span>
                                  <FontAwesomeIcon icon={faTelegram} className="text-green-500" title="Telegram Connected" />
                                </>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
                  <span>{selectedStudentsForMessage.length} students selected</span>
                  {studentSearch && (
                    <span>Showing {filteredStudents.length} of {students.length} students</span>
                  )}
                </div>
              </div>
            )}

            {/* Target Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FontAwesomeIcon icon={faUsers} className="mr-2 text-gray-500" />
                Message Summary
              </h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Recipients:</span>
                  <span className="font-medium">{targetCount} student{targetCount !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-medium">
                    {modalType === 'individual-message' ? 'Individual Message' : 'Announcement'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Priority:</span>
                  <span className={`font-medium ${newAnnouncement.urgent ? 'text-red-600' : 'text-gray-600'}`}>
                    {newAnnouncement.urgent ? 'Urgent' : 'Normal'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Telegram:</span>
                  <span className={`font-medium ${newAnnouncement.sendToTelegram ? 'text-green-600' : 'text-gray-600'}`}>
                    {newAnnouncement.sendToTelegram ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Telegram Status */}
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center text-sm text-green-700">
                <FontAwesomeIcon icon={faTelegram} className="mr-2" />
                <span className="font-medium">Telegram Bot Active</span>
              </div>
              <div className="text-xs text-green-600 mt-1">
                Messages will be delivered instantly to connected students
              </div>
            </div>
          </div>
        </div>

        {/* Validation Error */}
        {!isFormValid && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 mr-2" />
              <span className="text-sm text-red-700">{validateForm()}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={closeModal}
            disabled={sendingAnnouncement}
            className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!isFormValid || sendingAnnouncement}
            className={`px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors flex items-center ${
              modalType === 'individual-message' 
                ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400'
                : 'bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400'
            }`}
          >
            {sendingAnnouncement ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2 text-sm" />
                Sending...
              </>
            ) : (
              <>
                <FontAwesomeIcon 
                  icon={modalType === 'individual-message' ? faPaperPlane : faBullhorn} 
                  className="mr-2 text-sm" 
                />
                {modalType === 'individual-message' ? 'Send Message' : 'Send Announcement'}
                {targetCount > 0 && ` (${targetCount})`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModals;