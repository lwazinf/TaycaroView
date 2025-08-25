import React from 'react';
import { useAtom } from 'jotai';
import Sidebar from './Sidebar';
import Header from './Header';
import StudentsList from '../students/StudentsList';
import StudentSidebar from '../students/StudentSidebar';
import StudentModals from '../students/StudentModals';
import AttendanceSubmitDialog from '../students/AttendanceMode';
import DocumentsList from '../documents/DocumentsList';
import DocumentModals from '../documents/DocumentModals';
import ResourcesList from '../resources/ResourcesList';
import ResourceModals from '../resources/ResourceModals';
import AnnouncementsList from '../announcements/AnnouncementsList';
import AnnouncementModals from '../announcements/AnnouncementModals';
import { activeViewAtom } from '../../store/atoms';
import { selectedStudentForSidebarAtom } from '../../store/studentsAtoms';

const Layout: React.FC = () => {
  const [activeView] = useAtom(activeViewAtom);
  const [selectedStudentForSidebar] = useAtom(selectedStudentForSidebarAtom);

  const renderContent = () => {
    switch (activeView) {
      case 'students':
        return <StudentsList />;
      case 'documents':
        return <DocumentsList />;
      case 'resources':
        return <ResourcesList />;
      case 'announcements':
        return <AnnouncementsList />;
      default:
        return <StudentsList />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
        selectedStudentForSidebar && activeView === 'students' ? 'mr-96' : ''
      }`}>
        <Header />
        
        <div className="flex-1 overflow-auto">
          <div className="px-6 py-6">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Student Sidebar */}
      <StudentSidebar />

      {/* Modals and Dialogs */}
      <StudentModals />
      <AttendanceSubmitDialog />
      <DocumentModals />
      <ResourceModals />
      <AnnouncementModals />
    </div>
  );
};

export default Layout;