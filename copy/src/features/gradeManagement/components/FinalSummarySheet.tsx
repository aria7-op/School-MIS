import React, { useState, useEffect } from 'react';
import gradeManagementService from '../services/gradeManagementService';
import { useStudentListHeaderFields } from '../context/StudentListHeaderContext';

/**
 * Final Summary Sheet - Matches Excel "ورق اخیر جدول" worksheet
 * Administrative summary and verification page
 */
interface FinalSummarySheetProps {
  classId: string;
  examType: 'MIDTERM' | 'FINAL';
  editable?: boolean;
  onDataChange?: () => void;
}

const FinalSummarySheet: React.FC<FinalSummarySheetProps> = ({ classId, examType, editable }) => {
  const [annualData, setAnnualData] = useState<any>(null);
  const [teacherNotes, setTeacherNotes] = useState('');
  const [committeeNotes, setCommitteeNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const headerFields = useStudentListHeaderFields();

  useEffect(() => {
    loadData();
  }, [classId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await gradeManagementService.getExcelGradeSheetByType(classId, 'FINAL');
      setAnnualData(data);
    } catch (error) {
      console.error('Error loading final summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading final summary...</p>
        </div>
      </div>
    );
  }

  if (!annualData) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="text-center">
          <span className="material-icons text-5xl text-red-500">error_outline</span>
          <p className="mt-4 text-red-600">Failed to load final summary</p>
        </div>
      </div>
    );
  }

  const stats = annualData.classStatistics || {};
  const classInfo = annualData.classInfo || {};
  const totalStudents = stats.totalStudents || 0;
  const pagesInList = Math.ceil(totalStudents / 25); // 25 students per page
  const pagesInTable = Math.ceil(totalStudents / 7); // 7 students per page

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Page Container */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto">
          
          {/* Section 1: Class Teacher's Notes */}
          <div className="mb-8 border-2 border-gray-300 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="material-icons text-blue-600">note</span>
              نظر نگران (Class Teacher's Notes)
            </h2>
            
            <div className="mb-4 bg-blue-50 p-4 rounded border border-blue-200">
              <p className="text-sm font-semibold mb-2">
                تمام معلومات مندرج جدول نتایج صنف: <span className="text-blue-700">{classInfo.className}</span>
              </p>
              <p className="text-sm text-gray-700">
                برویت شقه ها، کتاب اساس، جدول نتایج صنف قبلی و اسناد لازم با درک و مسؤلیت حال و اینده ترتیب گردیده است که شرح احصائیه ان قرار ذیل می‌باشد:
              </p>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white p-4 rounded border-2 border-blue-300">
                <p className="text-xs text-gray-600 mb-1">تعداد داخله:</p>
                <p className="text-3xl font-bold text-blue-700">{totalStudents}</p>
              </div>
              <div className="bg-white p-4 rounded border-2 border-green-300">
                <p className="text-xs text-gray-600 mb-1">شامل امتحان:</p>
                <p className="text-3xl font-bold text-green-700">{totalStudents}</p>
              </div>
              <div className="bg-white p-4 rounded border-2 border-green-400">
                <p className="text-xs text-gray-600 mb-1">ارتقا صنف:</p>
                <p className="text-3xl font-bold text-green-800">{stats.successfulCount || 0}</p>
              </div>
              <div className="bg-white p-4 rounded border-2 border-yellow-300">
                <p className="text-xs text-gray-600 mb-1">مشروط:</p>
                <p className="text-3xl font-bold text-yellow-700">{stats.conditionalCount || 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-4 rounded border-2 border-red-300">
                <p className="text-xs text-gray-600 mb-1">محروم:</p>
                <p className="text-3xl font-bold text-red-700">
                  {stats.failedCount || 0}
                </p>
              </div>
              <div className="bg-white p-4 rounded border-2 border-gray-300">
                <p className="text-xs text-gray-600 mb-1">صفحات فهرست:</p>
                <p className="text-3xl font-bold text-gray-700">{pagesInList}</p>
                <p className="text-xs text-gray-500">({totalStudents}/25 per page)</p>
              </div>
              <div className="bg-white p-4 rounded border-2 border-gray-300">
                <p className="text-xs text-gray-600 mb-1">صفحات جدول:</p>
                <p className="text-3xl font-bold text-gray-700">{pagesInTable}</p>
                <p className="text-xs text-gray-500">({totalStudents}/7 per page)</p>
              </div>
            </div>

            {/* Teacher Notes Text Area */}
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ملاحظات اضافی (Additional Notes):
              </label>
              <textarea
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Enter class teacher's notes here..."
                value={teacherNotes}
                onChange={(e) => setTeacherNotes(e.target.value)}
                disabled={!editable}
              />
            </div>
          </div>

          {/* Section 2: 3-Member Committee Verification */}
          <div className="mb-8 border-2 border-purple-300 rounded-lg p-6 bg-purple-50">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="material-icons text-purple-600">how_to_reg</span>
              نظر هیئت سه نفری لیسه مربوطه (3-Member Committee Verification)
            </h2>

            <div className="mb-4 bg-white p-4 rounded border border-purple-200">
              <p className="text-sm font-semibold mb-2">
                جدول نتایج <span className="text-purple-700">{classInfo.className}</span> - سال تعلیمی: 1404 هجري شمسي
              </p>
              <p className="text-sm text-gray-700">
                تمام معلومات مندرج جدول نتایج متذکره با شقه ها، جدول نتایج صنف قبلی و اسناد لازم با درک مسؤلیت حال و آینده تدقیق و تطبیق گردید، که شرح احصائیه ان قرار ذیل می‌باشد:
              </p>
            </div>

            {/* Committee Review Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white p-4 rounded border-2 border-blue-300">
                <p className="text-xs text-gray-600 mb-1">تعداد داخله:</p>
                <p className="text-2xl font-bold text-blue-700">{totalStudents}</p>
              </div>
              <div className="bg-white p-4 rounded border-2 border-green-300">
                <p className="text-xs text-gray-600 mb-1">شامل امتحان:</p>
                <p className="text-2xl font-bold text-green-700">{totalStudents}</p>
              </div>
              <div className="bg-white p-4 rounded border-2 border-green-400">
                <p className="text-xs text-gray-600 mb-1">ارتقا صنف:</p>
                <p className="text-2xl font-bold text-green-800">{stats.successfulCount || 0}</p>
              </div>
              <div className="bg-white p-4 rounded border-2 border-yellow-300">
                <p className="text-xs text-gray-600 mb-1">مشروط:</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.conditionalCount || 0}</p>
              </div>
            </div>

            {/* Committee Notes */}
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ملاحظات هیئت (Committee Notes):
              </label>
              <textarea
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                rows={3}
                placeholder="Enter committee verification notes..."
                value={committeeNotes}
                onChange={(e) => setCommitteeNotes(e.target.value)}
                disabled={!editable}
              />
            </div>

            {/* Committee Signatures */}
            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-700 mb-3">امضای اعضای هیئت (Committee Signatures):</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded border-2 border-gray-300">
                  <p className="text-xs text-gray-600 mb-2">عضو اول (Member 1):</p>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2 bg-gray-50"
                    value={headerFields.committeeFirst || ''}
                    readOnly
                    disabled
                  />
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                    disabled
                  />
                  <div className="h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-xs text-gray-400">
                    Signature
                  </div>
                </div>
                <div className="bg-white p-4 rounded border-2 border-gray-300">
                  <p className="text-xs text-gray-600 mb-2">عضو دوم (Member 2):</p>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2 bg-gray-50"
                    value={headerFields.committeeSecond || ''}
                    readOnly
                    disabled
                  />
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                    disabled
                  />
                  <div className="h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-xs text-gray-400">
                    Signature
                  </div>
                </div>
                <div className="bg-white p-4 rounded border-2 border-gray-300">
                  <p className="text-xs text-gray-600 mb-2">عضو سوم (Member 3):</p>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2 bg-gray-50"
                    value={headerFields.committeeThird || ''}
                    readOnly
                    disabled
                  />
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                    disabled
                  />
                  <div className="h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-xs text-gray-400">
                    Signature
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Official Stamp Area */}
          <div className="border-2 border-gray-400 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-bold text-center text-gray-800 mb-4">
              مهر رسمی و تصدیق نهائی (Official Stamp & Final Certification)
            </h3>
            <div className="h-32 border-4 border-dashed border-gray-400 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <span className="material-icons text-6xl mb-2">verified</span>
                <p className="text-sm">Official School Stamp Area</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Action Buttons */}
      {editable && (
        <div className="border-t bg-white p-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="material-icons text-sm align-middle mr-1">info</span>
            This page should be printed and attached to the grade documents
          </div>
          <div className="flex gap-3">
            <button className="px-6 py-2 bg-gray-100 border rounded hover:bg-gray-200 flex items-center gap-2">
              <span className="material-icons text-sm">print</span>
              Print Summary
            </button>
            <button className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2">
              <span className="material-icons text-sm">save</span>
              Save Notes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalSummarySheet;


