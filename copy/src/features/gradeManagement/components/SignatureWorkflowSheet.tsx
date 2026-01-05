import React, { useState, useEffect } from "react";
import gradeManagementService from "../services/gradeManagementService";
import { AFGHAN_SUBJECTS } from "../constants/afghanSubjects";
import { useStudentListHeaderFields } from "../context/StudentListHeaderContext";
import { useAuth } from "../../../contexts/AuthContext";

/**
 * Comprehensive mapping of English subject names to Dari names
 * Used in Afghan schools
 */
const ENGLISH_TO_DARI_SUBJECT_MAPPING: Record<string, string> = {
  // Core Islamic Studies
  'quran': 'قرانکریم',
  'holy quran': 'قرانکریم',
  'quran kareem': 'قرانکریم',
  'religious studies': 'دنیات',
  'deen': 'دنیات',
  'islamic studies': 'دنیات',
  'islamiat': 'دنیات',
  
  // Languages
  'dari': 'دری',
  'persian': 'دری',
  'farsi': 'دری',
  'arabic': 'عربی',
  'pashto': 'پشتو',
  'english': 'انګلیسی',
  'third language': 'لسان سوم',
  'foreign language': 'لسان سوم',
  
  // Mathematics & Sciences
  'mathematics': 'ریاضی',
  'math': 'ریاضی',
  'maths': 'ریاضی',
  'science': 'ساینس',
  'physics': 'فزیک',
  'chemistry': 'کیمیا',
  'biology': 'بیولوژی',
  
  // Social Studies
  'social studies': 'اجتماعیات',
  'social': 'اجتماعیات',
  'history': 'تاریخ',
  'geography': 'جغرافیه',
  'civics': 'شهروندی',
  'civic education': 'شهروندی',
  
  // Arts & Skills
  'art': 'خط/ رسم',
  'calligraphy': 'خط/ رسم',
  'drawing': 'خط/ رسم',
  'art (calligraphy)': 'خط/ رسم',
  'handwriting': 'خط/ رسم',
  
  // Computer & Technology
  'computer': 'کمپیوتر',
  'computers': 'کمپیوتر',
  'computer science': 'کمپیوتر',
  'ict': 'کمپیوتر',
  'information technology': 'کمپیوتر',
  
  // Physical Education & Health
  'physical education': 'تربیت بدنی',
  'pe': 'تربیت بدنی',
  'sports': 'تربیت بدنی',
  'gym': 'تربیت بدنی',
  'health': 'صحت',
  
  // Life Skills & Ethics
  'life skills': 'مهارت زندگی',
  'ethics': 'تهذیب',
  'manners': 'تهذیب',
  'moral education': 'تهذیب',
  
  // Additional Subjects
  'agriculture': 'زراعت',
  'home economics': 'اقتصاد خانه',
  'economics': 'اقتصاد',
  'business studies': 'تجارت',
  'accounting': 'حسابداری',
  'literature': 'ادبیات',
  'poetry': 'شعر',
  'grammar': 'صرف و نحو',
};

/**
 * Subject Grade Entry Sheet - EXACT MATCH to Excel "شقه" worksheet
 * ONE SUBJECT AT A TIME - Teacher enters 4 mark components per student
 * Shows TWO columns of students side-by-side
 */
interface SignatureWorkflowSheetProps {
  classId: string;
  examType: "MIDTERM" | "FINAL";
  editable?: boolean;
  onDataChange?: () => void;
  selectedSubjectName?: string | null;
}

const SignatureWorkflowSheet: React.FC<SignatureWorkflowSheetProps> = ({
  classId,
  examType,
  editable,
  selectedSubjectName,
}) => {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [grades, setGrades] = useState<Map<string, any>>(new Map());
  const [subjectStudents, setSubjectStudents] = useState<any[]>([]);
  const headerFields = useStudentListHeaderFields();
  const { user } = useAuth();

  // Load teacher's subjects and set default
  useEffect(() => {
    const initializeDefaultSubject = async () => {
      try {
        // Get teacher's classes and subjects
        const { classes } = await gradeManagementService.getTeacherClasses();
        
        // Find the current class
        const currentClass = classes.find(cls => cls.id === classId);
        
        if (currentClass && currentClass.subjects && currentClass.subjects.length > 0) {
          // Set the first subject as default using its name (will be mapped to Dari from AFGHAN_SUBJECTS)
          const firstSubject = currentClass.subjects[0];
          console.log('🔍 Setting default subject from teacher subjects:', firstSubject);
          // Use the name from AFGHAN_SUBJECTS mapping or the API name
          const afghanSubject = AFGHAN_SUBJECTS.find(s => 
            s.code === firstSubject.code || 
            s.code.toLowerCase() === firstSubject.code.toLowerCase()
          );
          const subjectName = afghanSubject?.name || firstSubject.name;
          setSelectedSubject(subjectName);
        } else if (!selectedSubjectName) {
          // If no subjects found and no prop provided, show empty
          console.warn('No subjects found for this class');
          setSelectedSubject("");
        }
      } catch (error) {
        console.error('Error loading teacher subjects:', error);
        setSelectedSubject("");
      }
    };

    if (!selectedSubjectName) {
      initializeDefaultSubject();
    }
  }, [classId, selectedSubjectName]);

  useEffect(() => {
    loadStudents();
  }, [classId]);

  // Update selectedSubject when selectedSubjectName prop changes
  useEffect(() => {
    if (selectedSubjectName) {
      console.log('🔍 Setting subject from API:', selectedSubjectName);
      
      // Normalize the input for comparison
      const normalizedInput = selectedSubjectName.trim().toLowerCase();
      
      // Step 1: Check if it's already a Dari name (exists in AFGHAN_SUBJECTS)
      let exactMatch = AFGHAN_SUBJECTS.find(s => 
        s.name === selectedSubjectName || 
        s.nameEn === selectedSubjectName ||
        s.code === selectedSubjectName ||
        s.name.toLowerCase() === normalizedInput ||
        s.nameEn.toLowerCase() === normalizedInput ||
        s.code.toLowerCase() === normalizedInput
      );
      
      if (exactMatch) {
        console.log('✅ Found exact match in AFGHAN_SUBJECTS:', exactMatch.name);
        setSelectedSubject(exactMatch.name);
        return;
      }
      
      // Step 2: Check English to Dari mapping
      const dariName = ENGLISH_TO_DARI_SUBJECT_MAPPING[normalizedInput];
      if (dariName) {
        console.log('✅ Mapped English to Dari:', selectedSubjectName, '->', dariName);
        // Use the Dari name (even if not in AFGHAN_SUBJECTS, it will be added to dropdown)
        setSelectedSubject(dariName);
        return;
      }
      
      // Step 3: Try partial matching in the mapping
      const mappingKey = Object.keys(ENGLISH_TO_DARI_SUBJECT_MAPPING).find(key => 
        normalizedInput.includes(key) || key.includes(normalizedInput)
      );
      if (mappingKey) {
        const mappedDariName = ENGLISH_TO_DARI_SUBJECT_MAPPING[mappingKey];
        console.log('✅ Found partial mapping:', mappingKey, '->', mappedDariName);
        setSelectedSubject(mappedDariName);
        return;
      }
      
      // Step 4: If no mapping found, check if nameEn matches
      const nameEnMatch = AFGHAN_SUBJECTS.find(s => 
        s.nameEn.toLowerCase() === normalizedInput ||
        normalizedInput.includes(s.nameEn.toLowerCase()) ||
        s.nameEn.toLowerCase().includes(normalizedInput)
      );
      if (nameEnMatch) {
        console.log('✅ Found match by nameEn:', nameEnMatch.name);
        setSelectedSubject(nameEnMatch.name);
        return;
      }
      
      // Step 5: If still no match, use the API subject name directly
      console.log('📝 Using API subject name directly (no Dari mapping found):', selectedSubjectName);
      setSelectedSubject(selectedSubjectName);
    }
  }, [selectedSubjectName]);

  useEffect(() => {
    if (selectedSubject && students.length > 0) {
      loadSubjectMarks();
    }
  }, [selectedSubject, students, examType]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await gradeManagementService.getClassStudents(classId);
      setStudents(data || []);
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubjectMarks = async () => {
    try {
      // Find subject ID by name (check both AFGHAN_SUBJECTS and direct match)
      let subject = AFGHAN_SUBJECTS.find((s) => s.name === selectedSubject);
      
      // If not found, try matching by nameEn
      if (!subject) {
        subject = AFGHAN_SUBJECTS.find((s) => s.nameEn === selectedSubject);
      }
      
      // If still not found, use selectedSubject directly as code
      const subjectCode = subject ? subject.code : selectedSubject.toUpperCase();

      const response = await gradeManagementService.getSubjectComponentMarks(
        classId,
        examType,
        subjectCode
      );

      // Load existing marks into state
      const newGrades = new Map();
      response.students.forEach((student: any) => {
        if (student.written)
          newGrades.set(`${student.studentId}-written`, student.written);
        if (student.practical)
          newGrades.set(`${student.studentId}-practical`, student.practical);
        if (student.activity)
          newGrades.set(`${student.studentId}-activity`, student.activity);
        if (student.homework)
          newGrades.set(`${student.studentId}-homework`, student.homework);
      });

      setGrades(newGrades);
      setSubjectStudents(response.students);
    } catch (error) {
      console.error("Error loading subject marks:", error);
      setGrades(new Map());
    }
  };

  const handleMarkChange = (
    studentId: string,
    field: string,
    value: string
  ) => {
    const key = `${studentId}-${field}`;
    const newMap = new Map(grades);
    newMap.set(key, parseFloat(value) || 0);
    setGrades(newMap);
  };

  const getMark = (studentId: string, field: string) => {
    const key = `${studentId}-${field}`;
    return grades.get(key) || "";
  };

  const calculateTotal = (studentId: string) => {
    const written = parseFloat(getMark(studentId, "written") as string) || 0;
    const practical =
      parseFloat(getMark(studentId, "practical") as string) || 0;
    const activity = parseFloat(getMark(studentId, "activity") as string) || 0;
    const homework = parseFloat(getMark(studentId, "homework") as string) || 0;
    return written + practical + activity + homework;
  };

  const handleSaveMarks = async () => {
    try {
      setSaving(true);

      // Find subject ID by name
      const subject = AFGHAN_SUBJECTS.find((s) => s.name === selectedSubject);
      if (!subject) {
        alert("Subject not found");
        return;
      }

      // Build marks array from grades Map
      const marksToSave: any[] = [];
      const processedStudents = new Set();

      grades.forEach((value, key) => {
        const [studentId, field] = key.split("-");
        if (!processedStudents.has(studentId)) {
          processedStudents.add(studentId);
        }
      });

      processedStudents.forEach((studentId) => {
        const written =
          parseFloat(getMark(studentId as string, "written") as string) || 0;
        const practical =
          parseFloat(getMark(studentId as string, "practical") as string) || 0;
        const activity =
          parseFloat(getMark(studentId as string, "activity") as string) || 0;
        const homework =
          parseFloat(getMark(studentId as string, "homework") as string) || 0;

        if (written || practical || activity || homework) {
          marksToSave.push({
            studentId,
            written,
            practical,
            activity,
            homework,
          });
        }
      });

      if (marksToSave.length === 0) {
        alert("No marks to save");
        return;
      }

      // Find subject code (check both AFGHAN_SUBJECTS and direct match)
      let subjectForSave = AFGHAN_SUBJECTS.find((s) => s.name === selectedSubject);
      if (!subjectForSave) {
        subjectForSave = AFGHAN_SUBJECTS.find((s) => s.nameEn === selectedSubject);
      }
      const subjectCode = subjectForSave ? subjectForSave.code : selectedSubject.toUpperCase();

      await gradeManagementService.saveSubjectComponentMarks(
        classId,
        examType,
        subjectCode,
        marksToSave
      );

      alert(
        `Successfully saved ${marksToSave.length} student marks for ${selectedSubject}!`
      );
      loadSubjectMarks(); // Reload to confirm
    } catch (error) {
      console.error("Error saving marks:", error);
      alert("Failed to save marks. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Split students into two groups: 1-41 (middle section) and 42+ (left section)
  const leftStudents = students.slice(41, 82); // Students 42-82
  const middleStudents = students.slice(0, 41); // Students 1-41

  return (
   <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100">
  {/* Hide number spinners */}
  <style>{`
    input[type=number]::-webkit-inner-spin-button,
    input[type=number]::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    input[type=number] {
      -moz-appearance: textfield;
    }
    
    /* Print styles */
    @media print {
      .no-print {
        display: none !important;
      }
      .print-border {
        border-color: black !important;
      }
    }
    
    /* Custom scrollbar */
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f1f1;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
  `}</style>

  {/* Main Content Container */}
  <div className="flex-1 overflow-auto custom-scrollbar p-4">
    <div className="max-w-[1600px] mx-auto bg-white shadow-2xl rounded-lg overflow-hidden">
      
      {/* EXCEL HEADER - Enhanced Design */}
      <div className="border-4 border-gray-800 rounded-t-lg overflow-hidden">
        
        {/* ROW 1 - Top Header */}
        <div
          className="grid border-b-2 border-gray-700 bg-purple-300"
          style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}
        >
          <div className="border-r-2 border-gray-700 p-4 text-center transition-colors">
            <p className="text-sm font-bold text-gray-800">امضاء مدیر مکتب</p>
            <div className="h-8 mt-2 border-b-2 border-dashed border-gray-400 flex items-end justify-center text-xs text-gray-600">
              {headerFields.principalName || '----------------'}
            </div>
          </div>
          <div className="border-r-2 border-gray-700 p-4 text-center ">
            <p className="text-lg font-black text-white tracking-wider drop-shadow-md">
              وزارت معارف
            </p>
            <p className="text-xs text-blue-100 mt-1">Ministry of Education</p>
          </div>
          <div className="border-r-2 border-gray-700 p-4 text-center bg-blue-200 transition-colors">
            <p className="text-sm font-bold text-gray-800">امضاء نګران</p>
            <div className="h-8 mt-2 border-b-2 border-dashed border-gray-400 flex items-end justify-center text-xs text-gray-600">
              {headerFields.supervisorName || '----------------'}
            </div>
          </div>
          <div className="p-4 text-center bg-blue-300" dir="rtl">
            <p className="text-sm font-bold text-gray-700 mb-2 text-right">نگران صنف:</p>
            <div className="w-full border-2 border-gray-600 rounded-lg px-3 py-2 bg-white shadow-sm text-gray-800 text-right" dir="rtl">
              {headerFields.supervisorName || '----------------'}
            </div>
          </div>
        </div>

        {/* ROW 2 */}
        {/* <div
          className="grid border-b border-gray-600 bg-white"
          style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}
        >
          <div className="border-r border-gray-600 p-3 hover:bg-gray-50 transition-colors"></div>
          <div className="border-r border-gray-600 p-4 text-center bg-gradient-to-r from-gray-50 to-gray-100">
            <p className="text-sm font-semibold text-gray-800">( ) ریاست معارف</p>
          </div>
          <div className="border-r border-gray-600 p-3 hover:bg-gray-50 transition-colors"></div>
          <div className="p-4 text-center bg-gray-50">
            <p className="text-sm font-bold text-gray-800">امضاء مدیر مکتب</p>
            <div className="h-6 mt-1 border-b-2 border-dashed border-gray-400"></div>
          </div>
        </div> */}

        {/* ROW 3 */}
        {/* <div
          className="grid border-b border-gray-600 bg-white"
          style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}
        >
          <div className="border-r border-gray-600 p-4 text-center hover:bg-gray-50 transition-colors">
            <p className="text-sm font-semibold text-gray-700">امضاء عضو نظارت</p>
          </div>
          <div className="border-r border-gray-600 p-4 text-center bg-gradient-to-r from-gray-50 to-gray-100">
            <p className="text-sm font-semibold text-gray-800">( ) آمریت معارف</p>
          </div>
          <div className="border-r border-gray-600 p-4 text-center hover:bg-gray-50 transition-colors">
            <p className="text-sm font-semibold text-gray-700">امضاء سرمعلم</p>
          </div>
          <div className="p-4 text-center bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">امضاء عضو نظارت</p>
          </div>
        </div> */}

        {/* ROW 4 */}
        {/* <div
          className="grid border-b border-gray-600 bg-white"
          style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}
        >
          <div className="border-r border-gray-600 p-3 text-center bg-amber-50">
            <p className="text-2xl font-black text-amber-800">1447</p>
            <p className="text-xs text-amber-600">Hijri Year</p>
          </div>
          <div className="border-r border-gray-600 p-4 text-center bg-gradient-to-r from-gray-50 to-gray-100">
            <p className="text-sm font-semibold text-gray-800">( ) لیسه عالی</p>
          </div>
          <div className="border-r border-gray-600 p-3 text-center bg-green-50">
            <p className="text-2xl font-black text-green-800">1447</p>
            <p className="text-xs text-green-600">Solar Year</p>
          </div>
          <div className="p-4 text-center bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">امضاء سر معلم</p>
          </div>
        </div> */}

        {/* ROW 5 */}
        {/* <div
          className="grid border-b-2 border-gray-700 bg-white"
          style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}
        >
          <div className="border-r border-gray-600 p-3 text-center bg-blue-50">
            <p className="text-2xl font-black text-blue-800">1404</p>
            <p className="text-xs text-blue-600">Academic Year</p>
          </div>
          <div className="border-r border-gray-600 p-4 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
            <div className="relative">
              <span className="material-icons text-7xl text-blue-400 opacity-30">
                account_balance
              </span>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600">SCHOOL</span>
              </div>
            </div>
          </div>
          <div className="border-r border-gray-600 p-3 text-center bg-purple-50" dir="rtl">
            <p className="text-xs font-bold text-purple-700 mb-2">امتحان:</p>
            <select className="w-full border-2 border-purple-400 rounded-lg px-2 py-1.5 bg-white hover:border-purple-600 focus:border-purple-600 focus:ring-2 focus:ring-purple-200 transition-all" dir="rtl">
              <option value="چهارنیما">چهارنیما</option>
              <option value="سالانه">سالانه</option>
            </select>
          </div>
          <div className="p-3 flex flex-col gap-2 bg-gray-50" dir="rtl">
            <select className="border-2 border-gray-400 rounded-lg px-2 py-1.5 bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" dir="rtl">
              <option value="1447">1447 هجری</option>
              <option value="1448">1448 هجری</option>
              <option value="1449">1449 هجری</option>
            </select>
            <select className="border-2 border-gray-400 rounded-lg px-2 py-1.5 bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" dir="rtl">
              <option value="1404">1404 شمسی</option>
              <option value="1403">1403 شمسی</option>
              <option value="1402">1402 شمسی</option>
            </select>
          </div>
        </div> */}

        {/* ROW 6 - SUBJECT SELECTION (Enhanced Yellow Highlight) */}
        <div
          className="grid border-b-4 border-gray-800"
          style={{ gridTemplateColumns: "200px 1fr 200px" }}
        >
          <div className="border-r-2 border-gray-700 p-3 text-center bg-gradient-to-br from-gray-100 to-gray-200">
            <p className="text-xs font-bold text-gray-700 mb-2">تاریخ</p>
            <input 
              type='date'
              className="w-full border-2 border-gray-400 rounded-lg px-2 py-1.5 text-sm hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
          <div className="border-r-4 border-gray-800 p-5 text-center bg-green-100" dir="rtl">
            <div className="flex items-center justify-center gap-4" dir="rtl">
              <p className="text-3xl font-normal text-gray-900">مضمون:</p>
              <p className="text-xl font-normal text-gray-900 text-right" dir="rtl">
                {selectedSubject}
              </p>
            </div>
            <p className="text-xs text-gray-700 mt-2 font-medium" dir="ltr">
              Subject:{" "}
              <span className="font-bold text-gray-900">
                {AFGHAN_SUBJECTS.find((s) => s.name === selectedSubject)?.code || 
                 AFGHAN_SUBJECTS.find((s) => s.nameEn === selectedSubject)?.code ||
                 selectedSubject.toUpperCase()}
              </span>
            </p>
          </div>
          <div className="border-r-2 border-gray-700 p-3 bg-white" dir="rtl">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-blue-50 rounded-lg p-2" dir="rtl">
                <p className="text-xs font-bold text-gray-700">صنف ( )</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2" dir="rtl">
                <p className="text-xs font-bold text-gray-700">ممتحن</p>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 7-9: COLUMN HEADERS (Enhanced) */}
        <div
          className="border-b-2 border-gray-800 flex flex-row items-center justify-center ">
               <h1>شقه نمرات و ضوابط حاضری</h1>
        </div>
      </div>

      {/* DATA GRID - Enhanced Table */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse">
          <tbody>
                <tr className="align-center">
                  <td className="text-center">ملاحظات</td>
                  <td className="text-center">مجموعه</td>
                  <td className="text-center">کارخانگی</td>
                  <td className="text-center">فعالیت صنفی</td>
                  <td className="text-center">تقریری/عملی</td>
                  <td className="text-center">تحریر</td>
                  <td className="text-center">نام پدر</td>
                  <td className="text-center">شهرت</td>
                  <td className="text-center border-r-4 border-r-black">شماره</td>
                  <td className="text-center">ملاحظات</td>
                  <td className="text-center bg-purple-100">ایام سال</td>
                  <td className="text-center bg-blue-100">رخصت</td>
                  <td className="text-center bg-yellow-100">مریض</td>
                  <td className="text-center bg-red-100">غیرحاضر</td>
                  <td className="text-center bg-green-100">حاضر</td>
                  <td className="text-center">شماره</td>
                </tr>
            {Array.from({ length: 41 }).map((_, index) => {
              const leftStudent = leftStudents[index];
              const middleStudent = middleStudents[index];
              const isEvenRow = index % 2 === 0;

              return (
                <React.Fragment key={index}>
                 
                <tr
                  className={`border-b border-gray-400 hover:bg-blue-50 transition-colors ${
                    isEvenRow ? 'bg-gray-50' : 'bg-white'
                  }`}
                  style={{ height: "32px" }}
                >
                 
                  {/* MIDDLE SECTION: Students 1-41 */}

                  <td
                    className="border-r border-gray-400 p-1 text-center"
                    style={{ width: "80px" }}
                  >
                    <input
                      type="text"
                      className="w-full h-7 px-2 text-[10px] text-center border border-gray-300 rounded focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      disabled={!editable}
                    />
                  </td>
                  <td
                    className="border-r-2 border-gray-400 p-1 bg-gradient-to-r from-yellow-100 to-yellow-200 text-center"
                    style={{ width: "70px" }}
                  >
                    <span className="text-base font-black text-gray-900 px-2 py-1 bg-yellow-300 rounded-full inline-block min-w-[40px] shadow-sm">
                      {middleStudent
                        ? calculateTotal(middleStudent.id).toFixed(0)
                        : ""}
                    </span>
                  </td>
                  <td
                    className="border-r border-gray-400 p-1 text-center"
                    style={{ width: "70px" }}
                  >
                    {middleStudent ? (
                      <input
                        type="number"
                        className="w-full h-7 px-2 text-sm text-center border-2 border-gray-300 rounded-lg hover:border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                        placeholder="0"
                        value={getMark(middleStudent.id, "homework")}
                        onChange={(e) =>
                          handleMarkChange(
                            middleStudent.id,
                            "homework",
                            e.target.value
                          )
                        }
                      />
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td
                    className="border-r border-gray-400 p-1 text-center"
                    style={{ width: "90px" }}
                  >
                    {middleStudent ? (
                      <input
                        type="number"
                        className="w-full h-7 px-2 text-sm text-center border-2 border-gray-300 rounded-lg hover:border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                        placeholder="0"
                        value={getMark(middleStudent.id, "activity")}
                        onChange={(e) =>
                          handleMarkChange(
                            middleStudent.id,
                            "activity",
                            e.target.value
                          )
                        }
                      />
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td
                    className="border-r border-gray-400 p-1 text-center"
                    style={{ width: "90px" }}
                  >
                    {middleStudent ? (
                      <input
                        type="number"
                        className="w-full h-7 px-2 text-sm text-center border-2 border-gray-300 rounded-lg hover:border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                        placeholder="0"
                        value={getMark(middleStudent.id, "practical")}
                        onChange={(e) =>
                          handleMarkChange(
                            middleStudent.id,
                            "practical",
                            e.target.value
                          )
                        }
                      />
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td
                    className="border-r border-gray-400 p-1 text-center"
                    style={{ width: "70px" }}
                  >
                    {middleStudent ? (
                      <input
                        type="number"
                        className="w-full h-7 px-2 text-sm text-center border-2 border-gray-300 rounded-lg hover:border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                        placeholder="0"
                        value={getMark(middleStudent.id, "written")}
                        onChange={(e) =>
                          handleMarkChange(
                            middleStudent.id,
                            "written",
                            e.target.value
                          )
                        }
                      />
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td
                    className="border-r border-gray-400 p-1.5"
                    style={{ width: "130px" }}
                    dir="rtl"
                  >
                  
                    {middleStudent && (
                      <div className="text-[10px] text-black text-right" dir="rtl">
                        <div className="font-bold text-gray-900">
                          {middleStudent.parent?.user?.dariName || 
                           `${middleStudent.user?.firstName || ""} ${middleStudent.user?.lastName || ""}`.trim()}
                        </div>
                      </div>
                    )}
                  </td>
                  <td
                    className="border-r border-gray-400 p-1.5"
                    style={{ width: "130px" }}
                    dir="rtl"
                  >
                    {middleStudent && (
                      <div className="text-[10px] text-black text-right" dir="rtl">
                        <div className="font-bold text-gray-900">
                          {middleStudent.user?.dariName || 
                           middleStudent.user?.fatherName || 
                           `${middleStudent.parent?.user?.firstName || ""} ${middleStudent.parent?.user?.lastName || ""}`.trim() || "-"}
                        </div>
                      </div>
                    )}
                  </td>
                  <td
                    className="border-r-4 border-gray-700 p-1 text-center bg-gradient-to-r from-green-100 to-green-200"
                    style={{ width: "50px" }}
                  >
                    {middleStudent && (
                      <span className="text-sm font-black text-green-900">
                        {index + 1}
                      </span>
                    )}
                  </td>

                  {/* RIGHT SECTION: Attendance */}
                  
                  <td
                    className="border-r border-gray-400 p-1 text-center"
                    style={{ width: "80px" }}
                  >
                    <input
                      type="text"
                      className="w-full h-7 px-2 text-[10px] text-center border border-gray-300 rounded focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                  </td>
                  <td
                    className="border-r border-gray-400 p-1 bg-purple-50 text-center"
                    style={{ width: "60px" }}
                  >
                    <input
                      type="number"
                      className="w-full h-7 px-1 text-xs text-center border border-purple-300 rounded focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                      placeholder="0"
                    />
                  </td>
                  <td
                    className="border-r border-gray-400 p-1 bg-blue-50 text-center"
                    style={{ width: "60px" }}
                  >
                    <input
                      type="number"
                      className="w-full h-7 px-1 text-xs text-center border border-blue-300 rounded focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="0"
                    />
                  </td>
                  <td
                    className="border-r border-gray-400 p-1 bg-yellow-50 text-center"
                    style={{ width: "60px" }}
                  >
                    <input
                      type="number"
                      className="w-full h-7 px-1 text-xs text-center border border-yellow-300 rounded focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all"
                      placeholder="0"
                    />
                  </td>
                  <td
                    className="border-r border-gray-400 p-1 bg-red-50 text-center"
                    style={{ width: "60px" }}
                  >
                    <input
                      type="number"
                      className="w-full h-7 px-1 text-xs text-center border border-red-300 rounded focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                      placeholder="0"
                    />
                  </td>
                  <td
                    className="border-r border-gray-400 p-1 bg-green-50 text-center"
                    style={{ width: "60px" }}
                  >
                    <input
                      type="number"
                      className="w-full h-7 px-1 text-xs text-center border border-green-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      placeholder="0"
                    />
                  </td>
                  <td
                    className="p-1 text-center bg-gradient-to-r from-purple-100 to-purple-200"
                    style={{ width: "50px" }}
                  >
                    {middleStudent && (
                      <span className="text-sm font-black text-purple-900">
                        {index + 1}
                      </span>
                    )}
                  </td>
                </tr>
                </React.Fragment>
                
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FOOTER - Enhanced Design - Hide for TEACHER role */}
      {user?.role !== 'TEACHER' && (
        <div className="border-t-4 border-gray-800 bg-white">
          <div
            className="grid border-b-2 border-gray-600 text-center"
            style={{ gridTemplateColumns: "2fr 1fr 2fr" }}
          >
            <div className="border-r-2 border-gray-600 p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
              <p className="text-xs text-gray-800 leading-relaxed">
                از روی اوراق امتحان شاگردان درج شقه هذا گردیده بدون قلم خوردگی و
                تراش به اداره محترم تسلیم است.
              </p>
            </div>
            <div className="border-r-2 border-gray-600 p-3 text-center bg-gradient-to-br from-yellow-50 to-amber-50">
              <p className="text-xs font-semibold text-gray-800">قرار شرح فوق نمرات مضمون ( )</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50">
              <p className="text-xs text-gray-800 leading-relaxed">
                قرار شرح فوق ضوابط حاضری امتحان ( ) از روی حاضری یومیه درج شقه هذا
                گردیده...
              </p>
            </div>
          </div>

          <div
            className="grid border-b border-gray-600"
            style={{ gridTemplateColumns: "2fr 1fr 2fr" }}
          >
            <div className="border-r-2 border-gray-600 p-3 flex items-center gap-3 bg-white">
              <span className="text-xs font-semibold text-gray-700">غایب/ محروم:</span>
              <input
                type="text"
                className="flex-1 px-3 py-2 border-2 border-gray-400 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
            <div className="border-r-2 border-gray-600 p-3 flex items-center gap-3 bg-gray-50">
              <span className="text-xs font-semibold text-gray-700">تعداد داخله:</span>
              <input
                type="text"
                className="flex-1 px-3 py-2 border-2 border-gray-400 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
            <div className="p-4 bg-white flex items-center">
              <p className="text-xs text-gray-800">
                را با حاضری یومیه و عمومی تطبیق نمودیم
              </p>
            </div>
          </div>

          <div
            className="grid border-b-2 border-gray-600"
            style={{ gridTemplateColumns: "2fr 1fr 2fr" }}
          >
            <div className="border-r-2 border-gray-600 p-3 flex items-center gap-3 bg-gray-50">
              <span className="text-xs font-semibold text-gray-700">غایب/ محروم:</span>
              <input
                type="text"
                className="flex-1 px-3 py-2 border-2 border-gray-400 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
            <div className="border-r-2 border-gray-600 p-3 flex items-center gap-3 bg-white">
              <span className="text-xs font-semibold text-gray-700">شامل امتحان:</span>
              <input
                type="text"
                className="flex-1 px-3 py-2 border-2 border-gray-400 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
            <div className="p-3 flex items-center gap-3 bg-gray-50">
              <span className="text-xs font-semibold text-gray-700">تعداد داخله:</span>
              <input
                type="text"
                className="flex-1 px-3 py-2 border-2 border-gray-400 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
          </div>

          <div
            className="grid"
            style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
          >
            <div className="border-r-2 border-gray-600 p-4 text-center bg-gradient-to-br from-amber-50 to-orange-50">
              <p className="text-xs text-gray-800 mb-3 font-semibold">
                امضاء ممیز ( ) امضاء ممتحن ( )
              </p>
              <div className="h-16 border-t-4 border-dashed border-gray-400 mt-4"></div>
            </div>
            <div className="border-r-2 border-gray-600 p-4 text-center bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
              <p className="text-lg font-black text-green-800">صحت است</p>
            </div>
            <div className="p-4 text-center bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
              <p className="text-sm font-semibold text-gray-800">شامل امتحان ( )</p>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>

  {/* Action Bar - Enhanced (visible for teachers and admins) */}
  <div className="no-print bg-blue-500 shadow-2xl">
  <div className="max-w-[1600px] mx-auto p-3 sm:p-4 lg:p-6">
    {/* Mobile Layout */}
    <div className="flex flex-col gap-3 sm:hidden">
      {/* Info Badges - Stacked on Mobile */}
      <div className="flex flex-col gap-2">
        <div className="bg-white rounded-lg px-3 py-2.5 shadow-md">
          <div className="flex items-center gap-2">
            <span className="material-icons text-lg text-blue-600">
              edit_note
            </span>
            <span className="text-xs font-medium text-gray-700">
              Marks entered:{" "}
              <span className="text-blue-600 font-bold">
                {Math.floor(grades.size / 4)}
              </span>{" "}
              students
            </span>
          </div>
        </div>
        <div className="bg-white rounded-lg px-3 py-2.5 shadow-md">
          <div className="flex items-center gap-2">
            <span className="material-icons text-lg text-blue-600">
              menu_book
            </span>
            <span className="text-xs font-medium text-gray-700">
              Subject:{" "}
              <span className="text-blue-600 font-bold">{selectedSubject}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons - Stacked on Mobile */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleSaveMarks}
          disabled={saving || grades.size === 0}
          className="w-full px-4 py-3 bg-white text-blue-700 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
              <span className="text-sm">Saving...</span>
            </>
          ) : (
            <>
              <span className="material-icons text-lg">save</span>
              <span className="text-sm">Save Marks for {selectedSubject}</span>
            </>
          )}
        </button>
        <button
          onClick={() => {
            setGrades(new Map());
            loadSubjectMarks();
          }}
          disabled={saving}
          className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-lg font-semibold hover:bg-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span className="material-icons text-lg">refresh</span>
          <span className="text-sm">Reset</span>
        </button>
      </div>
    </div>

    {/* Tablet Layout (sm to lg) */}
    <div className="hidden sm:flex lg:hidden flex-col gap-3">
      {/* Info Badges - Horizontal on Tablet */}
      <div className="flex gap-3">
        <div className="flex-1 bg-white rounded-lg px-4 py-2.5 shadow-md">
          <div className="flex items-center gap-2">
            <span className="material-icons text-lg text-blue-600">
              edit_note
            </span>
            <span className="text-sm font-medium text-gray-700">
              Marks entered:{" "}
              <span className="text-blue-600 font-bold">
                {Math.floor(grades.size / 4)}
              </span>{" "}
              students
            </span>
          </div>
        </div>
        <div className="flex-1 bg-white rounded-lg px-4 py-2.5 shadow-md">
          <div className="flex items-center gap-2">
            <span className="material-icons text-lg text-blue-600">
              menu_book
            </span>
            <span className="text-sm font-medium text-gray-700">
              Subject:{" "}
              <span className="text-blue-600 font-bold">{selectedSubject}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons - Horizontal on Tablet */}
      <div className="flex gap-3">
        <button
          onClick={handleSaveMarks}
          disabled={saving || grades.size === 0}
          className="flex-1 px-6 py-3 bg-white text-blue-700 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <span className="material-icons text-lg">save</span>
              <span>Save Marks for {selectedSubject}</span>
            </>
          )}
        </button>
        <button
          onClick={() => {
            setGrades(new Map());
            loadSubjectMarks();
          }}
          disabled={saving}
          className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-lg font-semibold hover:bg-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span className="material-icons text-lg">refresh</span>
          <span>Reset</span>
        </button>
      </div>
    </div>

    {/* Desktop Layout (lg and up) */}
    <div className="hidden lg:flex justify-between items-center">
      {/* Info Badges */}
      <div className="flex items-center gap-4">
        <div className="bg-white rounded-lg px-5 py-3 shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 rounded-full p-1.5">
              <span className="material-icons text-base text-blue-600">
                edit_note
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 font-medium block">
                Marks Entered
              </span>
              <span className="text-lg text-blue-600 font-bold">
                {Math.floor(grades.size / 4)}
              </span>
              <span className="text-xs text-gray-600 ml-1">students</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg px-5 py-3 shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-100 rounded-full p-1.5">
              <span className="material-icons text-base text-indigo-600">
                menu_book
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 font-medium block">
                Current Subject
              </span>
              <span className="text-lg text-indigo-600 font-bold">
                {selectedSubject}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            setGrades(new Map());
            loadSubjectMarks();
          }}
          disabled={saving}
          className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl font-semibold hover:bg-white/20 hover:border-white/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg"
        >
          <span className="material-icons text-lg">refresh</span>
          <span>Reset</span>
        </button>
        <button
          onClick={handleSaveMarks}
          disabled={saving || grades.size === 0}
          className="px-8 py-3 bg-white text-blue-700 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 hover:bg-blue-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <span className="material-icons text-lg">save</span>
              <span>Save Marks for {selectedSubject}</span>
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

export default SignatureWorkflowSheet;
