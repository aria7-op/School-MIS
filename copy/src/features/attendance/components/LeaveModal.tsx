import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaSearch, FaTimes, FaPrint, FaUser, FaCalendarAlt, FaFileAlt } from 'react-icons/fa';
import { Student } from '../types/attendance';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onMarkLeave: (studentId: string, reason: string, date: string, leaveDocument?: File) => Promise<void>;
  selectedDate?: string;
  loading?: boolean;
  studentsLoading?: boolean;
  classNameFallback?: string;
  classCodeFallback?: string;
  onSeeMore?: () => void;
  onSearchChange?: (query: string) => void;
}

const LeaveModal: React.FC<LeaveModalProps> = ({
  isOpen,
  onClose,
  students,
  onMarkLeave,
  selectedDate,
  loading = false,
  studentsLoading = false,
  classNameFallback,
  classCodeFallback,
  onSeeMore,
  onSearchChange
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [reason, setReason] = useState('');
  const [leaveDate, setLeaveDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50);
  const [leaveDocument, setLeaveDocument] = useState<File | null>(null);

  // Reset pagination when modal opens or query changes
  useEffect(() => {
    if (isOpen) {
      setVisibleCount(50);
    }
  }, [isOpen]);

  useEffect(() => {
    setVisibleCount(50);
  }, [searchQuery]);

  // Helpers to extract normalized fields from possibly different shapes
  const getStudentName = (s: any): string => {
    return (
      s.fullName ||
      s.user?.dariName ||
      [s.user?.firstName, s.user?.lastName].filter(Boolean).join(' ').trim() ||
      [s.firstName, s.lastName].filter(Boolean).join(' ').trim() ||
      ''
    );
  };

  const getStudentRoll = (s: any): string | undefined => {
    return s.rollNo || s.roll || s.studentRollNo || s.user?.rollNo;
  };

  const getStudentClass = (s: any): string | undefined => {
    const name = s.className || s.class?.name || s.class?.title || classNameFallback;
    const code = s.classCode || s.class?.code || classCodeFallback;
    if (name && code) return `${name} (${code})`;
    return name || undefined;
  };

  // Normalize string for robust search (lowercase, strip diacritics, convert arabic digits)
  const normalizeText = (value?: string): string => {
    if (!value) return '';
    const arabicDigits: Record<string, string> = {
      '۰': '0','۱': '1','۲': '2','۳': '3','۴': '4','۵': '5','۶': '6','۷': '7','۸': '8','۹': '9',
      '٠': '0','١': '1','٢': '2','٣': '3','٤': '4','٥': '5','٦': '6','٧': '7','٨': '8','٩': '9',
    };
    const converted = value.replace(/[۰-۹٠-٩]/g, (d) => arabicDigits[d] || d);
    // Remove diacritics and extra spaces
    return converted
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, ' ') // collapse spaces
      .trim();
  };

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;

    const normQuery = normalizeText(searchQuery);
    return students.filter(student => {
      const fields = [
        getStudentName(student),
        getStudentRoll(student),
        getStudentClass(student),
        (student.admissionNo || ''),
        (student.user?.username || ''),
        (student.user?.email || ''),
        (student.user?.phone || ''),
        (student.class?.code || student.classCode || ''),
        String(student.id || ''),
      ];
      return fields.some(f => normalizeText(String(f)).includes(normQuery));
    });
  }, [students, searchQuery]);

  // Determine list to show
  const displayedStudents = useMemo(() => {
    if (selectedStudent) return [];
    if (searchQuery.trim()) return filteredStudents; // show all matches when searching
    return filteredStudents.slice(0, visibleCount);
  }, [filteredStudents, visibleCount, searchQuery, selectedStudent]);

  const remainingCount = useMemo(() => {
    return Math.max(filteredStudents.length - visibleCount, 0);
  }, [filteredStudents.length, visibleCount]);

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setSearchQuery('');
  };

  const handleMarkLeave = async () => {
    if (!selectedStudent || !reason.trim()) {
      alert(t('leaveModal.selectStudentAndReason'));
      return;
    }

    setIsSubmitting(true);
    try {
      const sid = String((selectedStudent as any).id ?? (selectedStudent as any).studentId ?? '');
      await onMarkLeave(sid, reason.trim(), leaveDate, leaveDocument || undefined);
      // Reset form
      setSelectedStudent(null);
      setReason('');
      setSearchQuery('');
      setLeaveDocument(null);
      onClose();
    } catch (error) {
      console.error('Error marking leave:', error);
      alert(t('leaveModal.errorMessage'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    if (!selectedStudent || !reason.trim()) {
      alert(t('leaveModal.selectStudentForPrint'));
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const studentName = getStudentName(selectedStudent) || 'نام ندارد';
    const roll = getStudentRoll(selectedStudent) || 'ندارد';
    const studentClass = getStudentClass(selectedStudent) || 'ندارد';

    // Try fa-AF first, fallback to fa-IR then en-US
    let formattedDate = new Date(leaveDate).toLocaleDateString('fa-AF', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    } as any);
    if (!formattedDate || /Invalid/i.test(formattedDate)) {
      formattedDate = new Date(leaveDate).toLocaleDateString('fa-IR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      } as any);
    }
    if (!formattedDate || /Invalid/i.test(formattedDate)) {
      formattedDate = new Date(leaveDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <title>درخواست رخصتی - ${studentName}</title>
          <style>
            *{box-sizing:border-box}
            @page{size:7.8in 10.11in; margin:0}
            body{font-family:Arial, sans-serif; color:#000}
            .container{width:7.6in; margin:0 auto; padding:0.4in}
            .header{text-align:center; margin-bottom:12px}
            .row{display:flex; justify-content:space-between; font-size:14px; margin:6px 0}
            .table{width:100%; border-collapse:collapse; font-size:14px}
            .table th,.table td{border:1px solid #000; padding:6px; text-align:left; white-space:pre-wrap; vertical-align:top}
            .footer{text-align:center; margin-top:12px; font-size:12px}
            .signature-section{display:flex; justify-content:space-between; margin-top:20px}
            .signature-box{width:45%; border-top:2px solid #333; padding-top:10px; text-align:center}
            @media print{.no-print{display:none}}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h3 style="margin:0">درخواست رخصتی</h3>
              <div style="margin-top:4px">فورم درخواست رخصتی شاگرد</div>
            </div>

            <div class="row"><div>نام شاگرد: <strong>${studentName}</strong></div><div>تاریخ رخصتی: <strong>${formattedDate}</strong></div></div>
            <div class="row"><div>نمبر حاضری: <strong>${roll}</strong></div><div>صنف: <strong>${studentClass}</strong></div></div>

            <br/>
            <table class="table">
              <tr><th>دلیل رخصتی</th></tr>
              <tr><td>${reason.trim()}</td></tr>
            </table>

            <div class="signature-section">
              <div class="signature-box">
                <strong>امضای شاگرد</strong>
              </div>
              <div class="signature-box">
                <strong>امضای مسئول</strong>
              </div>
            </div>

            <div class="footer">
              چاپ شده در ${new Date().toLocaleString('fa-AF', { dateStyle: 'long', timeStyle: 'short' } as any)}
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center mt-10">
      <div className="flex items-end sm:items-center justify-center min-h-screen px-2 sm:px-4 pt-4 pb-4 sm:pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel - Responsive width and positioning */}
        <div className="inline-block w-full align-bottom bg-white rounded-t-2xl sm:rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
          {/* Header - Responsive padding and text */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <FaUser className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <h3 className="text-base sm:text-xl font-bold text-white truncate max-w-[200px] sm:max-w-none">
                {t('leaveModal.title')}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-1"
            >
              <FaTimes className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="bg-white px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto flex-1">
            {/* Date Selection - Responsive spacing */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <FaCalendarAlt className="inline-block w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                {t('leaveModal.leaveDate')}
              </label>
              <input
                type="date"
                value={leaveDate}
                onChange={(e) => setLeaveDate(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Student Search - Responsive spacing */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <FaSearch className="inline-block w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                {t('leaveModal.searchStudent')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); onSearchChange && onSearchChange(e.target.value); }}
                  placeholder={t('leaveModal.searchPlaceholder')}
                  className="w-full px-3 sm:px-4 py-2 pl-9 sm:pl-10 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={!!selectedStudent}
                />
                <FaSearch className="absolute left-3 top-2.5 sm:top-3 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
              </div>

              {/* Student List - Responsive height */}
              {!selectedStudent && (
                <div className="mt-2 max-h-40 sm:max-h-60 overflow-y-auto border border-gray-200 rounded-lg shadow-sm">
                  {studentsLoading && (
                    <div className="px-4 py-6 text-center text-sm text-gray-500">
                      {t('leaveModal.loadingStudents')}
                    </div>
                  )}
                  {!studentsLoading && displayedStudents.length === 0 && (
                    <div className="px-4 py-6 text-center text-sm text-gray-500">
                      {t('leaveModal.noStudentsFound')}
                    </div>
                  )}
                  {!studentsLoading && displayedStudents.length > 0 && (
                    <>
                      {displayedStudents.map((student) => (
                        <button
                          key={student.id}
                          onClick={() => handleStudentSelect(student)}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-sm sm:text-base text-gray-900 truncate">
                            {getStudentName(student) || t('leaveModal.unnamedStudent')}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 truncate">
                            {t('leaveModal.roll')}: {getStudentRoll(student) || t('leaveModal.naValue')} • {t('leaveModal.class')}: {getStudentClass(student) || t('leaveModal.naValue')}
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* See More - Responsive button */}
              {!selectedStudent && !searchQuery.trim() && remainingCount > 0 && (
                <div className="mt-3 text-center">
                  <button
                    onClick={() => { setVisibleCount((c) => c + 50); onSeeMore && onSeeMore(); }}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    {t('leaveModal.seeMore', { count: remainingCount })}
                  </button>
                </div>
              )}

              {/* Selected Student - Responsive card */}
              {selectedStudent && (
                <div className="mt-2 p-3 sm:p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                  <div className="flex items-start sm:items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm sm:text-base text-gray-900 truncate">
                        {getStudentName(selectedStudent) || t('leaveModal.unnamedStudent')}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 break-words">
                        {t('leaveModal.roll')}: {getStudentRoll(selectedStudent) || t('leaveModal.naValue')} • {t('leaveModal.class')}: {getStudentClass(selectedStudent) || t('leaveModal.naValue')}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedStudent(null)}
                      className="text-red-600 hover:text-red-700 flex-shrink-0 p-1"
                    >
                      <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Reason Input - Responsive */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <FaFileAlt className="inline-block w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                {t('leaveModal.reasonForLeave')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('leaveModal.reasonPlaceholder')}
                rows={4}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('leaveModal.reasonHint')}
              </p>
            </div>

            {/* Leave Document Upload - Responsive */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <FaFileAlt className="inline-block w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                {t('leaveModal.leaveDocument')}
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                onChange={(e) => setLeaveDocument(e.target.files?.[0] || null)}
                className="w-full px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-md file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('leaveModal.uploadDocument')}
              </p>
              {leaveDocument && (
                <p className="mt-2 text-xs sm:text-sm text-green-600 break-words">
                  ✓ {t('leaveModal.documentSelected', { filename: leaveDocument.name, size: (leaveDocument.size / 1024).toFixed(1) })}
                </p>
              )}
            </div>
          </div>

          {/* Actions - Responsive footer with stacked buttons on mobile */}
          <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex-shrink-0">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
              {/* Cancel button */}
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors order-3 sm:order-1"
                disabled={isSubmitting}
              >
                {t('leaveModal.cancel')}
              </button>

              {/* Print button */}
              <button
                onClick={handlePrint}
                className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 order-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedStudent || !reason.trim() || isSubmitting}
              >
                <FaPrint className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{t('leaveModal.print')}</span>
                <span className="sm:hidden">{t('leaveModal.print')}</span>
              </button>

              {/* Mark Leave button */}
              <button
                onClick={handleMarkLeave}
                disabled={!selectedStudent || !reason.trim() || isSubmitting || loading}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm sm:text-base text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-3"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>{t('leaveModal.marking')}</span>
                  </>
                ) : (
                  <>
                    <FaUser className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{t('leaveModal.markLeave')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveModal;