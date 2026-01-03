import React from 'react';
import { useTranslation } from 'react-i18next';
import { PaginationMeta } from '../types/classes';

interface PaginationInfoProps {
  pagination: PaginationMeta | null;
  currentPage: number;
  loading?: boolean;
}

const PaginationInfo: React.FC<PaginationInfoProps> = ({
  pagination,
  currentPage,
  loading = false,
}) => {
  const { t } = useTranslation();
  if (!pagination) {
    return null;
  }

  const { total, limit, totalPages } = pagination;
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, total);

  return (
    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <p className="text-sm text-gray-700">
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('classes.pagination.loading')}
              </span>
            ) : (
              <>
                {t('classes.pagination.showingResults', { start: startItem, end: endItem, total: total })}
              </>
            )}
          </p>
        </div>
        
        <div className="flex items-center">
          <p className="text-sm text-gray-700">
            {t('classes.pagination.pageOf', { current: currentPage, total: totalPages })}
            {totalPages > 3 && (
              <span className="ml-2 text-xs text-blue-600">
                ({t('classes.pagination.rateLimitNotice')})
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaginationInfo;