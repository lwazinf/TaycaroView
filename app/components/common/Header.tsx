import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faPlus, 
  faUserCheck, 
  faTimes, 
  faHistory, 
  faSpinner,
  faUpload,
  faBullhorn,
  faPaperPlane,
  faBookOpen,
  faUser,
  faSignOutAlt,
  faChevronDown,
  faCog,
  faUserCircle,
  faBell
} from '@fortawesome/free-solid-svg-icons';
import { 
  activeViewAtom, 
  searchTermAtom,
  showModalAtom,
  modalTypeAtom
} from '../../store/atoms';
import { 
  showAttendanceModeAtom, 
  selectedAttendanceDateAtom,
  attendanceChangedAtom,
  showAttendanceSubmitDialogAtom,
  showAttendanceViewerAtom
} from '../../store/studentsAtoms';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const [activeView] = useAtom(activeViewAtom);
  const [searchTerm, setSearchTerm] = useAtom(searchTermAtom);
  const [showAttendanceMode, setShowAttendanceMode] = useAtom(showAttendanceModeAtom);
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useAtom(selectedAttendanceDateAtom);
  const [attendanceChanged] = useAtom(attendanceChangedAtom);
  const [, setShowAttendanceSubmitDialog] = useAtom(showAttendanceSubmitDialogAtom);
  const [, setShowModal] = useAtom(showModalAtom);
  const [, setModalType] = useAtom(modalTypeAtom);
  const [showAttendanceViewer] = useAtom(showAttendanceViewerAtom);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const { user, logout } = useAuth();

  // Find the getTitle function and update it:
const getTitle = () => {
  switch (activeView) {
    case 'students': return 'Students';
    case 'documents': return 'All Documents';
    case 'resources': return 'Study Resources';
    case 'announcements': return 'Announcements & Messages';
    default: return 'TaycaroView Dashboard';
  }
};

// Also update the main title if you have one displayed elsewhere in the header

  const exitAttendanceMode = () => {
    if (attendanceChanged) {
      setShowAttendanceSubmitDialog(true);
    } else {
      setShowAttendanceMode(false);
    }
  };

  const openModal = (type: string) => {
    setModalType(type);
    setShowModal(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'instructor': return 'bg-blue-100 text-blue-800';
      case 'coordinator': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left side - Title and Mode Indicators */}
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{getTitle()}</h1>
            {showAttendanceMode && (
              <div className="flex items-center mt-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  <FontAwesomeIcon icon={faUserCheck} className="mr-1" />
                  Taking Attendance - {new Date(selectedAttendanceDate).toLocaleDateString()}
                  {attendanceChanged && (
                    <span className="ml-2 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                  )}
                </span>
              </div>
            )}
          </div>
          
          {/* Attendance Mode Toggle */}
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
              </button>
            </div>
          )}
        </div>

        {/* Center - Search and Controls */}
        <div className="flex items-center space-x-4 flex-1 max-w-2xl mx-8">
          {/* Attendance Date Picker */}
          {activeView === 'students' && (showAttendanceMode || showAttendanceViewer) && (
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Date:</label>
              <input
                type="date"
                value={selectedAttendanceDate}
                onChange={(e) => setSelectedAttendanceDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder={`Search ${activeView}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xs" />
              </button>
            )}
          </div>
        </div>

        {/* Right side - Action buttons and User menu */}
        <div className="flex items-center space-x-3">
          {/* Action Buttons based on active view */}
          {activeView === 'documents' && (
            <button
              onClick={() => openModal('document')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
            >
              <FontAwesomeIcon icon={faUpload} className="mr-2 text-xs" />
              Upload
            </button>
          )}

          {activeView === 'resources' && (
            <button
              onClick={() => openModal('resource')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm"
            >
              <FontAwesomeIcon icon={faBookOpen} className="mr-2 text-xs" />
              Add Resource
            </button>
          )}

          {activeView === 'announcements' && (
            <>
              <button
                onClick={() => openModal('individual-message')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
              >
                <FontAwesomeIcon icon={faPaperPlane} className="mr-2 text-xs" />
                Message
              </button>
              <button
                onClick={() => openModal('announcement')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm"
              >
                <FontAwesomeIcon icon={faBullhorn} className="mr-2 text-xs" />
                Announce
              </button>
            </>
          )}

          {activeView === 'students' && !showAttendanceMode && (
            <button
              onClick={() => openModal('student')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2 text-xs" />
              Add Student
            </button>
          )}

          {/* Notifications */}
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <FontAwesomeIcon icon={faBell} className="text-lg" />
            {/* Notification dot */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center space-x-3 p-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
            >
              {/* User Avatar */}
              <div className="relative">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.displayName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {getUserInitials(user?.displayName || '')}
                    </span>
                  </div>
                )}
                {/* Online status indicator */}
                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-400 border-2 border-white rounded-full"></div>
              </div>

              {/* User Info */}
              <div className="hidden md:block text-left">
                <div className="font-medium text-gray-900">{user?.displayName}</div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(user?.role || '')}`}>
                    {user?.role}
                  </span>
                </div>
              </div>

              <FontAwesomeIcon 
                icon={faChevronDown} 
                className={`text-gray-400 text-xs transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} 
              />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowUserDropdown(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {getUserInitials(user?.displayName || '')}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user?.displayName}</div>
                        <div className="text-sm text-gray-500">{user?.email}</div>
                        {user?.institution && (
                          <div className="text-xs text-gray-500">{user.institution}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        // TODO: Open profile modal
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <FontAwesomeIcon icon={faUserCircle} className="mr-3 text-gray-400" />
                      View Profile
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        // TODO: Open settings modal
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <FontAwesomeIcon icon={faCog} className="mr-3 text-gray-400" />
                      Settings
                    </button>
                  </div>

                  <div className="border-t border-gray-200 py-1">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        handleLogout();
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <FontAwesomeIcon icon={faSignOutAlt} className="mr-3 text-red-400" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Header for Additional Context */}
      {(showAttendanceMode || showAttendanceViewer) && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4 text-gray-600">
              <span>
                📅 {new Date(selectedAttendanceDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
              {showAttendanceMode && (
                <span className="text-orange-600">
                  👆 Click student icons to mark attendance
                </span>
              )}
            </div>
            
            {attendanceChanged && showAttendanceMode && (
              <div className="flex items-center text-orange-600">
                <span className="animate-pulse mr-2">⚠️</span>
                <span>Unsaved changes</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;