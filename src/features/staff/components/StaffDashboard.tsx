import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const dummyData = {
  totalStaff: 45,
  activeStaff: 42,
  departmentStats: [
    { department: 'Mathematics', count: 8 },
    { department: 'Science', count: 10 },
    { department: 'English', count: 7 },
    { department: 'History', count: 6 },
    { department: 'Arts', count: 5 },
    { department: 'PE', count: 4 },
    { department: 'Admin', count: 5 },
  ],
};

interface StaffDashboardProps {
  totalStaff?: number;
  activeStaff?: number;
  departmentStats?: any[];
  errorMsg?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const StaffDashboard: React.FC<StaffDashboardProps> = ({ 
  totalStaff, 
  activeStaff, 
  departmentStats, 
  errorMsg,
  onRefresh,
  refreshing = false
}) => {
  const data = {
    totalStaff: totalStaff ?? dummyData.totalStaff,
    activeStaff: activeStaff ?? dummyData.activeStaff,
    departmentStats: departmentStats ?? dummyData.departmentStats,
  };

  const inactiveStaff = data.totalStaff - data.activeStaff;
  const activePercentage = data.totalStaff > 0 ? (data.activeStaff / data.totalStaff) * 100 : 0;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
    >
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <MaterialIcons name="people" size={24} color="#6366f1" />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{data.totalStaff}</Text>
            <Text style={styles.statLabel}>Total Staff</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
            <MaterialIcons name="check-circle" size={24} color="#16a34a" />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{data.activeStaff}</Text>
            <Text style={styles.statLabel}>Active Staff</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
            <MaterialIcons name="pause-circle" size={24} color="#d97706" />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{inactiveStaff}</Text>
            <Text style={styles.statLabel}>Inactive Staff</Text>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Active Staff Rate</Text>
          <Text style={styles.progressPercentage}>{activePercentage.toFixed(1)}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${activePercentage}%` }
            ]} 
          />
        </View>
      </View>

      {/* Department Breakdown */}
      <View style={styles.departmentContainer}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="business" size={20} color="#6366f1" />
          <Text style={styles.sectionTitle}>Department Breakdown</Text>
        </View>
        
        {data.departmentStats.map((dept, index) => (
          <View key={dept.department || index} style={styles.deptRow}>
            <View style={styles.deptInfo}>
              <Text style={styles.deptName}>{dept.department}</Text>
              <Text style={styles.deptCount}>{dept.count} staff</Text>
            </View>
            <View style={styles.deptProgress}>
              <View 
                style={[
                  styles.deptProgressFill, 
                  { 
                    width: `${data.totalStaff > 0 ? (dept.count / data.totalStaff) * 100 : 0}%` 
                  }
                ]} 
              />
            </View>
          </View>
        ))}
      </View>

      {/* Error Message */}
      {errorMsg && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={20} color="#ef4444" />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="flash-on" size={20} color="#6366f1" />
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="add" size={20} color="#6366f1" />
            <Text style={styles.actionText}>Add Staff</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="file-download" size={20} color="#6366f1" />
            <Text style={styles.actionText}>Export Data</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="analytics" size={20} color="#6366f1" />
            <Text style={styles.actionText}>View Reports</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  progressContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  departmentContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  deptRow: {
    marginBottom: 12,
  },
  deptInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  deptName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  deptCount: {
    fontSize: 12,
    color: '#64748b',
  },
  deptProgress: {
    height: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  deptProgressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#dc2626',
  },
  actionsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    minWidth: 80,
  },
  actionText: {
    fontSize: 12,
    color: '#6366f1',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default StaffDashboard; 
