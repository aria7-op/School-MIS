import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaUpload, FaInfoCircle } from 'react-icons/fa';
import { SubjectFormData } from '../types/subjects';

interface BulkInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBulkInsert: (subjects: SubjectFormData[]) => Promise<void>;
  isLoading?: boolean;
}

const BulkInsertModal: React.FC<BulkInsertModalProps> = ({
  isOpen,
  onClose,
  onBulkInsert,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const exampleJSON = JSON.stringify([
    {
      "name": "Dari",
      "code": "DARI1",
      "description": "Introduction to Dari Language and Literature for Grade 1"
    },
    {
      "name": "Mathematics",
      "code": "MATH1",
      "description": "Introduction to Mathematics for Grade 1"
    },
    {
      "name": "Science",
      "code": "SCIENCE1",
      "description": "Introduction to General Science for Grade 1"
    }
  ], null, 2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Parse JSON
      let parsedData;
      try {
        parsedData = JSON.parse(jsonInput);
      } catch (err) {
        setError('Invalid JSON format. Please check your syntax.');
        return;
      }

      // Validate that it's an array
      if (!Array.isArray(parsedData)) {
        setError('JSON must be an array of subjects.');
        return;
      }

      // Validate each subject
      const validatedSubjects: SubjectFormData[] = [];
      for (let i = 0; i < parsedData.length; i++) {
        const subject = parsedData[i];
        
        if (!subject.name || !subject.code) {
          setError(`Subject at index ${i} is missing required fields (name, code).`);
          return;
        }

        // Set default creditHours if not provided (default to 3)
        const creditHours = typeof subject.creditHours === 'number' 
          ? subject.creditHours 
          : 3;

        validatedSubjects.push({
          name: subject.name,
          code: subject.code,
          description: subject.description || '',
          creditHours: creditHours,
          isElective: subject.isElective || false,
          departmentId: subject.departmentId,
        });
      }

      // Submit bulk insert
      await onBulkInsert(validatedSubjects);
      
      // Reset form on success
      setJsonInput('');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to process bulk insert');
    }
  };

  const handleLoadExample = () => {
    setJsonInput(exampleJSON);
    setError(null);
  };

  const handleClose = () => {
    setJsonInput('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <FaUpload className="text-blue-600" />
            Bulk Insert Subjects
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            disabled={isLoading}
          >
            <FaTimes className="h-6 w-6" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mx-6 mt-6">
          <div className="flex items-start gap-3">
            <FaInfoCircle className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">JSON Format Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Must be a valid JSON array of objects</li>
                <li>Required fields: name, code</li>
                <li>Optional fields: description, creditHours (default: 3), isElective (default: false), departmentId</li>
                <li>creditHours must be a number if provided</li>
                <li>Do not include trailing commas in your JSON</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
          <div className="space-y-4">
            {/* JSON Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="jsonInput" className="block text-sm font-medium text-gray-700">
                  Subjects JSON <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleLoadExample}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Load Example
                </button>
              </div>
              <textarea
                id="jsonInput"
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  setError(null);
                }}
                rows={15}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="Paste your JSON array here..."
                required
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
          >
            <FaTimes className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !jsonInput.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <FaUpload className="w-4 h-4" />
                Insert Subjects
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkInsertModal;
