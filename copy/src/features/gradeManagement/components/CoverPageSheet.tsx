import React, { useState, useEffect } from 'react';
import gradeManagementService from '../services/gradeManagementService';

/**
 * Cover Page Sheet - Matches Excel "پوش جدول" worksheet
 * Official document cover page
 */
interface CoverPageSheetProps {
  classId: string;
  examType: 'MIDTERM' | 'FINAL';
  editable?: boolean;
  onDataChange?: () => void;
}

const CoverPageSheet: React.FC<CoverPageSheetProps> = ({ classId, examType }) => {
  const [classInfo, setClassInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [classId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await gradeManagementService.getExcelGradeSheetByType(classId, 'FINAL');
      setClassInfo(data.classInfo);
    } catch (error) {
      console.error('Error loading cover page data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cover page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Cover Page Container - Optimized for A4 print */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-8">
        <div className="w-full max-w-4xl bg-white border-4 border-gray-800 rounded-lg shadow-2xl p-12">
          
          {/* Header - Islamic Emirate */}
          <div className="text-center mb-8 pb-6 border-b-2 border-gray-300">
            <div className="mb-4">
              <div className="text-4xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Scheherazade, serif' }}>
                امارت اسلامی افغانستان
              </div>
              <div className="text-xl text-gray-600">
                Islamic Emirate of Afghanistan
              </div>
            </div>
          </div>

          {/* Ministry */}
          <div className="text-center mb-8">
            <div className="text-3xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Scheherazade, serif' }}>
              وزارت معارف
            </div>
            <div className="text-lg text-gray-600">
              Ministry of Education
            </div>
          </div>

          {/* Department/Region Info */}
          <div className="text-center mb-8 space-y-3">
            <div className="text-xl text-gray-700">
              <span className="font-semibold">ریاست مربوطه:</span>
              <span className="mx-2">ریاست تعلیمات عمومی</span>
            </div>
            <div className="text-xl text-gray-700">
              <span className="font-semibold">حوزه/ولسوالی:</span>
              <span className="mx-2">ناحیه مرکزی</span>
            </div>
            <div className="text-xl text-gray-700">
              <span className="font-semibold">مکتب:</span>
              <span className="mx-2">لیسه عالی</span>
            </div>
          </div>

          {/* Main Title */}
          <div className="text-center my-12 py-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-300">
            <div className="text-5xl font-bold text-blue-800 mb-4" style={{ fontFamily: 'Scheherazade, serif' }}>
              جدول نتایج
            </div>
            <div className="text-3xl text-blue-600 font-semibold">
              Results Table
            </div>
          </div>

          {/* Class and Year Info */}
          <div className="text-center mb-8 space-y-4">
            <div className="text-2xl text-gray-800">
              <span className="font-bold">صنف:</span>
              <span className="mx-3 text-blue-700 font-bold">
                {classInfo?.className || 'Class Name'}
              </span>
            </div>
            <div className="text-xl text-gray-700">
              <span className="font-semibold">سال تعلیمی:</span>
              <span className="mx-2">1404 هجري شمسي</span>
              <span className="mx-2">-</span>
              <span className="mx-2">1447 هجري قمري</span>
            </div>
          </div>

          {/* Decorative Border */}
          <div className="border-t-2 border-gray-300 mt-8 pt-6">
            <div className="flex justify-center items-center space-x-4">
              <div className="h-1 w-16 bg-blue-600 rounded"></div>
              <span className="material-icons text-blue-600 text-3xl">school</span>
              <div className="h-1 w-16 bg-blue-600 rounded"></div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center mt-8 text-gray-600 text-sm">
            <p className="italic">
              This document contains the official academic results for the specified class
            </p>
            <p className="mt-2 font-semibold">
              Document prepared in accordance with Ministry of Education standards
            </p>
          </div>

        </div>
      </div>

      {/* Action Bar */}
      <div className="border-t bg-gray-50 p-4 flex justify-between items-center">
        <div className="text-sm text-gray-600 flex items-center gap-2">
          <span className="material-icons text-sm">info</span>
          <span>This cover page should be the first page when printing the complete grade document</span>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-semibold">
            <span className="material-icons text-sm">print</span>
            Print Cover Page
          </button>
          <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 font-semibold shadow-lg">
            <span className="material-icons text-sm">picture_as_pdf</span>
            Generate PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoverPageSheet;


