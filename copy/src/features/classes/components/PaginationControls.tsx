import React from 'react';
import { useTranslation } from 'react-i18next';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  loading?: boolean;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  onPageChange,
  onNextPage,
  onPrevPage,
  loading = false,
}) => {
  const { t } = useTranslation();
  // Debug logging
  console.log('PaginationControls props:', {
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    onNextPage: !!onNextPage,
    loading
  });
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center px-4 py-3 bg-white border-t border-gray-200 sm:px-6 gap-2 sm:gap-0">
  <div className="flex items-center justify-between w-full sm:w-auto sm:flex-1">
    {/* Previous button */}
    <div className="flex justify-start flex-1 sm:flex-1 w-0">
      <button
        onClick={onPrevPage}
        disabled={!hasPrevPage || loading}
        className={`relative inline-flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md ${
          !hasPrevPage || loading
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-gray-50'
        }`}
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="hidden sm:inline">{t('classes.pagination.previous')}</span>
      </button>
    </div>

    {/* Mobile page info - centered between buttons */}
    <div className="flex sm:hidden items-center justify-center px-2">
      <p className="text-xs font-medium text-gray-700 whitespace-nowrap">
        {t('classes.pagination.pageOf', { current: currentPage, total: totalPages })}
      </p>
    </div>

    {/* Desktop page numbers */}
    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-center">
      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label={t('classes.pagination.paginationLabel')}>
        {pageNumbers.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300">
                ...
              </span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                disabled={loading}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border ${
                  page === currentPage
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
      </nav>
    </div>

    {/* Next button */}
    <div className="flex justify-end flex-1 sm:flex-1 w-0">
      <button
        onClick={() => {
          console.log('Next button clicked!');
          onNextPage();
        }}
        disabled={!hasNextPage || loading}
        className={`relative inline-flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md ${
          !hasNextPage || loading
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-gray-50'
        }`}
      >
        <span className="hidden sm:inline">{t('classes.pagination.next')}</span>
        <svg className="w-4 h-4 sm:w-5 sm:h-5 sm:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</div>
  );
};

export default PaginationControls;