import React, { useState } from 'react';
import { AttendanceCalendarProps } from '../types/attendance';
import { FaChevronLeft, FaChevronRight, FaCalendarAlt } from 'react-icons/fa';

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  markedDates,
  onDayPress,
  selectedDate
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDayNames = () => {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDayClick = (day: number) => {
    if (!day) return;
    
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateString = date.toISOString().split('T')[0];
    
    if (onDayPress) {
      onDayPress(dateString);
    }
  };

  const isToday = (day: number) => {
    if (!day) return false;
    const today = new Date();
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (day: number) => {
    if (!day || !selectedDate) return false;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateString = date.toISOString().split('T')[0];
    return dateString === selectedDate;
  };

  const getMarkedDate = (day: number) => {
    if (!day) return null;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateString = date.toISOString().split('T')[0];
    return markedDates[dateString];
  };

  const days = getDaysInMonth(currentDate);
  const dayNames = getDayNames();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FaCalendarAlt className="w-5 h-5 mr-2 text-blue-600" />
          Attendance Calendar
        </h3>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Previous month"
          >
            <FaChevronLeft className="w-4 h-4" />
          </button>
          
          <h4 className="text-lg font-medium text-gray-900 min-w-[200px] text-center">
            {getMonthName(currentDate)}
          </h4>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Next month"
          >
            <FaChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {dayNames.map((dayName) => (
          <div key={dayName} className="p-2 text-center text-sm font-medium text-gray-500">
            {dayName}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((day, index) => {
          if (!day) {
            return <div key={index} className="p-2"></div>;
          }
          
          const marked = getMarkedDate(day);
          const isCurrentDay = isToday(day);
          const isSelectedDay = isSelected(day);
          
          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className={`
                p-2 text-center text-sm rounded-lg transition-colors relative
                ${isCurrentDay ? 'bg-blue-100 text-blue-900 font-semibold' : ''}
                ${isSelectedDay ? 'bg-blue-600 text-white font-semibold' : ''}
                ${!isCurrentDay && !isSelectedDay ? 'hover:bg-gray-100 text-gray-900' : ''}
                ${marked?.marked ? 'ring-2 ring-offset-1' : ''}
              `}
              style={{
                ringColor: marked?.dotColor || 'transparent'
              }}
              title={marked?.marked ? 'Has attendance records' : ''}
            >
              {day}
              {marked?.marked && (
                <div 
                  className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ backgroundColor: marked.dotColor }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-gray-600">Present</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-gray-600">Absent</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span className="text-gray-600">Late</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span className="text-gray-600">Excused</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
