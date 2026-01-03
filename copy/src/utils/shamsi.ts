/**
 * Shamsi (Solar Hijri) Calendar Utilities
 * Provides functions for working with the Afghan/Iranian Solar Hijri calendar
 */

export interface ShamsiMonth {
  id: number;
  key: string;
  label: string;
}

/**
 * Shamsi month names in order (starting from Hamal = month 1)
 */
export const SHAMSI_MONTHS: ShamsiMonth[] = [
  { id: 1, key: 'hamal', label: 'Hamal' },
  { id: 2, key: 'saur', label: 'Saur' },
  { id: 3, key: 'jawza', label: 'Jawza' },
  { id: 4, key: 'saratan', label: 'Saratan' },
  { id: 5, key: 'asad', label: 'Asad' },
  { id: 6, key: 'sunbula', label: 'Sunbula' },
  { id: 7, key: 'mizan', label: 'Mizan' },
  { id: 8, key: 'aqrab', label: 'Aqrab' },
  { id: 9, key: 'qaws', label: 'Qaws' },
  { id: 10, key: 'jadi', label: 'Jadi' },
  { id: 11, key: 'dalw', label: 'Dalw' },
  { id: 12, key: 'hoot', label: 'Hoot' },
];

/**
 * Get all Shamsi months
 * @returns Array of Shamsi month objects
 */
export const getShamsiMonths = (): ShamsiMonth[] => {
  return SHAMSI_MONTHS;
};

const GREGORIAN_DAY_OFFSETS = [
  0,
  31,
  59,
  90,
  120,
  151,
  181,
  212,
  243,
  273,
  304,
  334,
];

interface SolarHijriDate {
  year: number;
  month: number;
  day: number;
}

const toDate = (value: Date | string | number): Date => {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date value provided to gregorianToSolarHijri');
  }
  return date;
};

/**
 * Convert Shamsi year and month to approximate Gregorian date range
 * Note: This is an approximation. Shamsi calendar year starts around March 21st (Nowruz)
 * and each Shamsi month corresponds roughly to a Gregorian month period.
 * 
 * @param shamsiYear - Shamsi year (e.g., 1403)
 * @param shamsiMonth - Shamsi month (1-12)
 * @returns Object with startISO and endISO dates in YYYY-MM-DD format
 */
export const shamsiMonthRangeToGregorian = (
  shamsiYear: number,
  shamsiMonth: number
): { startISO: string; endISO: string } => {
  // Shamsi calendar starts around March 21 (Nowruz)
  // Convert Shamsi year to approximate Gregorian year
  // Shamsi year ≈ Gregorian year - 621
  const gregorianBaseYear = shamsiYear + 621;
  
  // Shamsi months map approximately to Gregorian months:
  // 1 (Hamal) ≈ Mar 21 - Apr 20
  // 2 (Saur) ≈ Apr 21 - May 21
  // 3 (Jawza) ≈ May 22 - Jun 21
  // 4 (Saratan) ≈ Jun 22 - Jul 22
  // 5 (Asad) ≈ Jul 23 - Aug 22
  // 6 (Sunbula) ≈ Aug 23 - Sep 22
  // 7 (Mizan) ≈ Sep 23 - Oct 22
  // 8 (Aqrab) ≈ Oct 23 - Nov 21
  // 9 (Qaws) ≈ Nov 22 - Dec 21
  // 10 (Jadi) ≈ Dec 22 - Jan 20
  // 11 (Dalw) ≈ Jan 21 - Feb 19
  // 12 (Hoot) ≈ Feb 20 - Mar 20
  
  let startMonth: number;
  let startDay: number;
  let endMonth: number;
  let endDay: number;
  
  switch (shamsiMonth) {
    case 1: // Hamal: Mar 21 - Apr 20
      startMonth = 2; // March (0-indexed)
      startDay = 21;
      endMonth = 3; // April
      endDay = 20;
      break;
    case 2: // Saur: Apr 21 - May 21
      startMonth = 3;
      startDay = 21;
      endMonth = 4;
      endDay = 21;
      break;
    case 3: // Jawza: May 22 - Jun 21
      startMonth = 4;
      startDay = 22;
      endMonth = 5;
      endDay = 21;
      break;
    case 4: // Saratan: Jun 22 - Jul 22
      startMonth = 5;
      startDay = 22;
      endMonth = 6;
      endDay = 22;
      break;
    case 5: // Asad: Jul 23 - Aug 22
      startMonth = 6;
      startDay = 23;
      endMonth = 7;
      endDay = 22;
      break;
    case 6: // Sunbula: Aug 23 - Sep 22
      startMonth = 7;
      startDay = 23;
      endMonth = 8;
      endDay = 22;
      break;
    case 7: // Mizan: Sep 23 - Oct 22
      startMonth = 8;
      startDay = 23;
      endMonth = 9;
      endDay = 22;
      break;
    case 8: // Aqrab: Oct 23 - Nov 21
      startMonth = 9;
      startDay = 23;
      endMonth = 10;
      endDay = 21;
      break;
    case 9: // Qaws: Nov 22 - Dec 21
      startMonth = 10;
      startDay = 22;
      endMonth = 11;
      endDay = 21;
      break;
    case 10: // Jadi: Dec 22 - Jan 20 (next year)
      startMonth = 11;
      startDay = 22;
      endMonth = 0; // January (next year)
      endDay = 20;
      break;
    case 11: // Dalw: Jan 21 - Feb 19 (next year)
      startMonth = 0;
      startDay = 21;
      endMonth = 1;
      endDay = 19;
      break;
    case 12: // Hoot: Feb 20 - Mar 20 (next year)
      startMonth = 1;
      startDay = 20;
      endMonth = 2;
      endDay = 20;
      break;
    default:
      // Default to current month if invalid
      const now = new Date();
      startMonth = now.getMonth();
      startDay = 1;
      endMonth = now.getMonth();
      endDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  }
  
  // Calculate the year (adjust if month wraps to next year)
  let startYear = gregorianBaseYear;
  let endYear = gregorianBaseYear;
  
  // If Shamsi month is 10, 11, or 12, the end date may be in the next Gregorian year
  if (shamsiMonth >= 10 && shamsiMonth <= 12) {
    endYear = gregorianBaseYear + 1;
  }
  
  // Create date objects
  const startDate = new Date(startYear, startMonth, startDay);
  const endDate = new Date(endYear, endMonth, endDay);
  
  // Format as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return {
    startISO: formatDate(startDate),
    endISO: formatDate(endDate),
  };
};

/**
 * Convert a Shamsi year to an approximate Gregorian date range
 * covering the full Shamsi year (Hamal 1 through Hoot 29/30).
 *
 * @param shamsiYear - Shamsi year (e.g., 1403)
 * @returns start/end ISO strings in YYYY-MM-DD format
 */
export const shamsiYearRangeToGregorian = (
  shamsiYear: number
): { startISO: string; endISO: string } => {
  const start = shamsiMonthRangeToGregorian(shamsiYear, 1);
  const end = shamsiMonthRangeToGregorian(shamsiYear, 12);
  return {
    startISO: start.startISO,
    endISO: end.endISO,
  };
};

/**
 * Get the current Shamsi (Solar Hijri) year based on today's date.
 * This uses a simple approximation by comparing with Nowruz (Mar 21).
 *
 * @returns Current Shamsi year (e.g., 1403)
 */
export const getCurrentShamsiYear = (): number => {
  const today = new Date();
  const gregorianYear = today.getFullYear();
  const nowruz = new Date(gregorianYear, 2, 21); // March is month index 2

  const shamsiYearOffset = 621;
  if (today >= nowruz) {
    return gregorianYear - shamsiYearOffset;
  }
  return gregorianYear - shamsiYearOffset - 1;
};

const isShamsiLeapYear = (shamsiYear: number): boolean => {
  const year = shamsiYear > 0 ? shamsiYear : shamsiYear - 1;
  return (((year + 38) * 682) % 2816) < 682;
};

/**
 * Convert a Gregorian date to Solar Hijri (Shamsi) components.
 *
 * @param value - Date instance, timestamp, or ISO-like string
 * @returns An object containing the Solar Hijri year, month (1-12), and day (1-31)
 */
export const gregorianToSolarHijri = (value: Date | string | number): SolarHijriDate => {
  const date = toDate(value);
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1; // 1-12
  const gd = date.getDate();

  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    (365 * gy) +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    GREGORIAN_DAY_OFFSETS[gm - 1];

  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;

  jy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  const jm = days < 186 ? Math.floor(days / 31) + 1 : Math.floor((days - 186) / 30) + 7;
  const jd = days < 186 ? (days % 31) + 1 : ((days - 186) % 30) + 1;

  return {
    year: jy,
    month: jm,
    day: jd,
  };
};

/**
 * Get the number of days in a given Shamsi month.
 *
 * @param shamsiYear - Shamsi year
 * @param shamsiMonth - Month index (1-12)
 * @returns Number of days (29-31)
 */
export const getDaysInShamsiMonth = (shamsiYear: number, shamsiMonth: number): number => {
  if (shamsiMonth < 1 || shamsiMonth > 12) {
    throw new RangeError('Shamsi month must be between 1 and 12');
  }

  if (shamsiMonth <= 6) {
    return 31;
  }

  if (shamsiMonth <= 11) {
    return 30;
  }

  return isShamsiLeapYear(shamsiYear) ? 30 : 29;
};

/**
 * Get the display label for a Shamsi month.
 * This returns the key for i18n translation lookup.
 *
 * @param shamsiMonth - Month index (1-12)
 * @returns The translation key (e.g., "hamal")
 */
export const getShamsiMonthName = (shamsiMonth: number): string => {
  const month = SHAMSI_MONTHS.find((item) => item.id === shamsiMonth);
  return month ? month.key : '';
};

