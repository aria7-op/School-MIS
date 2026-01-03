import React, { useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaUpload, FaImage, FaCheckCircle, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import { useBulkOCRAttendance, useStudents } from '../services/attendanceService';
import { Student } from '../types/attendance';

interface BulkAttendanceUploadProps {
  classId: string;
  onSuccess?: () => void;
}

const BulkAttendanceUpload: React.FC<BulkAttendanceUploadProps> = ({ classId, onSuccess }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  // Helper function to get student name based on selected language
  const getStudentName = (student: any): string => {
    // Check if current language is Dari (fa-AF) or Pashto (ps-AF)
    const isDariOrPashto = i18n.language === "fa-AF" || i18n.language === "ps-AF";
    
    // If Dari or Pashto and dariName exists, use it; otherwise use fullName or firstName+lastName
    if (isDariOrPashto && student.user?.dariName) {
      return student.user.dariName.trim();
    }
    
    return student.fullName || 
      `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
      "Unknown Student";
  };
  
  // State
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [rowNumber, setRowNumber] = useState<number>(1);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch students for the class
  const { data: students = [], isLoading: studentsLoading } = useStudents({
    classId,
    limit: 200
  });

  // Bulk OCR mutation
  const bulkOCRMutation = useBulkOCRAttendance();

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    
    const query = searchQuery.toLowerCase();
    return students.filter((student: Student) => {
      const firstName = student.firstName || '';
    const lastName = student.lastName || '';
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    const dariName = student.user?.dariName?.toLowerCase() || '';
    const rollNo = (student.rollNo || '').toLowerCase();
      
      return fullName.includes(query) || dariName.includes(query) || rollNo.includes(query);
    });
  }, [students, searchQuery]);

  // Calculate number of days in selected month
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(t('bulkAttendance.invalidFileType'));
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle submit
  const handleSubmit = async () => {
    // Validate inputs
    if (!selectedStudent || selectedStudent === '') {
      alert(t('bulkAttendance.selectStudent'));
      return;
    }

    if (!imageFile || !imagePreview) {
      alert(t('bulkAttendance.uploadImage'));
      return;
    }

    if (rowNumber < 1) {
      alert(t('bulkAttendance.invalidRowNumber'));
      return;
    }

    if (!classId || classId === '') {
      alert('Class ID is required');
      return;
    }

    // Calculate start date (first day of selected month)
    const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;

    try {
      const result = await bulkOCRMutation.mutateAsync({
        studentId: selectedStudent,
        classId: classId,
        image: imagePreview, // Base64 encoded image
        rowNumber: Number(rowNumber),
        startDate: startDate,
        numDays: Number(daysInMonth)
      });
      
      // Reset form
      setSelectedStudent('');
      setRowNumber(1);
      setImageFile(null);
      setImagePreview('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      alert(t('bulkAttendance.successMessage', {
        created: result.data?.created || 0,
        updated: result.data?.updated || 0
      }));

    } catch (error: any) {
      alert(t('bulkAttendance.errorMessage', { error: error.message || 'Unknown error' }));
    }
  };

 return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center">
              <FaUpload className="text-2xl text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {t('bulkAttendance.title')}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {t('bulkAttendance.description')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Important Notice - More subtle */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 px-6">
        <div className="flex gap-3">
          <FaExclamationTriangle className="text-amber-500 mt-0.5 shrink-0" />
          <div className="text-sm">
            <span className="font-medium text-gray-900">{t('bulkAttendance.importantNote')}: </span>
            <span className="text-gray-600">{t('bulkAttendance.dateOrderingNote')}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column - Configuration */}
            <div className="lg:col-span-1 space-y-6 ">
              
              {/* Step 1: Student Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                    1
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">{t('bulkAttendance.selectStudent')}</h3>
                </div>
                
                <div className="ml-11 space-y-3">
                  {/* Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('bulkAttendance.searchStudent')}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>
                  
                  {/* Student Dropdown */}
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none bg-white"
                    disabled={studentsLoading}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  >
                    <option value="">{studentsLoading ? t('common.loading') : t('bulkAttendance.chooseStudent')}</option>
                    {filteredStudents.map((student: Student) => (
                      <option key={student.id} value={student.id}>
                        {student.rollNo} - {getStudentName(student)}
                      </option>
                    ))}
                  </select>
                  
                  {/* Selected Student Indicator */}
                  {selectedStudent && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
                      <FaCheckCircle className="text-xs" />
                      <span className="font-medium">
                        {getStudentName(filteredStudents.find((s: Student) => s.id === selectedStudent)!)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Period Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                    2
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">{t('bulkAttendance.selectPeriod')}</h3>
                </div>
                
                <div className="ml-11 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('bulkAttendance.month')}
                    </label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <option key={month} value={month}>
                          {new Date(2000, month - 1).toLocaleString(i18n.language, { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('bulkAttendance.year')}
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 3: Row Configuration */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                    3
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">{t('bulkAttendance.configureRow')}</h3>
                </div>
                
                <div className="ml-11 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('bulkAttendance.rowNumber')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={rowNumber}
                      onChange={(e) => setRowNumber(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder={t('bulkAttendance.rowNumberPlaceholder')}
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      {t('bulkAttendance.rowNumberHint')}
                    </p>
                  </div>
                </div>
              </div>   
            </div>

            {/* Right Column - Image Upload */}
            <div className="lg:col-span-1 space-y-4 ">
              <div className="sticky top-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                    4
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">{t('bulkAttendance.uploadImage')}</h3>
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    imagePreview 
                      ? 'border-blue-300 bg-blue-50/30' 
                      : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/20'
                  }`}
                >
                  {imagePreview ? (
                    <div className="p-4 space-y-3">
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-md font-medium">
                          Ready
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {imageFile?.name}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageFile(null);
                            setImagePreview('');
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
                        >
                          {t('bulkAttendance.removeImage')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center space-y-3">
                      <FaImage className="text-4xl text-gray-400 mx-auto" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {t('bulkAttendance.clickToUpload')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {t('bulkAttendance.supportedFormats')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              
              {/* Processing Information */}
              <div className=" bg-blue-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
                  <FaCheckCircle className="text-blue-600" />
                  {t('bulkAttendance.processingInfo')}
                </div>
                <ul className="text-sm text-gray-600 space-y-1 ml-6">
                  <li>{t('bulkAttendance.infoPoint1')}</li>
                  <li>{t('bulkAttendance.infoPoint2', { days: daysInMonth })}</li>
                  <li>{t('bulkAttendance.infoPoint3')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="border-t border-gray-100 px-8 py-6 bg-gray-50/50 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {selectedStudent && imageFile && (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Ready to process {daysInMonth} days
                </span>
              )}
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={bulkOCRMutation.isPending || !selectedStudent || !imageFile}
              className={`px-6 py-3 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
                bulkOCRMutation.isPending || !selectedStudent || !imageFile
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow'
              }`}
            >
              {bulkOCRMutation.isPending ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>{t('bulkAttendance.processing')}</span>
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  <span>{t('bulkAttendance.processAttendance')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {bulkOCRMutation.isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <FaExclamationTriangle className="text-red-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-red-900">
                {t('bulkAttendance.error')}
              </p>
              <p className="text-red-700 mt-1">
                {bulkOCRMutation.error?.message || t('common.unknownError')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkAttendanceUpload;

