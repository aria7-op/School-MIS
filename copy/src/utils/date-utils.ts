/**
 * Date and Time Utility Functions
 * Provides consistent formatting for dates and times across the application
 */

/**
 * Format a timestamp to show time in AM/PM format
 * @param time - ISO string, Date object, or timestamp
 * @param options - Formatting options
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export const formatTime = (
  time: string | Date | number | null | undefined,
  options: {
    showSeconds?: boolean;
    showDate?: boolean;
    showYear?: boolean;
    timezone?: string;
  } = {}
): string => {
  if (!time) return '--';
  
  try {
    const date = new Date(time);
    
    if (isNaN(date.getTime())) {
      return '--';
    }

    const {
      showSeconds = false,
      showDate = false,
      showYear = false,
      timezone
    } = options;

    if (showDate) {
      return date.toLocaleString('en-US', {
        timeZone: timezone,
        year: showYear ? 'numeric' : undefined,
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: showSeconds ? '2-digit' : undefined,
        hour12: true,
      });
    }

    return date.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: showSeconds ? '2-digit' : undefined,
      hour12: true,
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '--';
  }
};

/**
 * Format a timestamp to show date and time in AM/PM format
 * @param time - ISO string, Date object, or timestamp
 * @param options - Formatting options
 * @returns Formatted date and time string (e.g., "12/25/2024, 2:30 PM")
 */
export const formatDateTime = (
  time: string | Date | number | null | undefined,
  options: {
    showSeconds?: boolean;
    showYear?: boolean;
    timezone?: string;
  } = {}
): string => {
  return formatTime(time, { ...options, showDate: true });
};

/**
 * Format a timestamp to show only the date
 * @param time - ISO string, Date object, or timestamp
 * @param options - Formatting options
 * @returns Formatted date string (e.g., "12/25/2024")
 */
export const formatDate = (
  time: string | Date | number | null | undefined,
  options: {
    showYear?: boolean;
    timezone?: string;
  } = {}
): string => {
  if (!time) return '--';
  
  try {
    const date = new Date(time);
    
    if (isNaN(date.getTime())) {
      return '--';
    }

    const { showYear = true, timezone } = options;

    return date.toLocaleDateString('en-US', {
      timeZone: timezone,
      year: showYear ? 'numeric' : undefined,
      month: '2-digit',
      day: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '--';
  }
};

/**
 * Get relative time (e.g., "2 hours ago", "yesterday")
 * @param time - ISO string, Date object, or timestamp
 * @returns Relative time string
 */
export const getRelativeTime = (time: string | Date | number | null | undefined): string => {
  if (!time) return '--';
  
  try {
    const date = new Date(time);
    
    if (isNaN(date.getTime())) {
      return '--';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return formatDate(date, { showYear: true });
  } catch (error) {
    console.error('Error getting relative time:', error);
    return '--';
  }
};

/**
 * Check if a time is today
 * @param time - ISO string, Date object, or timestamp
 * @returns boolean
 */
export const isToday = (time: string | Date | number | null | undefined): boolean => {
  if (!time) return false;
  
  try {
    const date = new Date(time);
    const today = new Date();
    
    return date.toDateString() === today.toDateString();
  } catch (error) {
    return false;
  }
};

/**
 * Check if a time is this week
 * @param time - ISO string, Date object, or timestamp
 * @returns boolean
 */
export const isThisWeek = (time: string | Date | number | null | undefined): boolean => {
  if (!time) return false;
  
  try {
    const date = new Date(time);
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    return date >= startOfWeek;
  } catch (error) {
    return false;
  }
};

/**
 * Get the start of a day
 * @param time - ISO string, Date object, or timestamp
 * @returns Date object set to start of day
 */
export const getStartOfDay = (time: string | Date | number | null | undefined): Date => {
  if (!time) return new Date();
  
  try {
    const date = new Date(time);
    date.setHours(0, 0, 0, 0);
    return date;
  } catch (error) {
    return new Date();
  }
};

/**
 * Get the end of a day
 * @param time - ISO string, Date object, or timestamp
 * @returns Date object set to end of day
 */
export const getEndOfDay = (time: string | Date | number | null | undefined): Date => {
  if (!time) return new Date();
  
  try {
    const date = new Date(time);
    date.setHours(23, 59, 59, 999);
    return date;
  } catch (error) {
    return new Date();
  }
};

