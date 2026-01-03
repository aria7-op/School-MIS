import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { FaCalendarAlt } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import secureApiService from '../../services/secureApiService';

interface WeeklyAttendanceData {
  day: string;
  present: number;
  absent: number;
  late: number;
}

interface Class {
  id: string;
  name: string;
  level: string;
  section: string;
}

const WeeklyAttendanceTrend: React.FC = () => {
  const { t } = useTranslation();
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [chartData, setChartData] = useState<WeeklyAttendanceData[]>([]);

  // Fetch classes
  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await secureApiService.getClasses();
      return response.data || [];
    }
  });

  // Fetch attendance data for selected class
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['weeklyAttendance', selectedClassId],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7); // Last 7 days

      const params: any = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        groupBy: 'day'
      };

      if (selectedClassId !== 'all') {
        params.classId = selectedClassId;
      }

      const response = await secureApiService.getAttendanceRecords(params);
      return response.data || [];
    },
    enabled: true
  });

  // Process attendance data for chart
  useEffect(() => {
    if (attendanceData && Array.isArray(attendanceData)) {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const processedData = days.map(day => {
        // Find attendance data for this day
        const dayData = attendanceData.find((item: any) => {
          const date = new Date(item.date);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          return dayName === day;
        });

        if (dayData) {
          return {
            day,
            present: dayData.present || 0,
            absent: -(dayData.absent || 0), // Negative for below zero line
            late: -(dayData.late || 0) // Negative for below zero line
          };
        }

        // Default values if no data for this day
        return {
          day,
          present: 0,
          absent: 0,
          late: 0
        };
      });

      setChartData(processedData);
    } else {
      // Generate mock data if no real data available
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const mockData = days.map((day, index) => {
        const isWeekend = day === 'Sat' || day === 'Sun';
        const basePresent = isWeekend ? 200 : 800;
        const baseAbsent = isWeekend ? 50 : 100;
        const baseLate = isWeekend ? 20 : 80;

        return {
          day,
          present: basePresent + Math.random() * 200,
          absent: -(baseAbsent + Math.random() * 50),
          late: -(baseLate + Math.random() * 30)
        };
      });
      setChartData(mockData);
    }
  }, [attendanceData, selectedClassId]);

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
  };

  const selectedClassName = classes.find((cls: Class) => cls.id === selectedClassId)?.name || 'All Classes';

  if (classesLoading || attendanceLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-80 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Weekly Attendance Trend</h3>
        <div className="flex items-center space-x-3">
          {/* Class Dropdown */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Class:</label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Classes</option>
              {classes.map((cls: Class) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.level}-{cls.section})
                </option>
              ))}
            </select>
          </div>
          
          {/* Calendar Icon */}
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <FaCalendarAlt className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#6B7280' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#6B7280' }}
              domain={[-350, 1050]}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                Math.abs(value), 
                name === 'absent' || name === 'late' ? name.charAt(0).toUpperCase() + name.slice(1) : name.charAt(0).toUpperCase() + name.slice(1)
              ]}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #E5E7EB',
                borderRadius: '6px'
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
            />
            
            {/* Reference line at zero */}
            <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="2 2" />
            
            {/* Present (above zero) */}
            <Area
              type="monotone"
              dataKey="present"
              fill="#10B981"
              fillOpacity={0.6}
              stroke="#10B981"
              strokeWidth={2}
              name="Present"
            />
            
            {/* Absent (below zero) */}
            <Area
              type="monotone"
              dataKey="absent"
              fill="#EF4444"
              fillOpacity={0.6}
              stroke="#EF4444"
              strokeWidth={2}
              name="Absent"
            />
            
            {/* Late (below zero) */}
            <Area
              type="monotone"
              dataKey="late"
              fill="#F97316"
              fillOpacity={0.6}
              stroke="#F97316"
              strokeWidth={2}
              name="Late"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Class Info */}
      <div className="mt-4 text-sm text-gray-600">
        Showing data for: <span className="font-medium">{selectedClassName}</span>
      </div>
    </div>
  );
};

export default WeeklyAttendanceTrend;




