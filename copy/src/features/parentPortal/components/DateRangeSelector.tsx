import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from "react-i18next";

interface DateRangeSelectorProps {
  startDate: string;
  endDate: string;
  onDateRangeChange: (startDate: string, endDate: string) => void;
  placeholder?: string;
  className?: string;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  startDate,
  endDate,
  onDateRangeChange,
  placeholder,
  className = ""
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [rightMonth, setRightMonth] = useState(new Date().getMonth() + 1);
  const [rightYear, setRightYear] = useState(new Date().getFullYear());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const predefinedRanges = [
    { label: 'Today', getDates: () => {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      return { start: dateStr, end: dateStr };
    }},
    { label: 'Yesterday', getDates: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];
      return { start: dateStr, end: dateStr };
    }},
    { label: 'Last 7 Days', getDates: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      return { 
        start: start.toISOString().split('T')[0], 
        end: end.toISOString().split('T')[0] 
      };
    }},
    { label: 'Last 30 Days', getDates: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 29);
      return { 
        start: start.toISOString().split('T')[0], 
        end: end.toISOString().split('T')[0] 
      };
    }},
    { label: 'This Month', getDates: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { 
        start: start.toISOString().split('T')[0], 
        end: end.toISOString().split('T')[0] 
      };
    }},
    { label: 'Last Month', getDates: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { 
        start: start.toISOString().split('T')[0], 
        end: end.toISOString().split('T')[0] 
      };
    }},
    { label: 'This Year', getDates: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return { 
        start: start.toISOString().split('T')[0], 
        end: end.toISOString().split('T')[0] 
      };
    }},
    { label: 'Custom Range', getDates: () => null }
  ];

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDisplayRange = () => {
    if (!startDate || !endDate) return placeholder || t("parentPortal.common.selectDateRange");
    if (startDate === endDate) {
      return formatDisplayDate(startDate);
    }
    return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
  };

  const formatNumericRange = () => {
    if (!startDate || !endDate) return '';
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
    };
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const handlePredefinedRange = (range: any) => {
    const dates = range.getDates();
    if (dates) {
      setTempStartDate(dates.start);
      setTempEndDate(dates.end);
      onDateRangeChange(dates.start, dates.end);
      setIsOpen(false);
    }
  };

  const handleApply = () => {
    onDateRangeChange(tempStartDate, tempEndDate);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setIsOpen(false);
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isDateInRange = (date: Date) => {
    if (!tempStartDate || !tempEndDate) return false;
    const dateStr = date.toISOString().split('T')[0];
    return dateStr >= tempStartDate && dateStr <= tempEndDate;
  };

  const isDateSelected = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return dateStr === tempStartDate || dateStr === tempEndDate;
  };

  const handleDateClick = (date: Date, calendar: 'left' | 'right') => {
    const dateStr = date.toISOString().split('T')[0];
    
    if (calendar === 'left') {
      // Left calendar is for start date
      setTempStartDate(dateStr);
      // If end date is before new start date, clear it
      if (tempEndDate && dateStr > tempEndDate) {
        setTempEndDate('');
      }
    } else {
      // Right calendar is for end date
      if (!tempStartDate) {
        // If no start date, set this as start date
        setTempStartDate(dateStr);
      } else if (dateStr >= tempStartDate) {
        // Valid end date
        setTempEndDate(dateStr);
      } else {
        // End date before start date, swap them
        setTempEndDate(tempStartDate);
        setTempStartDate(dateStr);
      }
    }
  };

  // Mobile-friendly date selection (single calendar)
  const handleMobileDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      // No start date or both dates selected - start new selection
      setTempStartDate(dateStr);
      setTempEndDate('');
    } else if (tempStartDate && !tempEndDate) {
      // Start date selected, now selecting end date
      if (dateStr >= tempStartDate) {
        setTempEndDate(dateStr);
      } else {
        // End date before start date, swap them
        setTempEndDate(tempStartDate);
        setTempStartDate(dateStr);
      }
    }
  };

  const navigateMonth = (direction: 'prev' | 'next', calendar: 'left' | 'right') => {
    if (calendar === 'left') {
      if (direction === 'prev') {
        if (currentMonth === 0) {
          setCurrentMonth(11);
          setCurrentYear(currentYear - 1);
        } else {
          setCurrentMonth(currentMonth - 1);
        }
      } else {
        if (currentMonth === 11) {
          setCurrentMonth(0);
          setCurrentYear(currentYear + 1);
        } else {
          setCurrentMonth(currentMonth + 1);
        }
      }
    } else {
      if (direction === 'prev') {
        if (rightMonth === 0) {
          setRightMonth(11);
          setRightYear(rightYear - 1);
        } else {
          setRightMonth(rightMonth - 1);
        }
      } else {
        if (rightMonth === 11) {
          setRightMonth(0);
          setRightYear(rightYear + 1);
        } else {
          setRightMonth(rightMonth + 1);
        }
      }
    }
  };

  const renderMobileCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Previous month's days
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = getDaysInMonth(prevMonth, prevYear);
    
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(prevYear, prevMonth, daysInPrevMonth - i);
      days.push(
        <button
          key={`prev-${i}`}
          className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 hover:bg-gray-100 rounded text-xs sm:text-sm"
          onClick={() => handleMobileDateClick(date)}
        >
          {daysInPrevMonth - i}
        </button>
      );
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isSelected = isDateSelected(date);
      const isInRange = isDateInRange(date);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <button
          key={day}
          className={`w-6 h-6 sm:w-8 sm:h-8 rounded transition-colors text-xs sm:text-sm ${
            isSelected
              ? 'bg-blue-600 text-white'
              : isInRange
              ? 'bg-blue-100 text-blue-900'
              : isToday
              ? 'bg-green-500 text-white'
              : 'hover:bg-gray-100'
          }`}
          onClick={() => handleMobileDateClick(date)}
        >
          {day}
        </button>
      );
    }

    // Next month's days
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const totalCells = 42; // 6 weeks * 7 days
    const remainingCells = totalCells - days.length;

    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(nextYear, nextMonth, day);
      days.push(
        <button
          key={`next-${day}`}
          className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 hover:bg-gray-100 rounded text-xs sm:text-sm"
          onClick={() => handleMobileDateClick(date)}
        >
          {day}
        </button>
      );
    }

    return (
      <div className="p-1 sm:p-4">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <button
            onClick={() => navigateMonth('prev', 'left')}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="font-semibold text-gray-900 text-xs sm:text-base">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <button
            onClick={() => navigateMonth('next', 'left')}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-0 mb-1 sm:mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-0">
          {days}
        </div>
      </div>
    );
  };

  const renderCalendar = (calendar: 'left' | 'right') => {
    const month = calendar === 'left' ? currentMonth : rightMonth;
    const year = calendar === 'left' ? currentYear : rightYear;
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);
    const days = [];
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Previous month's days
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevMonth, prevYear);
    
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(prevYear, prevMonth, daysInPrevMonth - i);
      days.push(
        <button
          key={`prev-${i}`}
          className="w-8 h-8 text-gray-400 hover:bg-gray-100 rounded"
          onClick={() => handleDateClick(date, calendar)}
        >
          {daysInPrevMonth - i}
        </button>
      );
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isSelected = isDateSelected(date);
      const isInRange = isDateInRange(date);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <button
          key={day}
          className={`w-8 h-8 rounded transition-colors ${
            isSelected
              ? 'bg-blue-600 text-white'
              : isInRange
              ? 'bg-blue-100 text-blue-900'
              : isToday
              ? 'bg-green-500 text-white'
              : 'hover:bg-gray-100'
          }`}
          onClick={() => handleDateClick(date, calendar)}
        >
          {day}
        </button>
      );
    }

    // Next month's days
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const totalCells = 42; // 6 weeks * 7 days
    const remainingCells = totalCells - days.length;

    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(nextYear, nextMonth, day);
      days.push(
        <button
          key={`next-${day}`}
          className="w-8 h-8 text-gray-400 hover:bg-gray-100 rounded"
          onClick={() => handleDateClick(date, calendar)}
        >
          {day}
        </button>
      );
    }

    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth('prev', calendar)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="font-semibold text-gray-900">
            {monthNames[month]} {year}
          </h3>
          <button
            onClick={() => navigateMonth('next', calendar)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="w-8 h-8 flex items-center justify-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    
    // Set right calendar to show next month if we have a date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // If dates are in different months, set right calendar to end date month
      if (start.getMonth() !== end.getMonth() || start.getFullYear() !== end.getFullYear()) {
        setRightMonth(end.getMonth());
        setRightYear(end.getFullYear());
      } else {
        // Same month, set right calendar to next month
        const nextMonth = start.getMonth() + 1;
        if (nextMonth > 11) {
          setRightMonth(0);
          setRightYear(start.getFullYear() + 1);
        } else {
          setRightMonth(nextMonth);
          setRightYear(start.getFullYear());
        }
      }
    }
  }, [startDate, endDate]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-gray-700">{formatDisplayRange()}</span>
        </div>
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Date Range Selector */}
          <div className="absolute top-full left-0 mt-2 w-[85vw] max-w-[800px] bg-white border border-gray-200 rounded-lg shadow-xl z-[9999]">
            {/* Mobile Layout */}
            <div className="block lg:hidden">
              {/* Predefined Ranges - Mobile */}
              <div className="p-1 sm:p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-3 text-xs sm:text-base">Quick Select</h3>
                <div className="grid grid-cols-2 gap-0.5 sm:gap-2">
                  {predefinedRanges.map((range, index) => (
                    <button
                      key={index}
                      onClick={() => handlePredefinedRange(range)}
                      className="text-left px-1 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 rounded border border-gray-200"
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Single Calendar - Mobile */}
              <div>
                <div className="text-center text-xs sm:text-sm font-medium text-gray-700 py-1 sm:py-3 bg-gray-50 border-b border-gray-200">
                  {tempStartDate && tempEndDate ? 'Date Range Selected' : 
                   tempStartDate ? 'Select End Date' : 'Select Start Date'}
                </div>
                {renderMobileCalendar()}
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:flex">
              {/* Predefined Ranges */}
              <div className="w-48 border-r border-gray-200">
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Quick Select</h3>
                  <div className="space-y-1">
                    {predefinedRanges.map((range, index) => (
                      <button
                        key={index}
                        onClick={() => handlePredefinedRange(range)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calendar */}
              <div className="flex-1">
                <div className="flex">
                  {/* Left Calendar - Start Date */}
                  <div className="flex-1 border-r border-gray-200">
                    <div className="p-2 text-center text-sm font-medium text-gray-700 bg-gray-50">
                      Start Date
                    </div>
                    {renderCalendar('left')}
                  </div>
                  
                  {/* Right Calendar - End Date */}
                  <div className="flex-1">
                    <div className="p-2 text-center text-sm font-medium text-gray-700 bg-gray-50">
                      End Date
                    </div>
                    {renderCalendar('right')}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-200 p-2 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
              <div className="text-xs sm:text-sm text-gray-600">
                {formatNumericRange()}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DateRangeSelector;
