import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import apiService from '../../../services/api';

const UltraAdvancedPermissionAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsRes, usageRes, riskRes] = await Promise.all([
        apiService.get('/rbac/permissions/analytics'),
        apiService.get('/rbac/permissions/usage'),
        apiService.get('/rbac/permissions/risk-analysis')
      ]);
      
      const analyticsData = {
        ...(analyticsRes.data || {}),
        permissionUsage: usageRes.data || [],
        riskAnalysis: riskRes.data || {}
      };
      
      setAnalytics(analyticsData);
    } catch (error) {
      
      // Set default data if API fails
      setAnalytics({
        totalAssignments: 0,
        activeAssignments: 0,
        totalUsers: 0,
        totalRoles: 0,
        permissionUsage: [],
        riskAnalysis: {
          overPermissioned: 0,
          inactivePermissions: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (type: string) => {
    try {
      setLoading(true);
      const response = await apiService.post('/rbac/permissions/export', {
        type,
        format: 'json'
      });
      
      if (response.success) {
        Alert.alert('Success', `${type} report exported successfully`);
      } else {
        Alert.alert('Error', 'Failed to export report');
      }
    } catch (error) {
      
      Alert.alert('Error', 'Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Ultra Advanced Analytics</Text>
        <Text style={styles.subtitle}>Permission insights & reporting</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{analytics.totalAssignments || 0}</Text>
            <Text style={styles.statLabel}>Total Assignments</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{analytics.activeAssignments || 0}</Text>
            <Text style={styles.statLabel}>Active Assignments</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{analytics.totalUsers || 0}</Text>
            <Text style={styles.statLabel}>Users</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{analytics.totalRoles || 0}</Text>
            <Text style={styles.statLabel}>Roles</Text>
          </View>
        </View>

        {/* Permission Usage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 Permission Usage</Text>
          <View style={styles.usageList}>
            {analytics.permissionUsage?.map((item: any) => (
              <View key={item.permissionId} style={styles.usageItem}>
                <Text style={styles.usageName}>{item.permissionName}</Text>
                <View style={styles.usageBar}>
                  <View style={[styles.usageFill, { width: `${item.usagePercent}%` }]} />
                </View>
                <Text style={styles.usageCount}>{item.count}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Risk Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Risk Analysis</Text>
          <View style={styles.riskGrid}>
            <View style={styles.riskCard}>
              <Text style={styles.riskTitle}>Over-Permissioned Users</Text>
              <Text style={styles.riskValue}>{analytics.riskAnalysis?.overPermissioned || 0}</Text>
            </View>
            <View style={styles.riskCard}>
              <Text style={styles.riskTitle}>Inactive Permissions</Text>
              <Text style={styles.riskValue}>{analytics.riskAnalysis?.inactivePermissions || 0}</Text>
            </View>
          </View>
        </View>

        {/* Export Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📤 Export Reports</Text>
          <View style={styles.exportButtons}>
            <TouchableOpacity 
              style={styles.exportButton}
              onPress={() => exportReport('permission-matrix')}
            >
              <Text style={styles.exportButtonText}>📊 Permission Matrix</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.exportButton}
              onPress={() => exportReport('user-permissions')}
            >
              <Text style={styles.exportButtonText}>👥 User Permissions</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.exportButton}
              onPress={() => exportReport('role-analysis')}
            >
              <Text style={styles.exportButtonText}>🔐 Role Analysis</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  content: { flex: 1, padding: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  statCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, margin: 4, flex: 1, minWidth: 150, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#3B82F6' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  section: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12 },
  usageList: { marginTop: 8 },
  usageItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  usageName: { fontSize: 12, color: '#374151', width: 100 },
  usageBar: { flex: 1, height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, marginHorizontal: 12 },
  usageFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 4 },
  usageCount: { fontSize: 12, color: '#6B7280', width: 30, textAlign: 'right' },
  riskGrid: { flexDirection: 'row' },
  riskCard: { flex: 1, backgroundColor: '#FEF3C7', borderRadius: 8, padding: 12, margin: 4 },
  riskTitle: { fontSize: 12, color: '#92400E', marginBottom: 4 },
  riskValue: { fontSize: 18, fontWeight: 'bold', color: '#D97706' },
  exportButtons: { flexDirection: 'row', flexWrap: 'wrap' },
  exportButton: { backgroundColor: '#3B82F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, margin: 4 },
  exportButtonText: { color: 'white', fontSize: 12, fontWeight: '600' }
});

export default UltraAdvancedPermissionAnalytics; 
