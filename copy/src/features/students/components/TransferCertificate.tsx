import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaPrint, FaTimes, FaExchangeAlt, FaDownload } from 'react-icons/fa';
import studentService from '../services/studentService';
import DOMPurify from 'dompurify';

interface TransferCertificateProps {
  certificateData: any;
  onClose: () => void;
  onStudentTransferred?: () => void;
}

const TransferCertificate: React.FC<TransferCertificateProps> = ({ certificateData, onClose, onStudentTransferred }) => {
  const { t, i18n } = useTranslation();
  const printRef = useRef<HTMLDivElement>(null);
  const isRTL = i18n.language === 'fa' || i18n.language === 'ps';
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [transferData, setTransferData] = useState({
    transferredToSchool: '',
    transferReason: 'School Transfer',
    remarks: ''
  });
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = `
      <style>
        @media print {
          @page { 
            size: A4;
            margin: 20mm;
          }
          body { 
            font-family: 'Arial', 'Helvetica', sans-serif;
            direction: ${isRTL ? 'rtl' : 'ltr'};
          }
          .no-print { display: none; }
          .print-section { page-break-inside: avoid; }
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', 'Helvetica', sans-serif;
          line-height: 1.6;
          color: #1a1a1a;
          direction: ${isRTL ? 'rtl' : 'ltr'};
          background: white;
        }
        
        .letter-container {
          max-width: 210mm;
          margin: 0 auto;
          padding: 0;
          background: white;
          position: relative;
        }
        
        /* Letterhead */
        .letterhead {
          background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
          padding: 30px 40px;
          color: white;
          position: relative;
          overflow: hidden;
        }
        
        .letterhead::before {
          content: '';
          position: absolute;
          top: 0;
          ${isRTL ? 'left' : 'right'}: 0;
          width: 200px;
          height: 200px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 50%;
          transform: translate(50%, -50%);
        }
        
        .letterhead-content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .logo-section {
          flex-shrink: 0;
        }
        
        .school-logo {
          width: 70px;
          height: 70px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        .school-logo img {
          width: 50px;
          height: 50px;
          object-fit: contain;
        }
        
        .school-info {
          flex: 1;
        }
        
        .school-name-header {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 5px;
          letter-spacing: 0.5px;
        }
        
        .school-subtitle {
          font-size: 13px;
          opacity: 0.9;
          margin-bottom: 3px;
        }
        
        .school-contact {
          font-size: 11px;
          opacity: 0.85;
          margin-top: 8px;
        }
        
        /* Letter Body */
        .letter-body {
          padding: 40px 50px;
        }
        
        .letter-title {
          text-align: center;
          font-size: 22px;
          font-weight: 700;
          color: #1e3a8a;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
          padding-bottom: 15px;
          border-bottom: 3px solid #1e3a8a;
        }
        
        .letter-meta {
          display: flex;
          justify-content: space-between;
          margin: 25px 0 30px;
          padding: 15px 20px;
          background: #f8fafc;
          border-${isRTL ? 'right' : 'left'}: 4px solid #1e3a8a;
          font-size: 13px;
        }
        
        .meta-item {
          display: flex;
          gap: 8px;
        }
        
        .meta-label {
          font-weight: 600;
          color: #475569;
        }
        
        .meta-value {
          color: #1a1a1a;
        }
        
        /* Letter Content Sections */
        .letter-section {
          margin: 30px 0;
        }
        
        .section-title {
          font-size: 15px;
          font-weight: 700;
          color: #1e3a8a;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e2e8f0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .info-table {
          width: 100%;
          margin: 15px 0;
        }
        
        .info-row {
          display: grid;
          grid-template-columns: 180px 1fr;
          padding: 10px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .info-row:last-child {
          border-bottom: none;
        }
        
        .info-label {
          font-weight: 600;
          color: #475569;
          font-size: 14px;
        }
        
        .info-value {
          color: #1a1a1a;
          font-size: 14px;
        }
        
        /* Performance Table */
        .performance-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 13px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .performance-table thead {
          background: #1e3a8a;
          color: white;
        }
        
        .performance-table th {
          padding: 12px 15px;
          text-align: ${isRTL ? 'right' : 'left'};
          font-weight: 600;
        }
        
        .performance-table td {
          padding: 10px 15px;
          text-align: ${isRTL ? 'right' : 'left'};
          border-bottom: 1px solid #e2e8f0;
        }
        
        .performance-table tbody tr:hover {
          background: #f8fafc;
        }
        
        .performance-table tbody tr:nth-child(even) {
          background: #f9fafb;
        }
        
        /* Remarks Box */
        .remarks-box {
          background: #f8fafc;
          border-${isRTL ? 'right' : 'left'}: 4px solid #1e3a8a;
          padding: 15px 20px;
          margin: 20px 0;
          font-size: 14px;
          line-height: 1.7;
        }
        
        /* Signature Section */
        .signature-section {
          margin-top: 60px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          padding-top: 40px;
        }
        
        .signature-block {
          text-align: center;
        }
        
        .signature-space {
          height: 70px;
          border-bottom: 2px solid #1a1a1a;
          margin-bottom: 10px;
        }
        
        .signature-name {
          font-weight: 600;
          font-size: 14px;
          color: #1a1a1a;
          margin-bottom: 4px;
        }
        
        .signature-title {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .stamp-placeholder {
          position: absolute;
          ${isRTL ? 'left' : 'right'}: 50px;
          bottom: 40px;
          width: 100px;
          height: 100px;
          border: 2px dashed #cbd5e1;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          font-size: 10px;
          text-align: center;
          transform: rotate(-15deg);
          opacity: 0.6;
        }
        
        /* Footer */
        .letter-footer {
          background: #f8fafc;
          padding: 20px 40px;
          text-align: center;
          border-top: 3px solid #1e3a8a;
          margin-top: 40px;
        }
        
        .footer-text {
          font-size: 11px;
          color: #64748b;
          line-height: 1.6;
        }
        
        .footer-notice {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
          font-size: 10px;
          font-style: italic;
          color: #94a3b8;
        }
      </style>
    `;

    // Sanitize innerHTML to prevent XSS attacks
    const sanitizedContent = DOMPurify.sanitize(printContent.innerHTML, {
      ALLOWED_TAGS: ['div', 'p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'b', 'i', 'u', 'br', 'hr', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['class', 'style', 'colspan', 'rowspan'],
    });
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t('students.transferCertificate.title')}</title>
          <meta charset="utf-8">
          ${styles}
        </head>
        <body>
          ${sanitizedContent}
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString(i18n.language === 'fa' ? 'fa-AF' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateShort = (date: string | null | undefined) => {
    if (!date) return '—';
    try {
      return new Intl.DateTimeFormat(isRTL ? 'fa-AF' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(new Date(date));
    } catch (error) {
      return formatDate(date);
    }
  };

  const formatDocumentType = (type: string) => {
    if (!type) {
      return t('students.transferCertificate.document');
    }
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatFileSize = (rawSize: number | string | null | undefined) => {
    if (rawSize === null || rawSize === undefined) {
      return '—';
    }

    const size = typeof rawSize === 'string' ? parseInt(rawSize, 10) : rawSize;
    if (Number.isNaN(size) || size < 0) {
      return '—';
    }

    if (size === 0) {
      return '0 KB';
    }

    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const unitIndex = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
    const adjustedSize = size / Math.pow(1024, unitIndex);

    return `${adjustedSize.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
  };

  const getFileExtensionFromMime = (mimeType?: string) => {
    if (!mimeType) return '';

    const mimeMap: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/zip': 'zip',
      'application/x-zip-compressed': 'zip',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif'
    };

    if (mimeMap[mimeType]) {
      return mimeMap[mimeType];
    }

    const parts = mimeType.split('/');
    if (parts.length === 2) {
      return parts[1].split(';')[0];
    }

    return '';
  };

  const buildDownloadFileName = (doc: any) => {
    const baseName = (doc?.title || `${student?.admissionNo || 'student'}-document-${doc?.id ?? ''}`).toString();
    const sanitizedBase = baseName
      .trim()
      .replace(/[^a-zA-Z0-9\-_ ]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 80) || `student-document-${doc?.id ?? Date.now()}`;

    const extension = getFileExtensionFromMime(doc?.mimeType);
    return extension ? `${sanitizedBase}.${extension}` : sanitizedBase;
  };

  const downloadDocumentFile = async (doc: any, suppressErrorAlert = false) => {
    if (!doc?.id || !student?.id) {
      if (!suppressErrorAlert) {
        alert(t('students.transferCertificate.downloadError'));
      }
      return;
    }

    const docId = String(doc.id ?? doc.documentId);
    setDownloadingDocId(docId);

    try {
      const blob = await studentService.downloadStudentDocument(student.id, doc.id);

      if (!blob || typeof (blob as any).size === 'number' && (blob as any).size === 0) {
        throw new Error('Empty file received from server');
      }

      if ((blob as Blob).type && (blob as Blob).type.includes('application/json')) {
        const rawText = await (blob as Blob).text();
        try {
          const parsed = JSON.parse(rawText);
          throw new Error(parsed?.message || parsed?.error || 'Unexpected JSON response');
        } catch (jsonError) {
          if (jsonError instanceof Error && jsonError.message !== 'Unexpected JSON response') {
            throw jsonError;
          }
          throw new Error(rawText || 'Unexpected JSON response');
        }
      }

      const fileName = buildDownloadFileName(doc);

      const navigatorAny = window.navigator as any;
      if (typeof navigatorAny?.msSaveOrOpenBlob === 'function') {
        navigatorAny.msSaveOrOpenBlob(blob, fileName);
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
        window.URL.revokeObjectURL(url);
      }, 300);
    } catch (error) {
      console.error('Error downloading document:', error);
      if (!suppressErrorAlert) {
        const errorMessage = error instanceof Error ? error.message : '';
        const baseMessage = t('students.transferCertificate.downloadError');
        alert(errorMessage ? `${baseMessage}\n${errorMessage}` : baseMessage);
      }
      throw error;
    } finally {
      setDownloadingDocId(null);
    }
  };

  const handleDownloadDocument = async (doc: any) => {
    try {
      await downloadDocumentFile(doc);
    } catch (error) {
      console.error('Download document failed:', error);
    }
  };

  const handleDownloadAllDocuments = async () => {
    const allDocuments = Object.values(documents?.byType || {}).reduce((acc: any[], current: any) => {
      if (Array.isArray(current)) {
        return acc.concat(current);
      }
      return acc;
    }, [] as any[]);

    if (!allDocuments.length) {
      return;
    }

    setDownloadingAll(true);
    try {
      for (const doc of allDocuments) {
        await downloadDocumentFile(doc, true);
      }
    } catch (error) {
      console.error('Error downloading one of the documents:', error);
      alert(t('students.transferCertificate.downloadError'));
    } finally {
      setDownloadingAll(false);
      setDownloadingDocId(null);
    }
  };

  const handleTransferStudent = async () => {
    try {
      setTransferring(true);
      const response = await studentService.transferStudent(student.id, {
        transferDate: new Date().toISOString(),
        transferReason: transferData.transferReason,
        transferredToSchool: transferData.transferredToSchool,
        remarks: transferData.remarks
      });

      if (response.success) {
        alert(t('students.transfer.success') || 'Student has been marked as transferred successfully');
        setShowTransferConfirm(false);
        if (onStudentTransferred) {
          onStudentTransferred();
        }
        onClose();
      } else {
        alert(t('students.transfer.error') || `Failed to transfer student: ${response.error}`);
      }
    } catch (error) {
      console.error('Error transferring student:', error);
      alert(t('students.transfer.error') || `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTransferring(false);
    }
  };

  const { student, school, class: studentClass, section, parent, academics, attendance, documents = { total: 0, byType: {} }, metadata } = certificateData;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Action Buttons */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center no-print z-10">
          <h2 className="text-2xl font-bold text-gray-800">
            {t('students.transferCertificate.title')}
          </h2>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPrint className="w-4 h-4" />
              {t('students.transferCertificate.print')}
            </button>
            {student.status !== 'TRANSFERRED' && (
              <button
                onClick={() => setShowTransferConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <FaExchangeAlt className="w-4 h-4" />
                {t('students.transfer.markAsTransferred')}
              </button>
            )}
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <FaTimes className="w-4 h-4" />
              {t('common.close')}
            </button>
          </div>
        </div>

        {/* Certificate Content */}
        <div ref={printRef} className="bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="letter-container">
            {/* Letterhead */}
            <div className="letterhead">
              <div className="letterhead-content">
                <div className="logo-section">
                  <div className="school-logo">
                    {school.logo ? (
                      <img src={school.logo} alt="School Logo" />
                    ) : (
                      <div style={{ fontSize: '28px', color: '#1e3a8a' }}>🏫</div>
                    )}
                  </div>
                </div>
                
                <div className="school-info">
                  <div className="school-name-header">
                    {school.name || 'School Name'}
                  </div>
                  <div className="school-subtitle">
                    {isRTL ? 'جمهوری اسلامی افغانستان - وزارت معارف' : 'Islamic Republic of Afghanistan - Ministry of Education'}
                  </div>
                  <div className="school-contact">
                    {school.address && `${school.address}, `}
                    {school.city && `${school.city}, `}
                    {school.country || 'Afghanistan'}
                    {school.phone && ` • ${school.phone}`}
                    {school.email && ` • ${school.email}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Letter Body */}
            <div className="letter-body">
              {/* Title */}
              <div className="letter-title">
                {isRTL ? 'سند انتقالی' : 'School Leaving Certificate'}
              </div>

              {/* Metadata */}
              <div className="letter-meta">
                <div className="meta-item">
                  <span className="meta-label">{t('students.transferCertificate.certificateNo')}:</span>
                  <span className="meta-value">{metadata.certificateNumber}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">{t('students.transferCertificate.issueDate')}:</span>
                  <span className="meta-value">{formatDate(metadata.generatedAt)}</span>
                </div>
              </div>

              {/* Student Information */}
              <div className="letter-section">
                <div className="section-title">{t('students.transferCertificate.studentInformation')}</div>
                <div className="info-table">
                  <div className="info-row">
                    <div className="info-label">{t('students.form.firstName')}</div>
                    <div className="info-value">{student.dariName || `${student.firstName} ${student.lastName}`}</div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">{t('students.form.fatherName')}</div>
                    <div className="info-value">{parent.name || 'N/A'}</div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">{t('students.form.dateOfBirth')}</div>
                    <div className="info-value">{formatDate(student.dateOfBirth)}</div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">{t('students.form.gender')}</div>
                    <div className="info-value">{student.gender || 'N/A'}</div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">{t('students.form.nationality')}</div>
                    <div className="info-value">{student.nationality || 'Afghanistan'}</div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">{t('students.table.columns.admissionNo')}</div>
                    <div className="info-value">{student.admissionNo}</div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">{t('students.table.columns.rollNo')}</div>
                    <div className="info-value">{student.rollNo || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="letter-section">
                <div className="section-title">{t('students.transferCertificate.academicInformation')}</div>
                <div className="info-table">
                  <div className="info-row">
                    <div className="info-label">{t('students.form.class')}</div>
                    <div className="info-value">{studentClass.name} {section.name ? `- ${section.name}` : ''}</div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">{t('students.form.admissionDate')}</div>
                    <div className="info-value">{formatDate(student.admissionDate)}</div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">{t('students.transferCertificate.leavingDate')}</div>
                    <div className="info-value">{formatDate(new Date().toISOString())}</div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">{t('students.transferCertificate.averageScore')}</div>
                    <div className="info-value">{academics.averageScore ? `${academics.averageScore}%` : 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Attendance Record */}
              <div className="letter-section">
                <div className="section-title">{t('students.transferCertificate.attendanceRecord')}</div>
                <div className="info-table">
                  <div className="info-row">
                    <div className="info-label">{t('students.transferCertificate.totalDays')}</div>
                    <div className="info-value">{attendance.totalDays}</div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">{t('students.transferCertificate.presentDays')}</div>
                    <div className="info-value">{attendance.presentDays}</div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">{t('students.transferCertificate.absentDays')}</div>
                    <div className="info-value">{attendance.absentDays}</div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">{t('students.transferCertificate.attendancePercentage')}</div>
                    <div className="info-value">{attendance.attendancePercentage}%</div>
                  </div>
                </div>
              </div>

              {/* Academic Performance by Subject */}
              {Object.keys(academics.gradesBySubject).length > 0 && (
                <div className="letter-section">
                  <div className="section-title">{t('students.transferCertificate.subjectWisePerformance')}</div>
                  <table className="performance-table">
                    <thead>
                      <tr>
                        <th>{t('students.transferCertificate.subject')}</th>
                        <th>{t('students.transferCertificate.totalExams')}</th>
                        <th>{t('students.transferCertificate.averageScore')}</th>
                        <th>{t('students.transferCertificate.grade')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(academics.gradesBySubject).map(([subject, grades]: [string, any]) => {
                        const avgScore = (grades.reduce((sum: number, g: any) => sum + (g.score || 0), 0) / grades.length).toFixed(2);
                        const lastGrade = grades[0]?.grade || 'N/A';
                        return (
                          <tr key={subject}>
                            <td>{subject}</td>
                            <td>{grades.length}</td>
                            <td>{avgScore}</td>
                            <td>{lastGrade}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Character and Conduct */}
              <div className="letter-section">
                <div className="section-title">{t('students.transferCertificate.characterConduct')}</div>
                <div className="remarks-box">
                  <strong>{t('students.transferCertificate.conduct')}:</strong> {t('students.transferCertificate.good')}
                  <br /><br />
                  <strong>{t('students.transferCertificate.remarks')}:</strong> {t('students.transferCertificate.conductRemarks')}
                </div>
              </div>

              {/* Documents Submitted */}
              <div className="letter-section">
                <div className="section-title">{t('students.transferCertificate.documentsSubmitted')}</div>
                {documents.total > 0 ? (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm text-slate-600">
                      <span>
                        {t('students.transferCertificate.documentsOnFile', { count: documents.total })}
                      </span>
                      <button
                        onClick={handleDownloadAllDocuments}
                        disabled={downloadingAll || !documents.total}
                        className="no-print inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {downloadingAll ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <FaDownload className="w-4 h-4" />
                        )}
                        {t('students.transferCertificate.downloadAll')}
                      </button>
                    </div>

                    <div className="space-y-4">
                      {Object.entries(documents.byType || {}).map(([type, docs]: [string, any[]]) => (
                        <div key={type} className="border border-slate-200 rounded-lg overflow-hidden">
                          <div className="px-4 py-2 bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            {formatDocumentType(type)}
                          </div>
                          <div className="divide-y divide-slate-200">
                            {(docs || []).map((doc: any, index: number) => {
                              const docId = String(doc?.id ?? doc?.documentId ?? `${type}-${index}`);
                              return (
                                <div
                                  key={docId}
                                  className="flex flex-col gap-4 px-4 py-3 bg-white transition-colors hover:bg-slate-50 lg:flex-row lg:items-center lg:justify-between"
                                >
                                  <div>
                                    <div className="text-sm font-semibold text-slate-800">
                                      {doc?.title || t('students.transferCertificate.document')}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                      {t('students.transferCertificate.uploadedOn')}: {formatDateShort(doc?.createdAt)}
                                      {' • '}
                                      {t('students.transferCertificate.fileSize')}: {formatFileSize(doc?.size)}
                                      {' • '}
                                      {doc?.mimeType || '—'}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleDownloadDocument(doc)}
                                      disabled={downloadingAll || downloadingDocId === docId}
                                      className="no-print inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 border border-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                      {downloadingDocId === docId ? (
                                        <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                                      ) : (
                                        <FaDownload className="w-4 h-4" />
                                      )}
                                      {t('common.download')}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="remarks-box">
                    {t('students.transferCertificate.noDocuments')}
                  </div>
                )}
              </div>

              {/* Signature Section */}
              <div className="signature-section" style={{ position: 'relative' }}>
                <div className="signature-block">
                  <div className="signature-space"></div>
                  <div className="signature-name">{t('students.transferCertificate.classTeacher')}</div>
                  <div className="signature-title">Class Teacher</div>
                </div>
                
                <div className="signature-block">
                  <div className="signature-space"></div>
                  <div className="signature-name">{school.principal || t('students.transferCertificate.principal')}</div>
                  <div className="signature-title">{t('students.transferCertificate.principalTitle')}</div>
                </div>
                
                <div className="stamp-placeholder">
                  {t('students.transferCertificate.schoolStamp')}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="letter-footer">
              <div className="footer-text">
                {t('students.transferCertificate.verificationNote')}
              </div>
              <div className="footer-notice">
                This is an official document issued by {school.name}. Certificate No: {metadata.certificateNumber}
              </div>
            </div>
          </div>
        </div>

        {/* Transfer Confirmation Modal */}
        {showTransferConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" style={{ margin: 0 }}>
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <FaExchangeAlt className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {t('students.transfer.confirmTitle')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {student.dariName || `${student.firstName} ${student.lastName}`}
                  </p>
                </div>
              </div>

              <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <p className="text-sm text-yellow-800 font-semibold mb-2">
                  {t('students.transfer.warning')}
                </p>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                  <li>{t('students.transfer.warningPoint1')}</li>
                  <li>{t('students.transfer.warningPoint2')}</li>
                  <li>{t('students.transfer.warningPoint3')}</li>
                </ul>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('students.transfer.transferredToSchool')}
                  </label>
                  <input
                    type="text"
                    value={transferData.transferredToSchool}
                    onChange={(e) => setTransferData({ ...transferData, transferredToSchool: e.target.value })}
                    placeholder={t('students.transfer.schoolPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('students.transfer.remarks')}
                  </label>
                  <textarea
                    value={transferData.remarks}
                    onChange={(e) => setTransferData({ ...transferData, remarks: e.target.value })}
                    placeholder={t('students.transfer.remarksPlaceholder')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowTransferConfirm(false)}
                  disabled={transferring}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleTransferStudent}
                  disabled={transferring}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {transferring ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      {t('students.transfer.transferring')}
                    </>
                  ) : (
                    <>
                      <FaExchangeAlt className="w-4 h-4" />
                      {t('students.transfer.confirmTransfer')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferCertificate;

