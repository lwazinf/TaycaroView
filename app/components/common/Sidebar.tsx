import React from 'react';
import { useAtom } from 'jotai';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faGraduationCap, 
  faUserGraduate, 
  faFileAlt, 
  faBookOpen, 
  faBullhorn 
} from '@fortawesome/free-solid-svg-icons';
import { activeViewAtom, studentsAtom } from '../../store/atoms';

const Sidebar: React.FC = () => {
  const [activeView, setActiveView] = useAtom(activeViewAtom);
  const [students] = useAtom(studentsAtom);

  const menuItems = [
    {
      id: 'students',
      label: 'Students',
      icon: faUserGraduate,
      count: students.length
    },
    {
      id: 'documents',
      label: 'All Documents',
      icon: faFileAlt,
      count: 0
    },
    {
      id: 'resources',
      label: 'Study Resources',
      icon: faBookOpen,
      count: 0
    },
    {
      id: 'announcements',
      label: 'Announcements',
      icon: faBullhorn,
      count: 0
    }
  ];

  return (
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
        
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeView === item.id
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <FontAwesomeIcon icon={item.icon} className="mr-3 text-sm" />
            {item.label}
            {item.count > 0 && (
              <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                {item.count}
              </span>
            )}
          </button>
        ))}
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
  );
};

export default Sidebar;