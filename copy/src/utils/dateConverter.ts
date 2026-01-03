/**
 * Afghanistan/Dari/Pashto Date Converter
 * Converts Gregorian dates to Afghanistan solar calendar (Jalali)
 */

export interface DateFormatOptions {
  year: 'numeric' | '2-digit';
  month: 'numeric' | '2-digit' | 'long' | 'short';
  day: 'numeric' | '2-digit';
}

/**
 * Convert Gregorian date to Jalali (Afghanistan/Dari/Persian) calendar
 * Reference: https://en.wikipedia.org/wiki/Solar_Hijri_calendar
 */
export function gregorianToJalali(gDate: Date): { year: number; month: number; day: number } {
  const gy = gDate.getFullYear();
  const gm = gDate.getMonth() + 1; // JS months are 0-indexed
  const gd = gDate.getDate();

  let jy, jm, jd;

  const g_d_n = 365 * gy + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400) + gd;
  let j_d_n = g_d_n - (365 * 1600 + Math.floor((1600 + 3) / 4) - Math.floor((1600 + 99) / 100) + Math.floor((1600 + 399) / 400) + 79);

  jy = -1600 + 400 * Math.floor(j_d_n / 146097);
  j_d_n %= 146097;

  let leap = true;
  if (j_d_n >= 36525) {
    j_d_n--;
    jy += 100 * Math.floor(j_d_n / 36524);
    j_d_n %= 36524;
    if (j_d_n >= 365) j_d_n++;
    leap = false;
  }

  jy += 4 * Math.floor(j_d_n / 1461);
  j_d_n %= 1461;

  if (leap) {
    if (j_d_n >= 366) {
      j_d_n--;
      jy += Math.floor(j_d_n / 365);
      j_d_n = (j_d_n % 365);
    }
  } else {
    jy += Math.floor(j_d_n / 365);
    j_d_n = j_d_n % 365;
  }

  const sal_a = [0, 31, 62, 93, 124, 155, 186, 216, 246, 276, 306, 336, 365];
  for (jm = 0; jm < 13; jm++) {
    v = sal_a[jm];
    if (j_d_n < v) break;
  }

  if (jm > 1) jd = j_d_n - sal_a[jm - 1] + 1;
  else jd = j_d_n + 1;

  return { year: jy, month: jm, day: jd };
}

let v: number;

/**
 * Format Jalali date to string
 */
export function formatJalaliDate(
  jalaliDate: { year: number; month: number; day: number },
  options: DateFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
): string {
  const months = {
    short: ['Far', 'Ord', 'Kho', 'Tir', 'Mor', 'Sha', 'Meh', 'Aba', 'Aza', 'Dey', 'Bah', 'Esf'],
    long: [
      'Farvardin',
      'Ordibehesht',
      'Khordad',
      'Tir',
      'Mordad',
      'Shahrivar',
      'Mehr',
      'Aban',
      'Azar',
      'Dey',
      'Bahman',
      'Esfand',
    ],
  };

  const dariMonths = {
    short: ['فرو', 'ارد', 'خرد', 'تیر', 'مرد', 'شهر', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسف'],
    long: [
      'فروردین',
      'اردیبهشت',
      'خرداد',
      'تیر',
      'مرداد',
      'شهریور',
      'مهر',
      'آبان',
      'آذر',
      'دی',
      'بهمن',
      'اسفند',
    ],
  };

  const pashtoMonths = {
    short: ['فرو', 'ارد', 'خرد', 'تیر', 'مرد', 'شهر', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسف'],
    long: [
      'فروردین',
      'اردیبهشت',
      'خرداد',
      'تیر',
      'مرداد',
      'شهریور',
      'مهر',
      'آبان',
      'آذر',
      'دی',
      'بهمن',
      'اسفند',
    ],
  };

  let year = String(jalaliDate.year);
  if (options.year === '2-digit') {
    year = year.slice(-2);
  }

  let month = String(jalaliDate.month).padStart(2, '0');
  if (options.month === 'long') {
    month = dariMonths.long[jalaliDate.month - 1];
  } else if (options.month === 'short') {
    month = dariMonths.short[jalaliDate.month - 1];
  }

  let day = String(jalaliDate.day);
  if (options.day === '2-digit') {
    day = day.padStart(2, '0');
  }

  if (options.month === 'long' || options.month === 'short') {
    return `${day} ${month} ${year}`;
  }
  return `${year}/${month}/${day}`;
}

/**
 * Convert Gregorian date to Afghanistan/Dari formatted string
 */
export function toAfghanistanDate(
  date: Date | string,
  language: 'en' | 'fa' | 'ps' = 'en'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const jalali = gregorianToJalali(d);

  if (language === 'en') {
    return `${jalali.year}/${String(jalali.month).padStart(2, '0')}/${String(jalali.day).padStart(2, '0')}`;
  }

  // Dari/Pashto use the same Jalali calendar
  const monthNames = [
    'فروردین',
    'اردیبهشت',
    'خرداد',
    'تیر',
    'مرداد',
    'شهریور',
    'مهر',
    'آبان',
    'آذر',
    'دی',
    'بهمن',
    'اسفند',
  ];

  return `${jalali.day} ${monthNames[jalali.month - 1]} ${jalali.year}`;
}

/**
 * Format date by locale (supports English, Dari, Pashto)
 */
export function formatDateByLocale(dateString: string | Date, language: string = 'en'): string {
  const d = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  if (language.startsWith('fa') || language.startsWith('ps')) {
    return toAfghanistanDate(d, language.startsWith('fa') ? 'fa' : 'ps');
  }
  
  return d.toLocaleDateString('en-US');
}

/**
 * Convert Gregorian year to Shamsi (Jalali) year
 */
export function gregorianYearToShamsi(gregorianYear: number): number {
  // For simplicity, Shamsi year is roughly 621 years behind Gregorian
  // More precise: Shamsi year 1 = Gregorian year 622
  return gregorianYear - 621;
}
