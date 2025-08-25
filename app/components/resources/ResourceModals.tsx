import React, { useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faPlus, 
  faSpinner, 
  faUpload,
  faFile,
  faExclamationTriangle,
  faInfoCircle,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import { showModalAtom, modalTypeAtom } from '../../store/atoms';
import { 
  newResourceAtom, 
  resourceUploadingAtom,
  studyResourcesAtom 
} from '../../store/resourcesAtoms';
import { uploadStudyResource, loadStudyResources } from '../../services/resourcesService';
import { RESOURCE_CATEGORIES, NURSING_LEVELS, CLINICAL_ROTATIONS } from '../../types';

const ResourceModals: React.FC = () => {
  const [showModal, setShowModal] = useAtom(showModalAtom);
  const [modalType, setModalType] = useAtom(modalTypeAtom);
  const [newResource, setNewResource] = useAtom(newResourceAtom);
  const [uploading, setUploading] = useAtom(resourceUploadingAtom);
  const [, setStudyResources] = useAtom(studyResourcesAtom);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const resourceFileInputRef = useRef<HTMLInputElement>(null);

  const closeModal = () => {
    if (uploading) return; // Prevent closing during upload
    
    setShowModal(false);
    setModalType('');
    setNewResource({
      title: '',
      description: '',
      category: 'lecture-notes',
      targetLevels: [],
      targetRotations: [],
      files: null
    });
    setDragActive(false);
    setUploadProgress(0);
    if (resourceFileInputRef.current) {
      resourceFileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    if (!newResource.title.trim()) return 'Title is required';
    if (!newResource.description.trim()) return 'Description is required';
    if (newResource.targetLevels.length === 0) return 'At least one nursing level must be selected';
    if (!newResource.files || newResource.files.length === 0) return 'Please select a file to upload';
    
    const file = newResource.files[0];
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) return 'File size must be less than 50MB';
    
    return null;
  };

  const handleUploadResource = async () => {
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress (in real implementation, you'd get this from Firebase)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await uploadStudyResource(
  {
    title: newResource.title,
    description: newResource.description,
    category: newResource.category,
    targetLevels: newResource.targetLevels,
    targetRotations: newResource.targetRotations,
  },
  newResource.files![0]  // Pass file as separate argument
);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reload resources
      const updatedResources = await loadStudyResources();
      setStudyResources(updatedResources);
      
      // Show success message briefly
      setTimeout(() => {
        closeModal();
      }, 1000);
      
    } catch (error) {
      console.error('Error uploading resource:', error);
      alert('Failed to upload resource. Please try again.');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = e.dataTransfer.files;
      setNewResource(prev => ({ ...prev, files }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewResource(prev => ({ ...prev, files: e.target.files }));
    }
  };

  const toggleLevel = (level: string) => {
    setNewResource(prev => ({
      ...prev,
      targetLevels: prev.targetLevels.includes(level)
        ? prev.targetLevels.filter(l => l !== level)
        : [...prev.targetLevels, level]
    }));
  };

  const toggleRotation = (rotation: string) => {
    setNewResource(prev => ({
      ...prev,
      targetRotations: prev.targetRotations.includes(rotation)
        ? prev.targetRotations.filter(r => r !== rotation)
        : [...prev.targetRotations, rotation]
    }));
  };

  const selectAllLevels = () => {
    const allLevels = NURSING_LEVELS.map(l => l.value);
    setNewResource(prev => ({
      ...prev,
      targetLevels: prev.targetLevels.length === allLevels.length ? [] : allLevels
    }));
  };

  if (!showModal || modalType !== 'resource') return null;

  const selectedFile = newResource.files?.[0];
  const isFormValid = validateForm() === null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="relative p-6 border w-[600px] max-w-[90vw] shadow-2xl rounded-xl bg-white mx-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Add Study Resource</h3>
            <p className="text-sm text-gray-500 mt-1">Upload educational materials for your students</p>
          </div>
          <button 
            onClick={closeModal} 
            disabled={uploading}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faTimes} className="text-lg" />
          </button>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-600">Uploading...</span>
              <span className="text-sm text-blue-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            {uploadProgress === 100 && (
              <div className="flex items-center mt-2 text-green-600 text-sm">
                <FontAwesomeIcon icon={faCheck} className="mr-2" />
                Upload completed successfully!
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column - Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resource Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newResource.title}
                onChange={(e) => setNewResource(prev => ({...prev, title: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Cardiovascular System Study Guide"
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={newResource.description}
                onChange={(e) => setNewResource(prev => ({...prev, description: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                rows={4}
                placeholder="Provide a detailed description of this resource and how students can use it..."
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={newResource.category}
                onChange={(e) => setNewResource(prev => ({...prev, category: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={uploading}
              >
                {RESOURCE_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* File Upload Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File <span className="text-red-500">*</span>
              </label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive 
                    ? 'border-green-400 bg-green-50' 
                    : selectedFile 
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={resourceFileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi"
                  disabled={uploading}
                />
                
                {selectedFile ? (
                  <div className="space-y-2">
                    <FontAwesomeIcon icon={faFile} className="mx-auto text-green-600 text-2xl" />
                    <div>
                      <p className="text-sm font-medium text-green-900">{selectedFile.name}</p>
                      <p className="text-xs text-green-600">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <p className="text-xs text-green-600">Click to change file</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FontAwesomeIcon icon={faUpload} className="mx-auto text-gray-400 text-2xl" />
                    <div>
                      <p className="text-sm text-gray-600">Drop your file here, or click to browse</p>
                      <p className="text-xs text-gray-500">Supports: PDF, DOC, PPT, Images, Videos</p>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center">
                <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
                Maximum file size: 50MB
              </p>
            </div>
          </div>

          {/* Right Column - Target Audience */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Target Nursing Levels <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={selectAllLevels}
                  className="text-xs text-green-600 hover:text-green-800 font-medium"
                  disabled={uploading}
                >
                  {newResource.targetLevels.length === NURSING_LEVELS.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-3 max-h-32 overflow-y-auto space-y-2">
                {NURSING_LEVELS.map(level => (
                  <label key={level.value} className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={newResource.targetLevels.includes(level.value)}
                      onChange={() => toggleLevel(level.value)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      disabled={uploading}
                    />
                    <span className="ml-2 text-sm text-gray-700">{level.label}</span>
                  </label>
                ))}
              </div>
              {newResource.targetLevels.length === 0 && (
                <p className="text-xs text-red-500 mt-1 flex items-center">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
                  Please select at least one nursing level
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Clinical Rotations (Optional)
              </label>
              <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                {CLINICAL_ROTATIONS.map(rotation => (
                  <label key={rotation} className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={newResource.targetRotations.includes(rotation)}
                      onChange={() => toggleRotation(rotation)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      disabled={uploading}
                    />
                    <span className="ml-2 text-sm text-gray-700">{rotation}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {newResource.targetRotations.length > 0 
                  ? `Selected: ${newResource.targetRotations.length} rotation${newResource.targetRotations.length !== 1 ? 's' : ''}`
                  : 'Available to all rotations if none selected'
                }
              </p>
            </div>

            {/* Preview of selections */}
            {(newResource.targetLevels.length > 0 || newResource.targetRotations.length > 0) && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Target Audience Preview:</h4>
                <div className="space-y-1">
                  <div className="flex flex-wrap gap-1">
                    {newResource.targetLevels.map(level => (
                      <span key={level} className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        {NURSING_LEVELS.find(l => l.value === level)?.label}
                      </span>
                    ))}
                  </div>
                  {newResource.targetRotations.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {newResource.targetRotations.map(rotation => (
                        <span key={rotation} className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                          {rotation}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={closeModal}
            disabled={uploading}
            className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUploadResource}
            disabled={!isFormValid || uploading}
            className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center"
          >
            {uploading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2 text-sm" />
                {uploadProgress < 100 ? 'Uploading...' : 'Finalizing...'}
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPlus} className="mr-2 text-sm" />
                Add Resource
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResourceModals;