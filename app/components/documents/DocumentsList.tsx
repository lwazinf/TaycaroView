import React, { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileAlt, 
  faSpinner,
  faEye,
  faEdit,
  faTrash,
  faStar as faStarSolid,
  faSort,
  faFilter,
  faGraduationCap,
  faUser,
  faCalendar,
  faAward,
  faCheckCircle,
  faTimesCircle,
  faSearch,
  faPlus,
  faUpload,
  faSave,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import {
  allDocumentsAtom,
  documentsLoadingAtom,
  sortByAtom,
  groupByAtom,
  editingDocumentAtom,
  editGradeAtom
} from '../../store/documentsAtoms';
import { searchTermAtom, showModalAtom, modalTypeAtom } from '../../store/atoms';
import { 
  loadAllDocuments, 
  deleteDocument, 
  updateDocumentGrade, 
  toggleDocumentStar 
} from '../../services/documentsService';
import { formatFileSize, getStudentInitials, getAvatarColor } from '../../utils/helpers';
import { CATEGORIES, NURSING_LEVELS, StudentDocument } from '../../types';

const DocumentsList: React.FC = () => {
  const [documents, setDocuments] = useAtom(allDocumentsAtom);
  const [loading, setLoading] = useAtom(documentsLoadingAtom);
  const [searchTerm] = useAtom(searchTermAtom);
  const [sortBy, setSortBy] = useAtom(sortByAtom);
  const [groupBy, setGroupBy] = useAtom(groupByAtom);
  const [editingDocument, setEditingDocument] = useAtom(editingDocumentAtom);
  const [editGrade, setEditGrade] = useAtom(editGradeAtom);
  const [, setShowModal] = useAtom(showModalAtom);
  const [, setModalType] = useAtom(modalTypeAtom);

  // Local state for filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [gradedFilter, setGradedFilter] = useState<string>('all');
  const [starredFilter, setStarredFilter] = useState<string>('all');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docs = await loadAllDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (document: StudentDocument) => {
    if (!window.confirm(`Delete "${document.name}"?`)) return;
    
    try {
      await deleteDocument(document);
      await loadDocuments();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const handleUpdateGrade = async (documentId: string) => {
    if (editGrade.grade < 0 || editGrade.maxGrade <= 0 || editGrade.grade > editGrade.maxGrade) {
      alert('Please enter valid grade values.');
      return;
    }

    try {
      await updateDocumentGrade(documentId, editGrade.grade, editGrade.maxGrade, editGrade.feedback);
      setEditingDocument(null);
      setEditGrade({ grade: 0, maxGrade: 100, feedback: '' });
      await loadDocuments();
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update grade. Please try again.');
    }
  };

  const handleToggleStar = async (document: StudentDocument) => {
    try {
      await toggleDocumentStar(document.id, document.isStarred || false);
      await loadDocuments();
    } catch (error) {
      console.error('Star error:', error);
      alert('Failed to update star status. Please try again.');
    }
  };

  const startEditing = (document: StudentDocument) => {
    setEditingDocument(document.id);
    setEditGrade({
      grade: document.grade || 0,
      maxGrade: document.maxGrade || 100,
      feedback: document.feedback || ''
    });
  };

  const cancelEditing = () => {
    setEditingDocument(null);
    setEditGrade({ grade: 0, maxGrade: 100, feedback: '' });
  };

  const openUploadModal = () => {
    setModalType('document');
    setShowModal(true);
  };

  const getFilteredAndSortedDocuments = () => {
    const filteredDocs = documents.filter(doc => {
      // Text search
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.studentId.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Category filter
      const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
      
      // Level filter
      const matchesLevel = levelFilter === 'all' || doc.nursingLevel === levelFilter;
      
      // Graded filter
      const matchesGraded = gradedFilter === 'all' || 
                           (gradedFilter === 'graded' && doc.isGraded) ||
                           (gradedFilter === 'ungraded' && !doc.isGraded);
      
      // Starred filter
      const matchesStarred = starredFilter === 'all' ||
                            (starredFilter === 'starred' && doc.isStarred) ||
                            (starredFilter === 'unstarred' && !doc.isStarred);

      return matchesSearch && matchesCategory && matchesLevel && matchesGraded && matchesStarred;
    });

    // Sort documents
    filteredDocs.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'student':
          return a.studentName.localeCompare(b.studentName);
        case 'date':
          return b.uploadedAt.seconds - a.uploadedAt.seconds;
        case 'grade':
          const aGrade = a.isGraded ? (a.grade! / a.maxGrade!) * 100 : -1;
          const bGrade = b.isGraded ? (b.grade! / b.maxGrade!) * 100 : -1;
          return bGrade - aGrade;
        default:
          return 0;
      }
    });

    return filteredDocs;
  };

  const getOrganizedDocuments = (docs: StudentDocument[]) => {
    if (groupBy === 'none') {
      return { 'All Documents': docs };
    }

    const grouped: { [key: string]: StudentDocument[] } = {};

    docs.forEach(doc => {
      let groupKey = '';
      
      switch (groupBy) {
        case 'year':
          groupKey = doc.academicYear;
          break;
        case 'letter':
          groupKey = doc.studentName.charAt(0).toUpperCase();
          break;
        case 'student':
          groupKey = doc.studentName;
          break;
        case 'level':
          groupKey = NURSING_LEVELS.find(l => l.value === doc.nursingLevel)?.label || doc.nursingLevel;
          break;
        case 'category':
          groupKey = CATEGORIES.find(c => c.value === doc.category)?.label || doc.category;
          break;
        case 'status':
          groupKey = doc.isGraded ? 'Graded' : 'Ungraded';
          break;
        default:
          groupKey = 'All Documents';
      }
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(doc);
    });

    return grouped;
  };

  const filteredDocuments = getFilteredAndSortedDocuments();
  const organizedDocuments = getOrganizedDocuments(filteredDocuments);

  // Statistics
  const stats = {
    total: documents.length,
    graded: documents.filter(d => d.isGraded).length,
    starred: documents.filter(d => d.isStarred).length,
    categories: new Set(documents.map(d => d.category)).size,
    students: new Set(documents.map(d => d.studentId)).size
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-600 mr-3 text-xl" />
        <span className="text-gray-600 text-lg">Loading documents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">All Documents</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage and grade all student submissions
            </p>
          </div>
          <button
            onClick={openUploadModal}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
          >
            <FontAwesomeIcon icon={faUpload} className="mr-2 text-xs" />
            Upload Document
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-blue-600">Total Documents</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.graded}</div>
            <div className="text-xs text-green-600">Graded</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.starred}</div>
            <div className="text-xs text-yellow-600">Starred</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.categories}</div>
            <div className="text-xs text-purple-600">Categories</div>
          </div>
          <div className="bg-indigo-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{stats.students}</div>
            <div className="text-xs text-indigo-600">Students</div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {/* Sort Controls */}
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faSort} className="text-gray-400 text-sm" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="student">Sort by Student</option>
              <option value="grade">Sort by Grade</option>
            </select>
          </div>

          {/* Group Controls */}
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faFilter} className="text-gray-400 text-sm" />
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">No Grouping</option>
              <option value="student">Group by Student</option>
              <option value="category">Group by Category</option>
              <option value="level">Group by Level</option>
              <option value="year">Group by Year</option>
              <option value="status">Group by Status</option>
              <option value="letter">Group by Letter</option>
            </select>
          </div>

          {/* Filters */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Levels</option>
            {NURSING_LEVELS.map(level => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>

          <select
            value={gradedFilter}
            onChange={(e) => setGradedFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Documents</option>
            <option value="graded">Graded Only</option>
            <option value="ungraded">Ungraded Only</option>
          </select>

          <select
            value={starredFilter}
            onChange={(e) => setStarredFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Documents</option>
            <option value="starred">Starred Only</option>
            <option value="unstarred">Unstarred Only</option>
          </select>

          {/* Results count */}
          <div className="text-sm text-gray-500 ml-auto">
            Showing {filteredDocuments.length} of {documents.length} documents
          </div>
        </div>
      </div>

      {/* Documents List */}
      {Object.entries(organizedDocuments).map(([groupName, groupDocs]) => (
        <div key={groupName} className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FontAwesomeIcon icon={faFileAlt} className="mr-3 text-blue-600" />
              {groupName} ({groupDocs.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {groupDocs.length === 0 ? (
              <div className="text-center py-12">
                <FontAwesomeIcon icon={faFileAlt} className="mx-auto text-gray-400 mb-4 text-4xl" />
                <h3 className="text-sm font-medium text-gray-900">No documents found</h3>
                <p className="text-sm text-gray-500 mt-1">
                  No documents match your current filters.
                </p>
              </div>
            ) : (
              groupDocs.map((document) => (
                <div key={document.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Student Avatar */}
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center shadow-sm ${getAvatarColor(document.studentName)}`}>
                        <span className="text-white font-bold text-sm">
                          {getStudentInitials(document.studentName)}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Document Header */}
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer" 
                              onClick={() => window.open(document.url, '_blank')}>
                            {document.name}
                          </h4>
                          
                          {document.isStarred && (
                            <FontAwesomeIcon icon={faStarSolid} className="text-yellow-500 text-sm" />
                          )}
                          
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {CATEGORIES.find(c => c.value === document.category)?.label}
                          </span>
                        </div>
                        
                        {/* Student Info */}
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span className="flex items-center font-medium">
                            <FontAwesomeIcon icon={faUser} className="mr-2" />
                            {document.studentName}
                          </span>
                          <span className="flex items-center">
                            <FontAwesomeIcon icon={faGraduationCap} className="mr-2" />
                            {NURSING_LEVELS.find(l => l.value === document.nursingLevel)?.label}
                          </span>
                          <span className="flex items-center">
                            <FontAwesomeIcon icon={faCalendar} className="mr-2" />
                            {document.uploadedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                          </span>
                          <span>{formatFileSize(document.size)}</span>
                        </div>
                        
                        {/* Grade Display */}
                        {document.isGraded && (
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="flex items-center space-x-2">
                              <FontAwesomeIcon icon={faAward} className="text-green-500" />
                              <span className="font-semibold text-green-700">
                                Grade: {document.grade}/{document.maxGrade}
                              </span>
                              <span className="text-sm text-gray-500">
                                ({((document.grade! / document.maxGrade!) * 100).toFixed(1)}%)
                              </span>
                            </div>
                            {document.dateGraded && (
                              <span className="text-xs text-gray-500">
                                Graded: {document.dateGraded.toDate().toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Feedback */}
                        {document.feedback && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                            <p className="text-sm text-blue-800">
                              <strong>Feedback:</strong> {document.feedback}
                            </p>
                          </div>
                        )}
                        
                        {/* Grading Form */}
                        {editingDocument === document.id && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-blue-200">
                            <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <FontAwesomeIcon icon={faEdit} className="mr-2 text-blue-600" />
                              Grade Document
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Points Earned
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={editGrade.grade}
                                  onChange={(e) => setEditGrade(prev => ({...prev, grade: Number(e.target.value)}))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  placeholder="Points earned"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Total Points
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={editGrade.maxGrade}
                                  onChange={(e) => setEditGrade(prev => ({...prev, maxGrade: Number(e.target.value)}))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  placeholder="Total points possible"
                                />
                              </div>
                            </div>
                            <div className="mb-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Feedback (Optional)
                              </label>
                              <textarea
                                value={editGrade.feedback}
                                onChange={(e) => setEditGrade(prev => ({...prev, feedback: e.target.value}))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                placeholder="Provide feedback to help the student improve..."
                              />
                            </div>
                            {editGrade.grade > 0 && editGrade.maxGrade > 0 && (
                              <div className="mb-3 p-2 bg-white rounded border">
                                <div className="text-sm text-gray-600">
                                  Percentage: <span className="font-semibold">
                                    {((editGrade.grade / editGrade.maxGrade) * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            )}
                            <div className="flex space-x-3">
                              <button
                                onClick={() => handleUpdateGrade(document.id)}
                                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center"
                              >
                                <FontAwesomeIcon icon={faSave} className="mr-2" />
                                Save Grade
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => window.open(document.url, '_blank')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Document"
                      >
                        <FontAwesomeIcon icon={faEye} className="text-sm" />
                      </button>
                      
                      <button
                        onClick={() => handleToggleStar(document)}
                        className={`p-2 hover:bg-yellow-50 rounded-lg transition-colors ${
                          document.isStarred ? 'text-yellow-500' : 'text-gray-400'
                        }`}
                        title={document.isStarred ? 'Remove Star' : 'Add Star'}
                      >
                        <FontAwesomeIcon 
                          icon={document.isStarred ? faStarSolid : faStarRegular} 
                          className="text-sm" 
                        />
                      </button>
                      
                      <button
                        onClick={() => startEditing(document)}
                        disabled={editingDocument === document.id}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Grade Document"
                      >
                        <FontAwesomeIcon icon={faEdit} className="text-sm" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteDocument(document)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Document"
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {filteredDocuments.length === 0 && documents.length === 0 && (
        <div className="text-center py-16">
          <FontAwesomeIcon icon={faFileAlt} className="mx-auto text-gray-400 mb-4 text-6xl" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No documents uploaded yet</h3>
          <p className="text-gray-500 mb-6">
            Upload the first document to get started with document management.
          </p>
          <button
            onClick={openUploadModal}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <FontAwesomeIcon icon={faUpload} className="mr-2" />
            Upload First Document
          </button>
        </div>
      )}

      {/* No Results State */}
      {filteredDocuments.length === 0 && documents.length > 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FontAwesomeIcon icon={faSearch} className="mx-auto text-gray-400 mb-4 text-4xl" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents match your filters</h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your search terms or filters to find what you&apos;re looking for.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => {
                setCategoryFilter('all');
                setLevelFilter('all');
                setGradedFilter('all');
                setStarredFilter('all');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
            <button
              onClick={openUploadModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upload New Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsList;