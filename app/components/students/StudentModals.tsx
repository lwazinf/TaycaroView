import React from 'react';
import { useAtom } from 'jotai';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPlus, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { showModalAtom, modalTypeAtom } from '../../store/atoms';
import { newStudentAtom } from '../../store/studentsAtoms';
import { addStudent, loadStudents } from '../../services/studentsService';
import { studentsAtom } from '../../store/atoms';
import { NURSING_LEVELS, CLINICAL_ROTATIONS } from '../../types';

const StudentModals: React.FC = () => {
  const [showModal, setShowModal] = useAtom(showModalAtom);
  const [modalType, setModalType] = useAtom(modalTypeAtom);
  const [newStudent, setNewStudent] = useAtom(newStudentAtom);
  const [, setStudents] = useAtom(studentsAtom);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setNewStudent({
      studentId: '',
      name: '',
      email: '',
      academicYear: new Date().getFullYear().toString(),
      nursingLevel: 'first-year',
      telegramId: '',
      phoneNumber: '',
      clinicalRotation: ''
    });
  };

  const handleAddStudent = async () => {
    if (!newStudent.studentId || !newStudent.name || !newStudent.email || !newStudent.nursingLevel) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await addStudent({
        studentId: newStudent.studentId,
        name: newStudent.name,
        email: newStudent.email,
        academicYear: newStudent.academicYear,
        nursingLevel: newStudent.nursingLevel,
        telegramId: newStudent.telegramId,
        phoneNumber: newStudent.phoneNumber,
        clinicalRotation: newStudent.clinicalRotation
      });

      // Reload students list
      const updatedStudents = await loadStudents();
      setStudents(updatedStudents);
      
      closeModal();
    } catch (error) {
      console.error('Error adding student:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showModal || modalType !== 'student') return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="relative p-6 border w-96 shadow-2xl rounded-lg bg-white mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Add Student</h3>
          <button 
            onClick={closeModal} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newStudent.studentId}
                onChange={(e) => setNewStudent(prev => ({...prev, studentId: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="NUR001"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nursing Level <span className="text-red-500">*</span>
              </label>
              <select
                value={newStudent.nursingLevel}
                onChange={(e) => setNewStudent(prev => ({...prev, nursingLevel: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                {NURSING_LEVELS.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newStudent.name}
              onChange={(e) => setNewStudent(prev => ({...prev, name: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Student full name"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={newStudent.email}
              onChange={(e) => setNewStudent(prev => ({...prev, email: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="student@nursing.edu"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <input
              type="text"
              value={newStudent.academicYear}
              onChange={(e) => setNewStudent(prev => ({...prev, academicYear: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="2024"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Rotation</label>
            <select
              value={newStudent.clinicalRotation}
              onChange={(e) => setNewStudent(prev => ({...prev, clinicalRotation: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="">Select Rotation (Optional)</option>
              {CLINICAL_ROTATIONS.map(rotation => (
                <option key={rotation} value={rotation}>{rotation}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={newStudent.phoneNumber}
                onChange={(e) => setNewStudent(prev => ({...prev, phoneNumber: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+27 XX XXX XXXX"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telegram ID
                <span className="text-xs text-gray-500 ml-1">(optional)</span>
              </label>
              <input
                type="text"
                value={newStudent.telegramId}
                onChange={(e) => setNewStudent(prev => ({...prev, telegramId: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="@username"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={closeModal}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAddStudent}
            disabled={!newStudent.studentId || !newStudent.name || !newStudent.email || !newStudent.nursingLevel || isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 flex items-center"
          >
            {isSubmitting ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2 text-xs" />
                Adding...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPlus} className="mr-2 text-xs" />
                Add Student
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentModals;