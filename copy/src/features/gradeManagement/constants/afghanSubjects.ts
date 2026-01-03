/**
 * 14 Standard Afghan Education Subjects
 * Matches Excel file structure
 */
export const AFGHAN_SUBJECTS = [
  { name: 'قرانکریم', nameEn: 'Holy Quran', code: 'QURAN', creditHours: 3, order: 1 },
  { name: 'دنیات', nameEn: 'Religious Studies', code: 'DEEN', creditHours: 2, order: 2 },
  { name: 'دری', nameEn: 'Dari (Persian)', code: 'DARI', creditHours: 4, order: 3 },
  { name: 'پشتو', nameEn: 'Pashto', code: 'PASHTO', creditHours: 4, order: 4 },
  { name: 'لسان سوم', nameEn: 'Third Language', code: 'LANG3', creditHours: 2, order: 5 },
  { name: 'انګلیسی', nameEn: 'English', code: 'ENGLISH', creditHours: 3, order: 6 },
  { name: 'ریاضی', nameEn: 'Mathematics', code: 'MATH', creditHours: 4, order: 7 },
  { name: 'ساینس', nameEn: 'Science', code: 'SCIENCE', creditHours: 4, order: 8 },
  { name: 'اجتماعیات', nameEn: 'Social Studies', code: 'SOCIAL', creditHours: 3, order: 9 },
  { name: 'خط/ رسم', nameEn: 'Calligraphy/Drawing', code: 'ART', creditHours: 2, order: 10 },
  { name: 'مهارت زندگی', nameEn: 'Life Skills', code: 'LIFESKILLS', creditHours: 2, order: 11 },
  { name: 'تربیت بدنی', nameEn: 'Physical Education', code: 'PE', creditHours: 2, order: 12 },
  { name: 'تهذیب', nameEn: 'Ethics/Manners', code: 'ETHICS', creditHours: 1, order: 13 },
  { name: 'کمپیوتر', nameEn: 'Computer', code: 'COMPUTER', creditHours: 2, order: 14 }
];

/**
 * 10-Level Approval Hierarchy (Excel pattern)
 * امضا و تائیدی مسئولین
 */
export const APPROVAL_LEVELS = [
  { level: 1, title: 'نگران صنف', titleEn: 'Class Teacher', required: true },
  { level: 2, title: 'سرمعلم مربوطه', titleEn: 'Head Teacher', required: true },
  { level: 3, title: 'هیئت نفر اول', titleEn: 'Committee Member 1', required: true },
  { level: 4, title: 'هیئت نفر دوم', titleEn: 'Committee Member 2', required: true },
  { level: 5, title: 'هیئت نفر سوم', titleEn: 'Committee Member 3', required: true },
  { level: 6, title: 'مدیر تدریسی', titleEn: 'Academic Director', required: true },
  { level: 7, title: 'امر مکتب', titleEn: 'School Principal', required: true },
  { level: 8, title: 'امریت معارف حوزه/ولسوالی', titleEn: 'District Education Directorate', required: false },
  { level: 9, title: 'ریاست معارف', titleEn: 'Provincial Education Department', required: false },
  { level: 10, title: 'وزارت معارف', titleEn: 'Ministry of Education', required: false }
];

/**
 * Excel Status Messages (Motivational)
 */
export const STATUS_MESSAGES = {
  'ارتقا صنف': 'به دلیل اینکه از روند آموزشی یک ساله نتیجه مثبت به‌ دست اورده اید، این موفقیت را به شما و خانواده محترم شما تبریک عرض میداریم، ارزومندیم که در عرصه علمی بیشتر بدرخشید...!',
  'موفق': 'به دلیل اینکه از روند آموزشی نتیجه مثبت به‌ دست اورده اید، این موفقیت را به شما و خانواده محترم شما تبریک عرض میداریم، ارزومندیم که در عرصه علمی بیشتر بدرخشید...!',
  'مشروط': 'ناامید نشوید، تلاش کنید، حتماً موفق خواهید شد...!',
  'تلاش بیشتر': 'ناامید نشوید، تلاش کنید، حتماً موفق خواهید شد...!',
  'تکرار صنف': 'ناامید نشوید، تلاش کنید، حتماً موفق خواهید شد...!',
  'محروم': '',
  'معذرتی': '',
  'غایب': '',
  'سه پارچه': ''
};

/**
 * Academic Year Configuration (Excel)
 */
export const ACADEMIC_YEAR = {
  solarHijri: 1404,      // هجري شمسي
  lunarHijri: 1447,      // هجري قمري
  gregorian: '2025-2026'
};





