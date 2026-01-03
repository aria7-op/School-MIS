import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../../theme';

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  subject: string;
  teacher: string;
  remarks?: string;
}

interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendancePercentage: number;
  currentStreak: number;
  longestStreak: number;
}

interface AttendanceTrackerProps {
  attendanceRecords: AttendanceRecord[];
  stats: AttendanceStats;
  onViewDetails?: (date: string) => void;
  onViewSubjectAttendance?: (subject: string) => void;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({
  attendanceRecords,
  stats,
  onViewDetails,
  onViewSubjectAttendance,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedMonth] = useState(new Date().getFullYear());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return theme.colors.success;
      case 'absent': return theme.colors.error;
      case 'late': return theme.colors.warning;
      case 'excused': return theme.colors.info;
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return 'check-circle';
      case 'absent': return 'cancel';
      case 'late': return 'schedule';
      case 'excused': return 'info';
      default: return 'help';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'late': return 'Late';
      case 'excused': return 'Excused';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  };

  const MonthSelector = () => (
    <View style={styles.monthSelector}>
      <TouchableOpacity
        style={styles.monthButton}
        onPress={() => {
          if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedMonth(selectedYear - 1);
          } else {
            setSelectedMonth(selectedMonth - 1);
          }
        }}
      >
        <MaterialIcons name="chevron-left" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
      
      <Text style={styles.monthText}>
        {getMonthName(selectedMonth)} {selectedYear}
      </Text>
      
      <TouchableOpacity
        style={styles.monthButton}
        onPress={() => {
          if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedMonth(selectedYear + 1);
          } else {
            setSelectedMonth(selectedMonth + 1);
          }
        }}
      >
        <MaterialIcons name="chevron-right" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const StatsOverview = () => (
    <View style={styles.statsOverview}>
      <View style={styles.statCard}>
        <View style={styles.statHeader}>
          <MaterialIcons name="trending-up" size={24} color={theme.colors.success} />
          <Text style={styles.statTitle}>Attendance Rate</Text>
        </View>
        <Text style={styles.statValue}>{stats.attendancePercentage}%</Text>
        <Text style={styles.statSubtitle}>
          {stats.presentDays} of {stats.totalDays} days
        </Text>
      </View>

      <View style={styles.statCard}>
        <View style={styles.statHeader}>
          <MaterialIcons name="local-fire-department" size={24} color={theme.colors.warning} />
          <Text style={styles.statTitle}>Current Streak</Text>
        </View>
        <Text style={styles.statValue}>{stats.currentStreak}</Text>
        <Text style={styles.statSubtitle}>days present</Text>
      </View>

      <View style={styles.statCard}>
        <View style={styles.statHeader}>
          <MaterialIcons name="emoji-events" size={24} color={theme.colors.primary} />
          <Text style={styles.statTitle}>Best Streak</Text>
        </View>
        <Text style={styles.statValue}>{stats.longestStreak}</Text>
        <Text style={styles.statSubtitle}>days</Text>
      </View>
    </View>
  );

  const DetailedStats = () => (
    <View style={styles.detailedStats}>
      <Text style={styles.sectionTitle}>Detailed Breakdown</Text>
      <View style={styles.statsGrid}>
        <View style={styles.detailStatItem}>
          <View style={[styles.statusIndicator, { backgroundColor: theme.colors.success }]} />
          <Text style={styles.detailStatLabel}>Present</Text>
          <Text style={styles.detailStatValue}>{stats.presentDays}</Text>
        </View>
        
        <View style={styles.detailStatItem}>
          <View style={[styles.statusIndicator, { backgroundColor: theme.colors.error }]} />
          <Text style={styles.detailStatLabel}>Absent</Text>
          <Text style={styles.detailStatValue}>{stats.absentDays}</Text>
        </View>
        
        <View style={styles.detailStatItem}>
          <View style={[styles.statusIndicator, { backgroundColor: theme.colors.warning }]} />
          <Text style={styles.detailStatLabel}>Late</Text>
          <Text style={styles.detailStatValue}>{stats.lateDays}</Text>
        </View>
        
        <View style={styles.detailStatItem}>
          <View style={[styles.statusIndicator, { backgroundColor: theme.colors.info }]} />
          <Text style={styles.detailStatLabel}>Excused</Text>
          <Text style={styles.detailStatValue}>{stats.excusedDays}</Text>
        </View>
      </View>
    </View>
  );

  const AttendanceCalendar = () => {
    const filteredRecords = attendanceRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear;
    });

    return (
      <View style={styles.calendarSection}>
        <Text style={styles.sectionTitle}>Monthly Calendar</Text>
        <View style={styles.calendarGrid}>
          {filteredRecords.map((record, index) => (
            <TouchableOpacity
              key={index}
              style={styles.calendarDay}
              onPress={() => onViewDetails?.(record.date)}
            >
              <Text style={styles.calendarDate}>{formatDate(record.date)}</Text>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(record.status) }]} />
              <Text style={styles.calendarSubject}>{record.subject}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const RecentRecords = () => (
    <View style={styles.recentSection}>
      <Text style={styles.sectionTitle}>Recent Attendance</Text>
      {attendanceRecords.slice(0, 10).map((record, index) => (
        <TouchableOpacity
          key={index}
          style={styles.recordItem}
          onPress={() => onViewDetails?.(record.date)}
        >
          <View style={styles.recordHeader}>
            <View style={styles.recordDate}>
              <Text style={styles.recordDateText}>{formatDate(record.date)}</Text>
              <Text style={styles.recordSubject}>{record.subject}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(record.status) }]}>
              <MaterialIcons name={getStatusIcon(record.status) as any} size={16} color={theme.colors.white} />
              <Text style={styles.statusBadgeText}>{getStatusText(record.status)}</Text>
            </View>
          </View>
          
          <View style={styles.recordDetails}>
            <Text style={styles.recordTeacher}>Teacher: {record.teacher}</Text>
            {record.remarks && (
              <Text style={styles.recordRemarks}>Remarks: {record.remarks}</Text>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <MonthSelector />
      
      <StatsOverview />
      
      <DetailedStats />
      
      <AttendanceCalendar />
      
      <RecentRecords />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.surface,
    marginBottom: 16,
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statsOverview: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  detailedStats: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailStatItem: {
    width: (Dimensions.get('window').width - 56) / 2,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  statusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  detailStatLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  detailStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  calendarSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarDay: {
    width: (Dimensions.get('window').width - 56) / 3,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  calendarDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  calendarSubject: {
    fontSize: 10,
    color: theme.colors.text,
    textAlign: 'center',
  },
  recentSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  recordItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordDate: {
    flex: 1,
  },
  recordDateText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  recordSubject: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  recordDetails: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
  },
  recordTeacher: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  recordRemarks: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default AttendanceTracker; 