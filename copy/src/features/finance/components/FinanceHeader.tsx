import React from 'react';
import { useTranslation } from 'react-i18next';
import { FinanceHeaderProps } from '../types/finance';
import Tooltip from './Tooltip';

const FinanceHeader: React.FC<FinanceHeaderProps> = ({ 
  onSearch, 
  onFilter, 
  onExport, 
  onPrint 
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between mb-6">
      {/* Left side - Page title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('finance.header.title')}</h1>
        <p className="text-sm text-gray-600 mt-1">{t('finance.header.subtitle')}</p>
      </div>

      {/* Right side - Icons and actions */}
      <div className="flex items-center space-x-3">

      </div>
    </div>
  );
};

export default FinanceHeader;