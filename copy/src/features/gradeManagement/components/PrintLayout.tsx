import React from 'react';
import { useStudentListHeaderFields } from '../context/StudentListHeaderContext';

/**
 * Print Layout Component - Excel Print Preview
 * Handles page breaks, headers, footers for printing
 */
interface PrintLayoutProps {
  children: React.ReactNode;
  title: string;
  classInfo?: any;
  showHeader?: boolean;
  showFooter?: boolean;
}

const PrintLayout: React.FC<PrintLayoutProps> = ({
  children,
  title,
  classInfo,
  showHeader = true,
  showFooter = true
}) => {
  const headerFields = useStudentListHeaderFields();
  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 1cm;
          }
          
          .no-print {
            display: none !important;
          }
          
          .page-break {
            page-break-after: always;
          }
          
          table {
            page-break-inside: avoid;
          }
          
          thead {
            display: table-header-group;
          }
          
          tfoot {
            display: table-footer-group;
          }
          
          .print-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: white;
          }
          
          .print-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
          }
        }
      `}</style>

      <div className="print-container">
        {/* Print Header */}
        {showHeader && (
          <div className="print-header border-b-2 border-gray-800 pb-3 mb-4 no-screen">
            <div className="text-center mb-2">
              <h1 className="text-2xl font-bold">وزارت معارف امارت اسلامی افغانستان</h1>
              <h2 className="text-lg font-semibold">Ministry of Education - Islamic Emirate of Afghanistan</h2>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm mt-3">
              <div className="text-right">
                <p>ریاست معارف: _______________</p>
                <p>امریت معارف: _______________</p>
              </div>
              <div className="text-center font-bold">
                <p className="text-lg">{title}</p>
                {classInfo && (
                  <p className="text-base mt-1">
                    صنف: {classInfo.className} - {classInfo.section || 'همه'}
                  </p>
                )}
              </div>
              <div className="text-left">
                <p>سال تعلیمی: 1404 هجري شمسي</p>
                <p>تاریخ: _______________</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="print-content">
          {children}
        </div>

        {/* Print Footer */}
        {showFooter && (
          <div className="print-footer border-t-2 border-gray-800 pt-3 mt-6 no-screen">
            <div className="grid grid-cols-3 gap-6 text-sm">
              <div className="text-center">
                <div className="border-t-2 border-gray-800 pt-2 mt-12">
                  <p className="font-semibold">نگران صنف</p>
                  <p className="text-xs text-gray-600">Class Teacher</p>
                  <p className="text-xs mt-1">
                    امضاء و نام: {headerFields.supervisorName || '----------------'}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-gray-800 pt-2 mt-12">
                  <p className="font-semibold">مدیر تدریسی</p>
                  <p className="text-xs text-gray-600">Academic Director</p>
                  <p className="text-xs mt-1">
                    امضاء و نام: {headerFields.academicManagerName || '----------------'}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-gray-800 pt-2 mt-12">
                  <p className="font-semibold">امر مکتب</p>
                  <p className="text-xs text-gray-600">Principal</p>
                  <p className="text-xs mt-1">
                    امضاء و نام: {headerFields.principalName || '----------------'}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-center mt-4 text-xs text-gray-500">
              <p>Page <span className="page-number"></span> | Generated: {new Date().toLocaleDateString('fa-AF')}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PrintLayout;





