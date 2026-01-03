// copy/src/features/classes/components/ClassesHeader.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';

interface ClassesHeaderProps {
  onSearch: (query: string) => void;
  onAddClass: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const ClassesHeader: React.FC<ClassesHeaderProps> = ({
  onSearch,
  onAddClass,
  searchQuery,
  setSearchQuery,
}) => {
  const { t } = useTranslation();
  return (
<div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-4">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    {/* Left side - Title and search */}
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:flex-1">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{t('classes.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('classes.subtitle')}</p>
      </div>
      
      {/* Search input */}
      <div className="w-full sm:flex-1 sm:max-w-md">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder={t('classes.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearch(e.target.value);
            }}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>
    </div>

    {/* Right side - Actions */}
    <div className="hidden sm:flex items-center gap-3">
      {/* Add class button */}
      <button
        onClick={onAddClass}
        className="hidden sm:inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        {t('classes.addClass')}
      </button>
    </div>
  </div>
</div>
  );
};

export default ClassesHeader;