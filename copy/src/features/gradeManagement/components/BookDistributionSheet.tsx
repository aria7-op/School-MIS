import React, { useState, useEffect } from 'react';
import { AFGHAN_SUBJECTS } from '../constants/afghanSubjects';
import gradeManagementService from '../services/gradeManagementService';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Book Distribution Sheet - Matches Excel "لیست توزیع کتب" worksheet
 * Track textbook distribution to each student for each subject
 */
interface BookDistributionSheetProps {
  classId: string;
  examType: 'MIDTERM' | 'FINAL';
  editable?: boolean;
  onDataChange?: () => void;
}

const BookDistributionSheet: React.FC<BookDistributionSheetProps> = ({ classId, examType, editable }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [distribution, setDistribution] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [classInfo, setClassInfo] = useState<any>(null);

  useEffect(() => {
    loadStudents();
  }, [classId, examType]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await gradeManagementService.getExcelGradeSheetByType(classId, examType);
      setStudents(data.students || []);
      setClassInfo(data.classInfo);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDistribution = (studentId: string, subjectCode: string) => {
    const key = `${studentId}-${subjectCode}`;
    const newMap = new Map(distribution);
    newMap.set(key, !distribution.get(key));
    setDistribution(newMap);
  };

  const isDistributed = (studentId: string, subjectCode: string) => {
    return distribution.get(`${studentId}-${subjectCode}`) || false;
  };

  const getDistributionStats = () => {
    const totalBooks = students.length * AFGHAN_SUBJECTS.length;
    const distributedCount = Array.from(distribution.values()).filter(Boolean).length;
    const percentage = totalBooks > 0 ? ((distributedCount / totalBooks) * 100).toFixed(1) : '0';
    return { total: totalBooks, distributed: distributedCount, percentage };
  };

  const exportToExcel = async () => {
    try {
      setExporting(true);
      const stats = getDistributionStats();

      // Create workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('لیست توزیع کتب');

      // Set page setup for landscape A4
      worksheet.pageSetup = {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.5,
          right: 0.5,
          top: 0.75,
          bottom: 0.75,
          header: 0.3,
          footer: 0.3
        }
      };

      // Title Row
      worksheet.mergeCells('A1:F1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'لیست توزیع کتب - Book Distribution List';
      titleCell.font = { bold: true, size: 18, name: 'Arial' };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' }
      };
      titleCell.font = { ...titleCell.font, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).height = 35;

      // School Info Row
      worksheet.mergeCells('A2:F2');
      const schoolCell = worksheet.getCell('A2');
      schoolCell.value = `مکتب: ${classInfo?.className || 'N/A'} | سال تحصیلی: 1404 | تاریخ: ${new Date().toLocaleDateString()}`;
      schoolCell.font = { bold: true, size: 12 };
      schoolCell.alignment = { horizontal: 'center', vertical: 'middle' };
      schoolCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE5E7EB' }
      };
      worksheet.getRow(2).height = 25;

      // Statistics Row
      worksheet.mergeCells('A3:F3');
      const statsCell = worksheet.getCell('A3');
      statsCell.value = `Total Books: ${stats.total} | Distributed: ${stats.distributed} | Progress: ${stats.percentage}%`;
      statsCell.font = { bold: true, size: 11 };
      statsCell.alignment = { horizontal: 'center', vertical: 'middle' };
      statsCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFEF3C7' }
      };
      worksheet.getRow(3).height = 22;

      // Empty row
      worksheet.addRow([]);

      // Main Header Row 1
      const headerRow1 = worksheet.addRow([
        'شماره',
        'اسم شاگرد',
        'نمبر',
        ...Array(AFGHAN_SUBJECTS.length).fill('کتب مضامین - Subject Textbooks'),
        'مجموع',
        'تاریخ توزیع',
        'امضا شاگرد'
      ]);

      // Merge cells for "Subject Textbooks" header
      const subjectStartCol = 4;
      const subjectEndCol = 3 + AFGHAN_SUBJECTS.length;
      worksheet.mergeCells(5, subjectStartCol, 5, subjectEndCol);

      // Style header row 1
      headerRow1.height = 30;
      headerRow1.font = { bold: true, size: 11, name: 'Arial' };
      headerRow1.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      
      headerRow1.eachCell((cell, colNumber) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: colNumber >= subjectStartCol && colNumber <= subjectEndCol ? 'FF3B82F6' : 'FF1F2937' }
        };
        cell.font = { ...cell.font, color: { argb: 'FFFFFFFF' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });

      // Subject Names Header Row 2
      const headerRow2 = worksheet.addRow([
        '#',
        'Student Name',
        'Roll #',
        ...AFGHAN_SUBJECTS.map(s => `${s.name}\n${s.code}`),
        'Total',
        'Distribution Date',
        'Student Signature'
      ]);

      // Style header row 2
      headerRow2.height = 40;
      headerRow2.font = { bold: true, size: 9, name: 'Arial' };
      headerRow2.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      
      headerRow2.eachCell((cell, colNumber) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: colNumber >= subjectStartCol && colNumber <= subjectEndCol ? 'FF60A5FA' : 'FF374151' }
        };
        cell.font = { ...cell.font, color: { argb: 'FFFFFFFF' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });

      // Data Rows
      students.forEach((student, index) => {
        const distributedCount = AFGHAN_SUBJECTS.filter(s => 
          isDistributed(student.studentId, s.code)
        ).length;
        const allDistributed = distributedCount === AFGHAN_SUBJECTS.length;

        const subjectDistribution = AFGHAN_SUBJECTS.map(subject => 
          isDistributed(student.studentId, subject.code) ? '✓' : '✗'
        );

        const dataRow = worksheet.addRow([
          index + 1,
          student.name,
          student.rollNo || '-',
          ...subjectDistribution,
          `${distributedCount}/${AFGHAN_SUBJECTS.length}`,
          '', // Date column - empty for manual entry
          '' // Signature column - empty for manual signature
        ]);

        // Style data row
        dataRow.height = 25;
        dataRow.alignment = { horizontal: 'center', vertical: 'middle' };
        dataRow.font = { size: 10, name: 'Arial' };

        dataRow.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
          };

          // Zebra striping
          if (index % 2 === 1) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: allDistributed ? 'FFDCFCE7' : 'FFF9FAFB' }
            };
          } else if (allDistributed) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFBBF7D0' }
            };
          }

          // Student name - left align
          if (colNumber === 2) {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
            cell.font = { ...cell.font, bold: true };
          }

          // Checkmark columns - color code
          if (colNumber >= subjectStartCol && colNumber <= subjectEndCol) {
            if (cell.value === '✓') {
              cell.font = { ...cell.font, color: { argb: 'FF10B981' }, bold: true, size: 14 };
            } else {
              cell.font = { ...cell.font, color: { argb: 'FFEF4444' }, bold: true, size: 12 };
            }
          }

          // Total column
          if (colNumber === subjectEndCol + 1) {
            cell.font = { ...cell.font, bold: true };
            if (allDistributed) {
              cell.font = { ...cell.font, color: { argb: 'FF059669' } };
            }
          }
        });
      });

      // Summary Row
      const summaryRow = worksheet.addRow([
        '',
        '',
        'مجموع کل - Grand Total:',
        ...AFGHAN_SUBJECTS.map((subject) => {
          const subjectTotal = students.filter(s => 
            isDistributed(s.studentId, subject.code)
          ).length;
          return subjectTotal;
        }),
        stats.distributed,
        '',
        ''
      ]);

      // Style summary row
      summaryRow.height = 30;
      summaryRow.font = { bold: true, size: 11, name: 'Arial' };
      summaryRow.alignment = { horizontal: 'center', vertical: 'middle' };
      
      summaryRow.eachCell((cell, colNumber) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFDBEAFE' }
        };
        cell.border = {
          top: { style: 'double', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'double', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
        if (colNumber >= subjectStartCol) {
          cell.font = { ...cell.font, color: { argb: 'FF1D4ED8' } };
        }
      });

      // Set column widths
      worksheet.getColumn(1).width = 8;   // شماره
      worksheet.getColumn(2).width = 25;  // اسم شاگرد
      worksheet.getColumn(3).width = 10;  // نمبر
      
      // Subject columns
      AFGHAN_SUBJECTS.forEach((_, index) => {
        worksheet.getColumn(4 + index).width = 8;
      });

      worksheet.getColumn(4 + AFGHAN_SUBJECTS.length).width = 12;     // مجموع
      worksheet.getColumn(5 + AFGHAN_SUBJECTS.length).width = 16;     // تاریخ توزیع
      worksheet.getColumn(6 + AFGHAN_SUBJECTS.length).width = 20;     // امضا شاگرد

      // Freeze panes (first 3 columns and first 6 rows)
      worksheet.views = [
        { state: 'frozen', xSplit: 3, ySplit: 6 }
      ];

      // Add footer notes
      const footerRow = worksheet.addRow([]);
      footerRow.height = 20;
      
      const notesRow = worksheet.addRow(['ملاحظات - Notes: طلاب باید برای دریافت کتب امضا نمایند - Students must sign for received books']);
      worksheet.mergeCells(notesRow.number, 1, notesRow.number, 6 + AFGHAN_SUBJECTS.length);
      notesRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      notesRow.getCell(1).font = { italic: true, size: 9, color: { argb: 'FF6B7280' } };
      notesRow.height = 25;

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const fileName = `Book_Distribution_${classInfo?.className || 'Class'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(blob, fileName);

    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export Excel file. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const stats = getDistributionStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading book distribution...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="material-icons text-5xl">menu_book</span>
            <div>
              <h2 className="text-2xl font-bold">لیست توزیع کتب - Book Distribution List</h2>
              <p className="text-blue-100">Track textbook distribution to students</p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-white/20 rounded-lg p-4">
              <p className="text-sm text-blue-100">Distribution Progress</p>
              <p className="text-3xl font-bold">{stats.percentage}%</p>
              <p className="text-xs text-blue-100">{stats.distributed}/{stats.total} books</p>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 m-4">
        <div className="flex items-center gap-2">
          <span className="material-icons text-yellow-600">info</span>
          <div className="text-sm">
            <p className="font-semibold text-yellow-800">رهنمود - Instructions:</p>
            <p className="text-yellow-700">
              Click checkboxes to mark books as distributed. Each student should receive one textbook per subject.
              Have students sign for received books.
            </p>
          </div>
        </div>
      </div>

      {/* Distribution Table */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th rowSpan={2} className="px-4 py-3 border border-gray-600 sticky left-0 bg-gray-800 z-20">
                  شماره<br/>#
                </th>
                <th rowSpan={2} className="px-6 py-3 border border-gray-600 sticky left-12 bg-gray-800 z-20">
                  اسم شاگرد<br/>Student Name
                </th>
                <th rowSpan={2} className="px-4 py-3 border border-gray-600">
                  نمبر<br/>Roll #
                </th>
                <th colSpan={AFGHAN_SUBJECTS.length} className="px-4 py-2 border border-gray-600 bg-blue-700">
                  کتب مضامین - Subject Textbooks
                </th>
                <th rowSpan={2} className="px-4 py-3 border border-gray-600 bg-gray-700">
                  مجموع<br/>Total
                </th>
                <th rowSpan={2} className="px-6 py-3 border border-gray-600 bg-gray-700">
                  تاریخ توزیع<br/>Distribution Date
                </th>
                <th rowSpan={2} className="px-6 py-3 border border-gray-600 bg-gray-700">
                  امضا شاگرد<br/>Student Signature
                </th>
              </tr>
              <tr className="bg-gray-700 text-white">
                {AFGHAN_SUBJECTS.map((subject) => (
                  <th key={subject.code} className="px-2 py-2 border border-gray-600 text-xs">
                    {subject.name}<br/>
                    <span className="text-[10px] text-gray-300">{subject.code}</span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {students.map((student, index) => {
                const distributedCount = AFGHAN_SUBJECTS.filter(s => 
                  isDistributed(student.studentId, s.code)
                ).length;
                const allDistributed = distributedCount === AFGHAN_SUBJECTS.length;

                return (
                  <tr 
                    key={student.studentId}
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${
                      allDistributed ? 'bg-green-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-center border font-semibold sticky left-0 bg-inherit z-10">
                      {index + 1}
                    </td>
                    <td className="px-6 py-3 border sticky left-12 bg-inherit z-10 font-medium">
                      {student.name}
                    </td>
                    <td className="px-4 py-3 text-center border text-gray-600">
                      {student.rollNo || '-'}
                    </td>

                    {/* Checkboxes for each subject */}
                    {AFGHAN_SUBJECTS.map((subject) => (
                      <td key={subject.code} className="px-2 py-2 text-center border">
                        <input
                          type="checkbox"
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          checked={isDistributed(student.studentId, subject.code)}
                          onChange={() => toggleDistribution(student.studentId, subject.code)}
                          disabled={!editable}
                        />
                      </td>
                    ))}

                    <td className={`px-4 py-3 text-center border font-bold ${
                      allDistributed ? 'text-green-700 bg-green-100' : 'text-gray-700'
                    }`}>
                      {distributedCount}/{AFGHAN_SUBJECTS.length}
                    </td>
                    <td className="px-6 py-3 border">
                      <input
                        type="date"
                        className="w-full px-2 py-1 border rounded text-sm"
                        disabled={!editable || !allDistributed}
                      />
                    </td>
                    <td className="px-6 py-3 border">
                      <div className="border-b border-dashed border-gray-400 py-2 text-center text-xs text-gray-400">
                        {allDistributed ? 'امضاء' : ''}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Summary Row */}
              <tr className="bg-blue-100 font-bold border-t-2 border-gray-800">
                <td colSpan={3} className="px-6 py-3 border text-right">
                  مجموع کل - Grand Total:
                </td>
                {AFGHAN_SUBJECTS.map((subject) => {
                  const subjectTotal = students.filter(s => 
                    isDistributed(s.studentId, subject.code)
                  ).length;
                  return (
                    <td key={subject.code} className="px-2 py-2 text-center border text-blue-700">
                      {subjectTotal}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-center border text-blue-700">
                  {stats.distributed}
                </td>
                <td colSpan={2} className="border"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      {editable && (
        <div className="border-t bg-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.print()}
              className="px-4 py-2 bg-gray-100 border rounded hover:bg-gray-200 flex items-center gap-2 transition-colors"
            >
              <span className="material-icons text-sm">print</span>
              Print Distribution List
            </button>
            <button 
              onClick={exportToExcel}
              disabled={exporting}
              className="px-4 py-2 bg-green-600 text-white border rounded hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <span className="material-icons text-sm">download</span>
                  <span>Export to Excel</span>
                </>
              )}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 transition-colors">
              <span className="material-icons text-sm">save</span>
              Save Distribution
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookDistributionSheet;