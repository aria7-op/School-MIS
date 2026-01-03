import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useExams } from '../hooks/useExamApi';
import { Exam } from '../services/examApi';

interface ExamCalendarProps {
  onDateSelect?: (date: Date, exams: Exam[]) => void;
  onExamPress?: (exam: Exam) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  exams: Exam[];
  examCount: number;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ExamCalendar: React.FC<ExamCalendarProps> = ({
  onDateSelect,
  onExamPress
}) => {
  const { colors, dark } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDateDetails, setShowDateDetails] = useState(false);

  // Get exams for the current month
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  const { exams, loading } = useExams({
    startDate: startOfMonth.toISOString(),
    endDate: endOfMonth.toISOString(),
    limit: 100,
    include: 'class,subject,term'
  });

  // Group exams by date
  const examsByDate = useMemo(() => {
    const grouped: { [key: string]: Exam[] } = {};
    
    exams.forEach(exam => {
      const startDate = new Date(exam.startDate);
      const endDate = new Date(exam.endDate);
      
      // Add exam to all dates it spans
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateKey = currentDate.toDateString();
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(exam);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    
    return grouped;
  }, [exams]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    // Add days from previous month
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonth.getDate() - i);
      const dateKey = date.toDateString();
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.toDateString() === today.toDateString(),
        exams: examsByDate[dateKey] || [],
        examCount: (examsByDate[dateKey] || []).length
      });
    }
    
    // Add days from current month
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toDateString();
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        exams: examsByDate[dateKey] || [],
        examCount: (examsByDate[dateKey] || []).length
      });
    }
    
    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      const dateKey = date.toDateString();
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.toDateString() === today.toDateString(),
        exams: examsByDate[dateKey] || [],
        examCount: (examsByDate[dateKey] || []).length
      });
    }
    
    return days;
  }, [currentDate, examsByDate]);

  const handlePrevMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleDatePress = useCallback((day: CalendarDay) => {
    setSelectedDate(day.date);
    if (day.examCount > 0) {
      setShowDateDetails(true);
    }
    onDateSelect?.(day.date, day.exams);
  }, [onDateSelect]);

  const handleExamPress = useCallback((exam: Exam) => {
    setShowDateDetails(false);
    onExamPress?.(exam);
  }, [onExamPress]);

  const getExamTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'midterm': return '#6366F1';
      case 'final': return '#F59E42';
      case 'quiz': return '#10B981';
      case 'assignment': return '#8B5CF6';
      case 'project': return '#EF4444';
      case 'practical': return '#06B6D4';
      default: return colors.primary;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderCalendarDay = ({ item: day }: { item: CalendarDay }) => {
    const isSelected = selectedDate?.toDateString() === day.date.toDateString();
    const hasExams = day.examCount > 0;
    const isEmpty = day.examCount === 0 && day.isCurrentMonth;
    
    return (
      <TouchableOpacity
        style={[
          styles.dayContainer,
          { backgroundColor: colors.background },
          !day.isCurrentMonth && { opacity: 0.3 },
          day.isToday && [styles.todayContainer, { borderColor: colors.primary }],
          isSelected && [styles.selectedContainer, { backgroundColor: colors.primary + '20' }],
          isEmpty && [styles.emptyDayContainer, { backgroundColor: '#10B98120' }]
        ]}
        onPress={() => handleDatePress(day)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.dayNumber,
          { color: colors.text },
          !day.isCurrentMonth && { color: colors.text + '40' },
          day.isToday && { color: colors.primary, fontWeight: 'bold' },
          isEmpty && { color: '#10B981', fontWeight: '600' }
        ]}>
          {day.date.getDate()}
        </Text>
        
        {hasExams && (
          <View style={styles.examIndicators}>
            {day.exams.slice(0, 3).map((exam, index) => (
              <View
                key={exam.id}
                style={[
                  styles.examDot,
                  { backgroundColor: getExamTypeColor(exam.type) }
                ]}
              />
            ))}
            {day.examCount > 3 && (
              <View style={[styles.examDot, styles.moreExamsDot, { backgroundColor: colors.text + '60' }]}>
                <Text style={styles.moreExamsText}>+</Text>
              </View>
            )}
          </View>
        )}
        
        {day.examCount > 0 && (
          <Text style={[styles.examCount, { color: colors.text + '80' }]}>
            {day.examCount}
          </Text>
        )}
        
        {isEmpty && (
          <View style={styles.emptyIndicator}>
            <MaterialCommunityIcons 
              name="calendar-check" 
              size={12} 
              color="#10B981" 
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderDateDetailsModal = () => {
    if (!selectedDate) return null;
    
    const selectedDay = calendarDays.find(day => 
      day.date.toDateString() === selectedDate.toDateString()
    );
    
    if (!selectedDay || selectedDay.examCount === 0) return null;

    return (
      <Modal
        visible={showDateDetails}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.card }]}>
            <TouchableOpacity onPress={() => setShowDateDetails(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.examListTitle, { color: colors.text }]}>
              {selectedDay.examCount} Exam{selectedDay.examCount > 1 ? 's' : ''} Scheduled
            </Text>
            
            <FlatList
              data={selectedDay.exams}
              keyExtractor={item => item.id}
              renderItem={({ item: exam }) => (
                <TouchableOpacity
                  style={[styles.examItem, { backgroundColor: colors.card }]}
                  onPress={() => handleExamPress(exam)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.examTypeIndicator,
                    { backgroundColor: getExamTypeColor(exam.type) }
                  ]} />
                  
                  <View style={styles.examInfo}>
                    <Text style={[styles.examName, { color: colors.text }]} numberOfLines={1}>
                      {exam.name}
                    </Text>
                    <Text style={[styles.examDetails, { color: colors.text + '80' }]}>
                      {exam.subject?.name} • {exam.class?.name} • {exam.type}
                    </Text>
                    <View style={styles.examTimeInfo}>
                      <Ionicons name="time-outline" size={14} color={colors.text + '60'} />
                      <Text style={[styles.examTime, { color: colors.text + '60' }]}>
                        {formatTime(exam.startDate)} - {formatTime(exam.endDate)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.examStats}>
                    <Text style={[styles.examMarks, { color: colors.primary }]}>
                      {exam.totalMarks} marks
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Calendar Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={handlePrevMonth}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.monthYearContainer}>
          <Text style={[styles.monthYear, { color: colors.text }]}>
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={handleNextMonth}
        >
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: colors.card }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>Has Exams</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F59E42' }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>Today</Text>
        </View>
      </View>

      {/* Days of Week Header */}
      <View style={styles.daysHeader}>
        {DAYS_OF_WEEK.map(day => (
          <View key={day} style={styles.dayHeaderContainer}>
            <Text style={[styles.dayHeader, { color: colors.text + '80' }]}>
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text + '80' }]}>
            Loading calendar...
          </Text>
        </View>
      ) : (
        <FlatList
          data={calendarDays}
          renderItem={renderCalendarDay}
          keyExtractor={(item, index) => `${item.date.toDateString()}-${index}`}
          numColumns={7}
          scrollEnabled={false}
          contentContainerStyle={styles.calendarGrid}
        />
      )}

      {/* Summary Stats */}
      <View style={[styles.summary, { backgroundColor: colors.card }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: colors.primary }]}>
            {Object.keys(examsByDate).length}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.text + '80' }]}>
            Days with Exams
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: '#10B981' }]}>
            {calendarDays.filter(day => day.isCurrentMonth && day.examCount === 0).length}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.text + '80' }]}>
            Available Days
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: '#F59E42' }]}>
            {exams.length}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.text + '80' }]}>
            Total Exams
          </Text>
        </View>
      </View>

      {renderDateDetailsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navButton: {
    padding: 8,
  },
  monthYearContainer: {
    flex: 1,
    alignItems: 'center',
  },
  monthYear: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
  daysHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dayHeaderContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeader: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  calendarGrid: {
    paddingHorizontal: 16,
  },
  dayContainer: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    borderRadius: 8,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  todayContainer: {
    borderWidth: 2,
  },
  selectedContainer: {
    borderWidth: 1,
  },
  emptyDayContainer: {
    borderWidth: 1,
    borderColor: '#10B98140',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '500',
  },
  examIndicators: {
    flexDirection: 'row',
    marginTop: 2,
    gap: 2,
  },
  examDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreExamsDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreExamsText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: 'bold',
  },
  examCount: {
    fontSize: 10,
    marginTop: 2,
  },
  emptyIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginTop: 8,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  examListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  examItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  examTypeIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
  },
  examInfo: {
    flex: 1,
  },
  examName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  examDetails: {
    fontSize: 14,
    marginBottom: 4,
  },
  examTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  examTime: {
    fontSize: 12,
  },
  examStats: {
    alignItems: 'flex-end',
  },
  examMarks: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ExamCalendar;