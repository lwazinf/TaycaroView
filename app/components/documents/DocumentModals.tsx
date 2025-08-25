import React, { useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faUpload, 
  faSpinner,
  faFile,
  faCheck,
  faExclamationTriangle,
  faInfoCircle,
  faUser,
  faFolder,
  faCloudUpload
} from '@fortawesome/free-solid-svg-icons';
import { showModalAtom, modalTypeAtom } from '../../store/atoms';
import { studentsAtom } from '../../store/studentsAtoms';
import { newDocumentAtom, uploadingAtom, allDocumentsAtom } from '../../store/documentsAtoms';
import { uploadDocument, loadAllDocuments } from '../../services/documentsService';
import { CATEGORIES } from '../../types';
import { formatFileSize } from '../../utils/helpers';

const DocumentModals: React.FC = () => {
  const [showModal, setShowModal] = useAtom(showModalAtom);
  const [modalType, setModalType] = useAtom(modalTypeAtom);
  const [students] = useAtom(studentsAtom);
  const [newDocument, setNewDocument] = useAtom(newDocumentAtom);
  const [uploading, setUploading] = useAtom(uploadingAtom);
  const [, setAllDocuments] = useAtom(allDocumentsAtom);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const closeModal = () => {
    if (uploading) return; // Prevent closing during upload
    
    setShowModal(false);
    setModalType('');
    setNewDocument({ studentId: '', category: 'assignments', files: null });
    setSelectedFiles([]);
    setDragActive(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    if (!newDocument.studentId) return 'Please select a student';
    if (!selectedFiles.length) return 'Please select at least one file';
    
    // Check file sizes
    const maxSize = 10 * 1024 * 1024; // 10MB per file
    const oversizedFiles = selectedFiles.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      return `File(s) too large: ${oversizedFiles.map(f => f.name).join(', ')}. Max size: 10MB per file`;
    }
    
    return null;
  };

  const handleUploadDocument = async () => {
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }
    
    const student = students.find(s => s.studentId === newDocument.studentId);
    if (!student) {
      alert('Selected student not found');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Create FileList-like object from selected files
      const fileList = {
        length: selectedFiles.length,
        item: (index: number) => selectedFiles[index],
        [Symbol.iterator]: function* () {
          for (let i = 0; i < this.length; i++) {
            yield this.item(i);
          }
        }
      } as FileList;

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 300);

      await uploadDocument(fileList, newDocument.studentId, newDocument.category, student);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Reload documents
      const updatedDocuments = await loadAllDocuments();
      setAllDocuments(updatedDocuments);

      // Show success message briefly
      setTimeout(() => {
        closeModal();
      }, 1500);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload documents. Please try again.');
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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getSelectedStudent = () => {
    return students.find(s => s.studentId === newDocument.studentId);
  };

  if (!showModal || modalType !== 'document') return null;

  const selectedStudent = getSelectedStudent();
  const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
  const isFormValid = validateForm() === null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="relative p-6 border w-[700px] max-w-[90vw] shadow-2xl rounded-xl bg-white mx-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Upload Documents</h3>
            <p className="text-sm text-gray-500 mt-1">Upload student assignments and submissions</p>
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
              <span className="text-sm font-medium text-blue-600">
                Uploading {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}...
              </span>
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
          
          {/* Left Column - Student and Category Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FontAwesomeIcon icon={faUser} className="mr-2 text-blue-500" />
                Select Student <span className="text-red-500">*</span>
              </label>
              <select
                value={newDocument.studentId}
                onChange={(e) => setNewDocument(prev => ({...prev, studentId: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={uploading}
              >
                <option value="">Choose a student...</option>
                {students.map(student => (
                  <option key={student.id} value={student.studentId}>
                    {student.name} ({student.studentId})
                  </option>
                ))}
              </select>
              
              {/* Selected Student Info */}
              {selectedStudent && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm">
                    <div className="font-medium text-blue-900">{selectedStudent.name}</div>
                    <div className="text-blue-700">
                      {selectedStudent.nursingLevel.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} • 
                      Year {selectedStudent.academicYear}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FontAwesomeIcon icon={faFolder} className="mr-2 text-green-500" />
                Document Category
              </label>
              <select
                value={newDocument.category}
                onChange={(e) => setNewDocument(prev => ({...prev, category: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={uploading}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose the appropriate category for these documents
              </p>
            </div>

            {/* File Summary */}
            {selectedFiles.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Upload Summary</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Files selected: {selectedFiles.length}</div>
                  <div>Total size: {formatFileSize(totalSize)}</div>
                  <div>Category: {CATEGORIES.find(c => c.value === newDocument.category)?.label}</div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - File Upload */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FontAwesomeIcon icon={faCloudUpload} className="mr-2 text-purple-500" />
                Upload Files <span className="text-red-500">*</span>
              </label>
              
              {/* File Upload Area */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : selectedFiles.length > 0
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi"
                  disabled={uploading}
                />
                
                {selectedFiles.length > 0 ? (
                  <div className="space-y-3">
                    <FontAwesomeIcon icon={faCheck} className="mx-auto text-green-600 text-3xl" />
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                      </p>
                      <p className="text-xs text-green-600">
                        {formatFileSize(totalSize)} total
                      </p>
                    </div>
                    <p className="text-xs text-green-600">Click to change files</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <FontAwesomeIcon icon={faUpload} className="mx-auto text-gray-400 text-3xl" />
                    <div>
                      <p className="text-sm text-gray-600">Drop your files here, or click to browse</p>
                      <p className="text-xs text-gray-500">Supports: PDF, DOC, PPT, Images, Videos</p>
                    </div>
                  </div>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mt-1 flex items-center">
                <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
                Maximum 10MB per file. You can select multiple files at once.
              </p>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="max-h-64 overflow-y-auto">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files</h4>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <FontAwesomeIcon icon={faFile} className="text-gray-400 text-sm flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      {!uploading && (
                        <button
                          onClick={() => removeFile(index)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        >
                          <FontAwesomeIcon icon={faTimes} className="text-xs" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Validation Errors */}
        {!isFormValid && selectedFiles.length > 0 && newDocument.studentId && (
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
            disabled={uploading}
            className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUploadDocument}
            disabled={!isFormValid || uploading}
            className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center"
          >
            {uploading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2 text-sm" />
                {uploadProgress < 100 ? 'Uploading...' : 'Finalizing...'}
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faUpload} className="mr-2 text-sm" />
                Upload {selectedFiles.length > 0 && `${selectedFiles.length} `}Document{selectedFiles.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentModals;