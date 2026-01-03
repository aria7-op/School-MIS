import React, { useState, useEffect } from 'react';
import { AFGHAN_SUBJECTS } from '../constants/afghanSubjects';
import gradeManagementService from '../services/gradeManagementService';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';

/**
 * Statistics Sheet - Comprehensive class performance analytics
 * Matches Excel statistical analysis patterns
 */
interface StatisticsSheetProps {
  classId: string;
  examType: 'MIDTERM' | 'FINAL';
  editable?: boolean;
  onDataChange?: () => void;
}

const StatisticsSheet: React.FC<StatisticsSheetProps> = ({ classId, examType }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, [classId, examType]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const midtermData = await gradeManagementService.getExcelGradeSheetByType(classId, 'MIDTERM');
      const annualData = await gradeManagementService.getExcelGradeSheetByType(classId, 'FINAL');
      
      // Calculate comprehensive statistics
      const statistics = {
        midterm: midtermData.classStatistics,
        annual: annualData.classStatistics,
        totalStudents: midtermData.students?.length || 0,
        subjects: AFGHAN_SUBJECTS.length,
        classInfo: midtermData.classInfo
      };
      
      setStats(statistics);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    if (!stats) {
      alert('No data available to export');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'School Management System';
      workbook.created = new Date();

      // Color scheme
      const headerFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF4472C4' } };
      const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      const subHeaderFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFD9E1F2' } };
      const borderStyle = { style: 'thin' as const, color: { argb: 'FF4472C4' } };

      // ==================== OVERVIEW SHEET ====================
      const overviewSheet = workbook.addWorksheet('Statistics Overview');
      overviewSheet.columns = [
        { key: 'metric', width: 30 },
        { key: 'value', width: 20 },
        { key: 'description', width: 40 }
      ];

      const overviewHeader = overviewSheet.addRow(['Metric', 'Value', 'Description']);
      overviewHeader.font = headerFont;
      overviewHeader.fill = headerFill;
      overviewHeader.alignment = { horizontal: 'center', vertical: 'middle' };
      overviewHeader.height = 25;

      const overviewData = [
        { metric: 'Class Name', value: stats.classInfo.className, description: 'نام صنف' },
        { metric: 'Total Students', value: stats.totalStudents, description: 'مجموع شاگردان' },
        { metric: 'Total Subjects', value: stats.subjects, description: 'مجموع مضامین' },
        { metric: '', value: '', description: '' },
        { metric: 'MIDTERM STATISTICS', value: '', description: 'آمار چهارونیم ماهه' },
        { metric: 'Successful', value: `${stats.midterm.successfulCount} (${stats.midterm.successPercentage}%)`, description: 'موفق' },
        { metric: 'Conditional', value: `${stats.midterm.conditionalCount} (${stats.midterm.conditionalPercentage}%)`, description: 'مشروط' },
        { metric: 'Failed', value: `${stats.midterm.failedCount} (${stats.midterm.failPercentage}%)`, description: 'ناکام' },
        { metric: 'Class Average', value: stats.midterm.classAverageMarks?.toFixed(2), description: 'اوسط صنف' },
        { metric: 'Highest Score', value: stats.midterm.highestTotal?.toFixed(2), description: 'بلند ترین نمره' },
        { metric: 'Lowest Score', value: stats.midterm.lowestTotal?.toFixed(2), description: 'پایین ترین نمره' },
        { metric: '', value: '', description: '' },
        { metric: 'ANNUAL STATISTICS', value: '', description: 'آمار سالانه' },
        { metric: 'Successful', value: `${stats.annual.successfulCount} (${stats.annual.successPercentage}%)`, description: 'موفق' },
        { metric: 'Conditional', value: `${stats.annual.conditionalCount} (${stats.annual.conditionalPercentage}%)`, description: 'مشروط' },
        { metric: 'Failed', value: `${stats.annual.failedCount} (${stats.annual.failPercentage}%)`, description: 'ناکام' },
        { metric: 'Class Average', value: stats.annual.classAverageMarks?.toFixed(2), description: 'اوسط صنف' },
        { metric: 'Highest Score', value: stats.annual.highestTotal?.toFixed(2), description: 'بلند ترین نمره' },
        { metric: 'Lowest Score', value: stats.annual.lowestTotal?.toFixed(2), description: 'پایین ترین نمره' }
      ];

      overviewData.forEach((data) => {
        const row = overviewSheet.addRow(data);
        row.alignment = { vertical: 'middle' };
        
        if (data.metric.includes('STATISTICS')) {
          row.font = { bold: true };
          row.fill = subHeaderFill;
        }
        
        row.eachCell((cell) => {
          cell.border = {
            top: borderStyle,
            left: borderStyle,
            bottom: borderStyle,
            right: borderStyle
          };
        });
      });

      // ==================== COMPARISON SHEET ====================
      const comparisonSheet = workbook.addWorksheet('Midterm vs Annual');
      comparisonSheet.columns = [
        { key: 'metric', width: 30 },
        { key: 'midterm', width: 20 },
        { key: 'annual', width: 20 }
      ];

      const compHeader = comparisonSheet.addRow(['Metric', 'Midterm', 'Annual']);
      compHeader.font = headerFont;
      compHeader.fill = headerFill;
      compHeader.alignment = { horizontal: 'center', vertical: 'middle' };
      compHeader.height = 25;

      const comparisonData = [
        { metric: 'Class Average', midterm: stats.midterm.classAverageMarks?.toFixed(2), annual: stats.annual.classAverageMarks?.toFixed(2) },
        { metric: 'Highest Total', midterm: stats.midterm.highestTotal?.toFixed(2), annual: stats.annual.highestTotal?.toFixed(2) },
        { metric: 'Lowest Total', midterm: stats.midterm.lowestTotal?.toFixed(2), annual: stats.annual.lowestTotal?.toFixed(2) },
        { metric: 'Pass Rate (%)', midterm: stats.midterm.successPercentage, annual: stats.annual.successPercentage },
        { metric: 'Successful Count', midterm: stats.midterm.successfulCount, annual: stats.annual.successfulCount },
        { metric: 'Conditional Count', midterm: stats.midterm.conditionalCount, annual: stats.annual.conditionalCount },
        { metric: 'Failed Count', midterm: stats.midterm.failedCount, annual: stats.annual.failedCount }
      ];

      comparisonData.forEach((data, index) => {
        const row = comparisonSheet.addRow(data);
        row.alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
        
        if (index % 2 === 0) {
          row.fill = subHeaderFill;
        }
        
        row.eachCell((cell) => {
          cell.border = {
            top: borderStyle,
            left: borderStyle,
            bottom: borderStyle,
            right: borderStyle
          };
        });
      });

      // ==================== SUMMARY SHEET ====================
      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.columns = [
        { key: 'formula', width: 20 },
        { key: 'value', width: 20 },
        { key: 'description', width: 35 }
      ];

      const summaryHeader = summarySheet.addRow(['Formula', 'Value', 'Description']);
      summaryHeader.font = headerFont;
      summaryHeader.fill = headerFill;
      summaryHeader.alignment = { horizontal: 'center', vertical: 'middle' };
      summaryHeader.height = 25;

      const summaryData = [
        { formula: 'COUNT', value: stats.totalStudents, description: 'Total Records' },
        { formula: 'COUNTIF', value: stats.midterm.successfulCount, description: 'Midterm Passed' },
        { formula: 'AVERAGE', value: stats.midterm.classAverageMarks?.toFixed(1), description: 'Midterm Average' },
        { formula: 'MAX', value: stats.midterm.highestTotal?.toFixed(1), description: 'Midterm Highest' },
        { formula: 'MIN', value: stats.midterm.lowestTotal?.toFixed(1), description: 'Midterm Lowest' },
        { formula: 'COUNTIF', value: stats.annual.successfulCount, description: 'Annual Passed' },
        { formula: 'AVERAGE', value: stats.annual.classAverageMarks?.toFixed(1), description: 'Annual Average' },
        { formula: 'MAX', value: stats.annual.highestTotal?.toFixed(1), description: 'Annual Highest' }
      ];

      summaryData.forEach((data, index) => {
        const row = summarySheet.addRow(data);
        row.alignment = { vertical: 'middle', horizontal: 'center' };
        
        if (index % 2 === 0) {
          row.fill = subHeaderFill;
        }
        
        row.eachCell((cell) => {
          cell.border = {
            top: borderStyle,
            left: borderStyle,
            bottom: borderStyle,
            right: borderStyle
          };
        });
      });

      // Save file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fileName = `Statistics_${stats.classInfo.className}_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(blob, fileName);

      alert('Statistics exported successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Calculating statistics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div className="p-12 text-center text-red-600">Failed to load statistics</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-auto">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <span className="material-icons text-6xl">analytics</span>
          <div>
            <h2 className="text-3xl font-bold">آمار - Statistics Dashboard</h2>
            <p className="text-purple-100">Comprehensive class performance analytics</p>
            <p className="text-sm text-purple-200 mt-1">
              Class: {stats.classInfo.className} | Students: {stats.totalStudents} | Subjects: {stats.subjects}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Overall Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalStudents}</p>
                <p className="text-xs text-gray-500 mt-1">مجموع شاگردان</p>
              </div>
              <span className="material-icons text-5xl text-blue-200">groups</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Successful (موفق)</p>
                <p className="text-3xl font-bold text-green-600">{stats.midterm.successfulCount}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.midterm.successPercentage}%</p>
              </div>
              <span className="material-icons text-5xl text-green-200">emoji_events</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conditional (مشروط)</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.midterm.conditionalCount}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.midterm.conditionalPercentage}%</p>
              </div>
              <span className="material-icons text-5xl text-yellow-200">warning</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed (ناکام)</p>
                <p className="text-3xl font-bold text-red-600">{stats.midterm.failedCount}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.midterm.failPercentage}%</p>
              </div>
              <span className="material-icons text-5xl text-red-200">cancel</span>
            </div>
          </div>
        </div>

        {/* Comparison: Midterm vs Annual */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="material-icons text-indigo-600">compare_arrows</span>
            Midterm vs Annual Comparison
          </h3>
          <div className="grid grid-cols-2 gap-6">
            {/* Midterm Column */}
            <div className="border-r border-gray-200 pr-6">
              <h4 className="text-lg font-semibold text-blue-600 mb-4">
                چهارونیم ماهه (Midterm)
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Class Average:</span>
                  <span className="font-bold text-blue-600">{stats.midterm.classAverageMarks?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Highest Total:</span>
                  <span className="font-bold text-green-600">{stats.midterm.highestTotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Lowest Total:</span>
                  <span className="font-bold text-red-600">{stats.midterm.lowestTotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Pass Rate:</span>
                  <span className="font-bold text-indigo-600">{stats.midterm.successPercentage}%</span>
                </div>
              </div>
            </div>

            {/* Annual Column */}
            <div className="pl-6">
              <h4 className="text-lg font-semibold text-green-600 mb-4">
                سالانه (Annual)
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Class Average:</span>
                  <span className="font-bold text-blue-600">{stats.annual.classAverageMarks?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Highest Total:</span>
                  <span className="font-bold text-green-600">{stats.annual.highestTotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Lowest Total:</span>
                  <span className="font-bold text-red-600">{stats.annual.lowestTotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Pass Rate:</span>
                  <span className="font-bold text-indigo-600">{stats.annual.successPercentage}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subject-wise Performance */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="material-icons text-orange-600">subject</span>
            Subject-wise Performance (نتایج مضمونوار)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-right">#</th>
                  <th className="px-4 py-3 text-right">Subject (مضمون)</th>
                  <th className="px-4 py-3 text-center">Code</th>
                  <th className="px-4 py-3 text-center">Credit Hours</th>
                  <th className="px-4 py-3 text-center">Mid Avg</th>
                  <th className="px-4 py-3 text-center">Annual Avg</th>
                  <th className="px-4 py-3 text-center">Overall Avg</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {AFGHAN_SUBJECTS.map((subject, index) => {
                  const midAvg = 85 + Math.random() * 10; // Mock data
                  const annAvg = 87 + Math.random() * 10;
                  const overall = (midAvg + annAvg) / 2;
                  const status = overall >= 90 ? 'Excellent' : overall >= 75 ? 'Good' : overall >= 50 ? 'Average' : 'Needs Improvement';
                  const statusColor = overall >= 90 ? 'text-green-600 bg-green-50' : overall >= 75 ? 'text-blue-600 bg-blue-50' : overall >= 50 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50';

                  return (
                    <tr key={subject.code} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-center font-semibold">{index + 1}</td>
                      <td className="px-4 py-3 font-medium">{subject.name}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{subject.code}</td>
                      <td className="px-4 py-3 text-center">{subject.creditHours}</td>
                      <td className="px-4 py-3 text-center font-semibold text-blue-600">
                        {midAvg.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-green-600">
                        {annAvg.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-indigo-600">
                        {overall.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-center font-semibold ${statusColor}`}>
                        {status}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Distribution Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="material-icons text-teal-600">bar_chart</span>
            Performance Distribution
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-5xl font-bold text-green-600 mb-2">
                {stats.midterm.successPercentage}%
              </div>
              <p className="text-gray-700 font-semibold">موفق (Successful)</p>
              <p className="text-sm text-gray-600 mt-1">{stats.midterm.successfulCount} students</p>
              <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                <div
                  className="bg-green-600 h-3 rounded-full"
                  style={{ width: `${stats.midterm.successPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="text-center p-6 bg-yellow-50 rounded-lg">
              <div className="text-5xl font-bold text-yellow-600 mb-2">
                {stats.midterm.conditionalPercentage}%
              </div>
              <p className="text-gray-700 font-semibold">مشروط (Conditional)</p>
              <p className="text-sm text-gray-600 mt-1">{stats.midterm.conditionalCount} students</p>
              <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                <div
                  className="bg-yellow-600 h-3 rounded-full"
                  style={{ width: `${stats.midterm.conditionalPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="text-center p-6 bg-red-50 rounded-lg">
              <div className="text-5xl font-bold text-red-600 mb-2">
                {stats.midterm.failPercentage}%
              </div>
              <p className="text-gray-700 font-semibold">ناکام (Failed)</p>
              <p className="text-sm text-gray-600 mt-1">{stats.midterm.failedCount} students</p>
              <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                <div
                  className="bg-red-600 h-3 rounded-full"
                  style={{ width: `${stats.midterm.failPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Excel-style Summary */}
        <div className="bg-gray-100 rounded-lg shadow-lg p-6 border-2 border-gray-300">
          <h3 className="text-xl font-bold mb-4 text-center">خلاصه آمار (Summary Statistics)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-600">Formula: COUNT</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalStudents}</p>
              <p className="text-xs text-gray-600 mt-1">Total Records</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Formula: COUNTIF</p>
              <p className="text-2xl font-bold text-green-600">{stats.midterm.successfulCount}</p>
              <p className="text-xs text-gray-600 mt-1">Passed</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Formula: AVERAGE</p>
              <p className="text-2xl font-bold text-blue-600">{stats.midterm.classAverageMarks?.toFixed(1)}</p>
              <p className="text-xs text-gray-600 mt-1">Class Average</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Formula: MAX</p>
              <p className="text-2xl font-bold text-purple-600">{stats.midterm.highestTotal?.toFixed(1)}</p>
              <p className="text-xs text-gray-600 mt-1">Highest Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t bg-white p-4 flex justify-end gap-3">
        <button 
          onClick={() => window.print()}
          className="px-6 py-2 bg-gray-100 border rounded hover:bg-gray-200 flex items-center gap-2"
        >
          <span className="material-icons text-sm">print</span>
          Print Statistics
        </button>
        <button 
          onClick={exportToExcel}
          className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"
        >
          <span className="material-icons text-sm">download</span>
          Export Report
        </button>
      </div>
    </div>
  );
};

export default StatisticsSheet;