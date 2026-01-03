import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ExcelGradeSheet from './ExcelGradeSheet';
import StudentListSheet from './StudentListSheet';
import StudentReportCard from './StudentReportCard';
import SubjectWiseAnalysis from './SubjectWiseAnalysis';
import ResultsTableList from './ResultsTableList';
import SuccessfulStudentsList from './SuccessfulStudentsList';
import ConditionalStudentsList from './ConditionalStudentsList';
import FailedStudentsList from './FailedStudentsList';
import BookDistributionSheet from './BookDistributionSheet';
import StatisticsSheet from './StatisticsSheet';
import SignatureWorkflowSheet from './SignatureWorkflowSheet';
import FinalSummarySheet from './FinalSummarySheet';
import CoverPageSheet from './CoverPageSheet';
import gradeManagementService from '../services/gradeManagementService';
import StudentListHeaderContext, {
  DEFAULT_HEADER_DATA,
  HEADER_FIELD_DEFAULTS,
  StudentListHeaderData,
} from '../context/StudentListHeaderContext';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * Excel Workbook Component
 * Replicates ALL 12 worksheets from the Excel file:
 * جدول نتایج صنوف اول الی ششم - 1404 - تعلیمات عمومی.xlsx
 */
interface ExcelWorkbookProps {
  classId: string;
  examType: 'MIDTERM' | 'FINAL';
  editable?: boolean;
  initialSheet?: string;
  selectedSubjectName?: string | null;
}

const ExcelWorkbook: React.FC<ExcelWorkbookProps> = ({
  classId,
  examType,
  editable = false,
  initialSheet = 'grades',
  selectedSubjectName,
}) => {
  const { user } = useAuth();
  const [activeSheet, setActiveSheet] = useState(initialSheet);
  useEffect(() => {
    setActiveSheet(initialSheet);
  }, [initialSheet, classId, examType]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [headerData, setHeaderData] = useState<StudentListHeaderData>(() => ({
    attendanceThreshold: DEFAULT_HEADER_DATA.attendanceThreshold,
    fields: { ...HEADER_FIELD_DEFAULTS },
  }));
  const [headerLoading, setHeaderLoading] = useState(false);

  const loadHeaderFromServer = useCallback(async () => {
    setHeaderLoading(true);
    try {
      const response = await gradeManagementService.getStudentListHeader(classId, examType);
      const resolvedFields = {
        ...HEADER_FIELD_DEFAULTS,
        ...(response?.fields || {}),
      };
      setHeaderData({
        attendanceThreshold: response?.attendanceThreshold ?? 99,
        fields: resolvedFields,
        updatedAt: response?.updatedAt,
      });
    } catch (error) {
      console.error('Failed to load student list header:', error);
      setHeaderData({
        attendanceThreshold: 99,
        fields: { ...HEADER_FIELD_DEFAULTS },
      });
    } finally {
      setHeaderLoading(false);
    }
  }, [classId, examType]);

  useEffect(() => {
    loadHeaderFromServer();
  }, [loadHeaderFromServer]);

  // Excel file has 12 worksheets - replicate them all
  const allWorksheets = [
    {
      id: 'list',
      name: 'لیست',
      nameEn: 'Student List',
      icon: 'list',
      description: 'Main student roster with attendance',
      component: StudentListSheet
    },
    {
      id: 'adminForms',
      name: 'شقه',
      nameEn: 'Admin Forms',
      icon: 'approval',
      description: 'Signature and approval workflow',
      component: SignatureWorkflowSheet
    },
    {
      id: 'grades',
      name: 'جدول نتایج',
      nameEn: 'Results Table',
      icon: 'table_chart',
      description: 'Core grade calculation engine with all formulas',
      component: ExcelGradeSheet
    },
    {
      id: 'reportCards',
      name: 'اطلاع نامه',
      nameEn: 'Report Cards',
      icon: 'description',
      description: 'Personalized student report cards with messages',
      component: StudentReportCard
    },
    {
      id: 'subjectWise',
      name: 'فهرست مضمونوار',
      nameEn: 'Subject Analysis',
      icon: 'subject',
      description: 'Subject-wise performance breakdown',
      component: SubjectWiseAnalysis
    },
    {
      id: 'successful',
      name: 'کامیاب',
      nameEn: 'Successful',
      icon: 'emoji_events',
      description: 'Honor roll - Auto-populated from results',
      component: SuccessfulStudentsList
    },
    {
      id: 'conditional',
      name: 'مشروط',
      nameEn: 'Conditional',
      icon: 'warning',
      description: 'Conditional pass - Auto-populated',
      component: ConditionalStudentsList
    },
    {
      id: 'failed',
      name: 'ناکام و محروم',
      nameEn: 'Failed/Absent',
      icon: 'cancel',
      description: 'Failed and absent - Auto-populated',
      component: FailedStudentsList
    },
    {
      id: 'books',
      name: 'لیست توزیع کتب',
      nameEn: 'Book Distribution',
      icon: 'menu_book',
      description: 'Track textbook distribution to students',
      component: BookDistributionSheet
    },
    {
      id: 'statistics',
      name: 'آمار',
      nameEn: 'Statistics',
      icon: 'analytics',
      description: 'Comprehensive class performance statistics',
      component: StatisticsSheet
    },
    {
      id: 'resultsList',
      name: 'فهرست جدول',
      nameEn: 'Results List',
      icon: 'format_list_numbered',
      description: 'Alternative results listing format',
      component: ResultsTableList
    },
    {
      id: 'finalSummary',
      name: 'ورق اخیر جدول',
      nameEn: 'Final Summary',
      icon: 'summarize',
      description: 'Administrative summary and approvals',
      component: FinalSummarySheet
    },
    {
      id: 'coverPage',
      name: 'پوش جدول',
      nameEn: 'Cover Page',
      icon: 'article',
      description: 'Official document cover page',
      component: CoverPageSheet
    }
  ];

  // Filter worksheets based on user role
  const worksheets = useMemo(() => {
    if (user?.role === 'TEACHER') {
      return allWorksheets.filter(ws => ws.id === 'adminForms');
    }
    return allWorksheets;
  }, [user?.role]);

  // Reset activeSheet if it's not in filtered worksheets
  useEffect(() => {
    if (worksheets.length > 0 && !worksheets.find(ws => ws.id === activeSheet)) {
      setActiveSheet(worksheets[0].id);
    }
  }, [worksheets, activeSheet]);

  const activeWorksheet = worksheets.find(ws => ws.id === activeSheet);
  const ActiveComponent = activeWorksheet?.component || ExcelGradeSheet;

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col bg-white">
      {/* Sticky Header Container - Tabs + Description Bar */}
      {/* This will scroll with content until it reaches viewport top, then sticks */}
      <div className="sticky top-0 z-50 bg-white shadow-lg">
        {/* Excel-like Tab Bar */}
        <div className="border-b border-gray-300 bg-gray-50">
          <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {worksheets.map((sheet) => (
              <button
                key={sheet.id}
                onClick={() => setActiveSheet(sheet.id)}
                className={`
                  px-4 py-3 min-w-[180px] border-r border-gray-300 text-sm font-medium
                  transition-colors relative group flex-shrink-0
                  ${activeSheet === sheet.id
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
                title={sheet.description}
              >
                <div className="flex items-center gap-2 justify-center">
                  <span className="material-icons text-base">{sheet.icon}</span>
                  <div className="text-left">
                    <div className="font-semibold">{sheet.nameEn}</div>
                    <div className="text-xs text-gray-500">{sheet.name}</div>
                  </div>
                </div>
                
                {/* Excel-like active indicator */}
                {activeSheet === sheet.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Sheet Description Bar */}
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-icons text-blue-600">{activeWorksheet?.icon}</span>
            <div>
              <span className="text-sm font-semibold text-blue-900">{activeWorksheet?.nameEn}</span>
              <span className="text-xs text-blue-600 ml-2">({activeWorksheet?.name})</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-700">{activeWorksheet?.description}</span>
            <button
              onClick={handleRefresh}
              className="p-1 hover:bg-blue-100 rounded"
              title="Refresh"
            >
              <span className="material-icons text-sm text-blue-600">refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Sheet Content - Ensure it has enough height to scroll */}
      <StudentListHeaderContext.Provider
        value={{
          classId,
          examType,
          headerData,
          loading: headerLoading,
          refresh: loadHeaderFromServer,
          setLocalHeaderData: (updater) => {
            setHeaderData((prev) => updater(prev));
          },
        }}
      >
        <div className="min-h-[calc(100vh-400px)] pb-12">
          <ActiveComponent
            key={refreshKey}
            classId={classId}
            examType={examType}
            editable={editable}
            onDataChange={handleRefresh}
            {...(activeSheet === 'adminForms' && { selectedSubjectName })}
          />
        </div>
      </StudentListHeaderContext.Provider>

      {/* Excel-like Status Bar */}
      <div className="bg-gray-100 border-t border-gray-300 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className="text-gray-600">
            Class: <span className="font-semibold">Class {classId}</span>
          </span>
          <span className="text-gray-600">
            Exam: <span className="font-semibold">{examType === 'MIDTERM' ? 'Mid-term (چهارونیم ماهه)' : 'Final (امتحان سالانه)'}</span>
          </span>
          <span className="text-gray-600">
            Year: <span className="font-semibold">1404 هجري شمسي</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <span className="material-icons text-xs">info</span>
          <span>All Excel formulas calculate automatically</span>
        </div>
      </div>
    </div>
  );
};

export default ExcelWorkbook;

