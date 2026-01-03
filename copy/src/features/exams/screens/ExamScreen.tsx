import React from 'react';
import GoogleDriveIntegration from '../components/GoogleDriveIntegration';
import { useTranslation } from 'react-i18next';

const ExamScreen: React.FC = () => {
    const { t } = useTranslation();
  
  return (
    <div className="p-1 sm:p-6 space-y-6 sm:space-y-6">
      {/* Header */}
      <div className='p-2 sm:p-6'>
        <h2 className="text-2xl font-semibold text-gray-800">{t('exams.googleDrive.headerTitle')}</h2>
        <p className="text-sm text-gray-600 mt-1">{t('exams.googleDrive.description')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500">{t('exams.googleDrive.upcoming')}</div>
          <div className="mt-2 text-3xl font-bold text-gray-800">0</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500">{t('exams.googleDrive.result')}</div>
          <div className="mt-2 text-3xl font-bold text-gray-800">0</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500">{t('exams.googleDrive.published')}</div>
          <div className="mt-2 text-3xl font-bold text-gray-800">0</div>
        </div>
      </div>

      {/* Google Drive Integration */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('exams.googleDrive.googleDriveIntegration')}</h3>
        <GoogleDriveIntegration onFileSelect={(file) => console.log('Selected file:', file)} />
      </div>
    </div>
  );
};

export default ExamScreen;

