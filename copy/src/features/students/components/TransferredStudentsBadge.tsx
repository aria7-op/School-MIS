import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaExchangeAlt } from 'react-icons/fa';

interface TransferredStudentsBadgeProps {
  student: any;
}

const TransferredStudentsBadge: React.FC<TransferredStudentsBadgeProps> = ({ student }) => {
  const { t } = useTranslation();
  
  if (student.user?.status !== 'TRANSFERRED') {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 border border-orange-300 rounded-full">
      <FaExchangeAlt className="w-3 h-3 text-orange-600" />
      <span className="text-xs font-semibold text-orange-800">
        {t('students.status.transferred')}
      </span>
    </div>
  );
};

export default TransferredStudentsBadge;




