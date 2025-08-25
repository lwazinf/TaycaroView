import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBookOpen, 
  faSpinner,
  faDownload,
  faTrash,
  faTags,
  faUser,
  faCalendar,
  faPlus,
  faEye,
  faSearch,
  faFilter,
  faSort
} from '@fortawesome/free-solid-svg-icons';
import {
  studyResourcesAtom,
  resourcesLoadingAtom
} from '../../store/resourcesAtoms';
import { searchTermAtom, showModalAtom, modalTypeAtom } from '../../store/atoms';
import { loadStudyResources, deleteStudyResource } from '../../services/resourcesService';
import { formatFileSize } from '../../utils/helpers';
import { RESOURCE_CATEGORIES, NURSING_LEVELS, StudyResource } from '../../types';

const ResourcesList: React.FC = () => {
  const [resources, setResources] = useAtom(studyResourcesAtom);
  const [loading, setLoading] = useAtom(resourcesLoadingAtom);
  const [searchTerm] = useAtom(searchTermAtom);
  const [, setShowModal] = useAtom(showModalAtom);
  const [, setModalType] = useAtom(modalTypeAtom);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    setLoading(true);
    try {
      const resourcesData = await loadStudyResources();
      setResources(resourcesData);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResource = async (resource: StudyResource) => {
    if (!window.confirm(`Delete resource "${resource.title}"?`)) return;
    
    try {
      await deleteStudyResource(resource);
      await loadResources();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleDownload = async (resource: StudyResource) => {
    try {
      // Increment download count
      // You can implement this in the service if needed
      window.open(resource.url, '_blank');
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const openResourceModal = () => {
    setModalType('resource');
    setShowModal(true);
  };

  const filteredResources = resources.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.targetLevels.some(level => 
      NURSING_LEVELS.find(l => l.value === level)?.label.toLowerCase().includes(searchTerm.toLowerCase())
    ) ||
    resource.targetRotations.some(rotation =>
      rotation.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-600 mr-3 text-xl" />
        <span className="text-gray-600 text-lg">Loading study resources...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Study Resources</h1>
          <p className="text-sm text-gray-500 mt-1">
            {resources.length} resources available for students
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={openResourceModal}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2 text-xs" />
            Add Resource
          </button>
        </div>
      </div>

      {/* Resource Categories Summary */}
      {resources.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Resource Categories</h3>
            <span className="text-sm text-gray-500">Distribution Overview</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {RESOURCE_CATEGORIES.map(category => {
              const count = resources.filter(r => r.category === category.value).length;
              const percentage = resources.length > 0 ? Math.round((count / resources.length) * 100) : 0;
              
              return (
                <div key={category.value} className="bg-gray-50 rounded-lg p-4 text-center hover:bg-gray-100 transition-colors">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{count}</div>
                  <div className="text-xs text-gray-600 mb-1">{category.label}</div>
                  <div className="text-xs text-gray-500">{percentage}% of total</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resources List */}
      {filteredResources.length === 0 ? (
        <div className="text-center py-16">
          <FontAwesomeIcon icon={faBookOpen} className="mx-auto text-gray-400 mb-4 text-6xl" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {resources.length === 0 ? 'No resources yet' : 'No resources found'}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {resources.length === 0 
              ? 'Upload the first study resource for your students.'
              : 'Try adjusting your search terms or filters.'
            }
          </p>
          {resources.length === 0 && (
            <button
              onClick={openResourceModal}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Add First Resource
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredResources.map((resource) => (
            <div key={resource.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-6">
                    {/* Resource Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                            {resource.title}
                          </h3>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {RESOURCE_CATEGORIES.find(c => c.value === resource.category)?.label}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 text-sm leading-relaxed mb-4">{resource.description}</p>
                      </div>
                    </div>
                    
                    {/* Resource Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center">
                        <FontAwesomeIcon icon={faUser} className="mr-1.5 text-xs" />
                        {resource.uploadedBy}
                      </span>
                      <span className="flex items-center">
                        <FontAwesomeIcon icon={faCalendar} className="mr-1.5 text-xs" />
                        {resource.uploadedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                      </span>
                      <span className="flex items-center">
                        <FontAwesomeIcon icon={faDownload} className="mr-1.5 text-xs" />
                        {resource.downloadCount} downloads
                      </span>
                      <span className="flex items-center">
                        <FontAwesomeIcon icon={faEye} className="mr-1.5 text-xs" />
                        {formatFileSize(resource.size)}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                        {resource.fileName}
                      </span>
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-2">
                      {resource.targetLevels.map(level => (
                        <span key={level} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          <FontAwesomeIcon icon={faTags} className="mr-1 text-xs" />
                          {NURSING_LEVELS.find(l => l.value === level)?.label}
                        </span>
                      ))}
                      {resource.targetRotations.map(rotation => (
                        <span key={rotation} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                          <FontAwesomeIcon icon={faTags} className="mr-1 text-xs" />
                          {rotation}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => handleDownload(resource)}
                      className="flex items-center justify-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 hover:border-blue-300"
                      title="Download Resource"
                    >
                      <FontAwesomeIcon icon={faDownload} className="mr-2 text-sm" />
                      Download
                    </button>
                    
                    <button
                      onClick={() => handleDeleteResource(resource)}
                      className="flex items-center justify-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300"
                      title="Delete Resource"
                    >
                      <FontAwesomeIcon icon={faTrash} className="mr-2 text-sm" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Resource Footer with Stats */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Available to {resource.targetLevels.length} nursing level{resource.targetLevels.length !== 1 ? 's' : ''}
                    {resource.targetRotations.length > 0 && ` and ${resource.targetRotations.length} rotation${resource.targetRotations.length !== 1 ? 's' : ''}`}
                  </span>
                  <span>
                    Resource ID: {resource.id.slice(-8)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Show results count */}
      {filteredResources.length > 0 && filteredResources.length !== resources.length && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Showing {filteredResources.length} of {resources.length} resources
            {searchTerm && (
              <span> matching &quot;<strong>{searchTerm}</strong>&quot;</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default ResourcesList;