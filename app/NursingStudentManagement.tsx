'use client'
import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faExclamationTriangle, faTimes } from '@fortawesome/free-solid-svg-icons';
import Layout from './components/common/Layout';
import { loadingAtom, studentsAtom, errorAtom } from './store/atoms';
import { loadStudents } from './services/studentsService';

const NursingStudentManagement: React.FC = () => {
  const [loading, setLoading] = useAtom(loadingAtom);
  const [, setStudents] = useAtom(studentsAtom);
  const [error, setError] = useAtom(errorAtom);

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        const studentsData = await loadStudents();
        setStudents(studentsData);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [setLoading, setStudents, setError]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-600 text-4xl mb-4" />
          <p className="text-gray-600">Loading TaycaroView Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Layout />
      
      {/* Global Error Message */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg z-50 shadow-lg max-w-md">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 flex-shrink-0" />
            <span className="text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-3 text-red-500 hover:text-red-700 flex-shrink-0"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default NursingStudentManagement;