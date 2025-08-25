import React from 'react';
import { useAtom } from 'jotai';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faExclamationTriangle, 
  faInfoCircle,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import {
  showAttendanceSubmitDialogAtom,
  todaysAttendanceAtom,
  selectedAttendanceDateAtom,
  attendanceChangedAtom,
  showAttendanceModeAtom
} from '../../store/studentsAtoms';
import { studentsAtom } from '../../store/atoms';
import { submitAttendanceList } from '../../services/studentsService';
import { formatDateForId } from '../../utils/helpers';

const AttendanceSubmitDialog: React.FC = () => {
  const [showDialog, setShowDialog] = useAtom(showAttendanceSubmitDialogAtom);
  const [students] = useAtom(studentsAtom);
  const [todaysAttendance] = useAtom(todaysAttendanceAtom);
  const [selectedDate] = useAtom(selectedAttendanceDateAtom);
  const [, setAttendanceChanged] = useAtom(attendanceChangedAtom);
  const [, setShowAttendanceMode] = useAtom(showAttendanceModeAtom);

  const handleSubmit = async () => {
    try {
      await submitAttendanceList(students, todaysAttendance, selectedDate);
      setShowDialog(false);
      setShowAttendanceMode(false);
      setAttendanceChanged(false);
      alert(`Attendance list for ${formatDateForId(selectedDate)} has been finalized and saved!`);
    } catch (error) {
      console.error('Error submitting attendance:', error);
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
  };

  if (!showDialog) return null;

  const presentCount = Object.values(todaysAttendance).filter(Boolean).length;
  const absentCount = students.length - presentCount;

  return (
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
            You are about to finalize the attendance list for <strong>{formatDateForId(selectedDate)}</strong>.
          </p>
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="flex justify-between mb-2">
              <span>Total Students:</span>
              <span className="font-semibold">{students.length}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Present:</span>
              <span className="font-semibold text-green-600">{presentCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Absent:</span>
              <span className="font-semibold text-red-600">{absentCount}</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500 flex items-center">
            <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
            Once submitted, this attendance record will be saved permanently and cannot be modified.
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faCheck} className="mr-2" />
            Submit & Finalize
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceSubmitDialog;