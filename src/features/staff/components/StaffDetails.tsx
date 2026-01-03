import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { Card, Button, Icon, Tab, TabView } from '@rneui/base';
import useStaffAPI from '../../hooks/useStaffAPI';
import { Staff } from '../../types/staff';
import StaffForm from '../StaffForm/StaffForm';
import PerformanceChart from './PerformanceChart';
import AttendanceChart from './AttendanceChart';
import SalaryHistoryChart from './SalaryHistoryChart';

interface StaffDetailsProps {
  staff: Staff;
  onUpdate: () => void;
}

const StaffDetails: React.FC<StaffDetailsProps> = ({ staff, onUpdate }) => {
  const { loading, error, getStaffStats, getStaffAnalytics, deleteStaff } = useStaffAPI();
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, analyticsData] = await Promise.all([
          getStaffStats(staff.id),
          getStaffAnalytics(staff.id, '30d')
        ]);
        setStats(statsData.data);
        setAnalytics(analyticsData.data);
      } catch (err) {
        
      }
    };
    loadData();
  }, [staff.id]);

  const handleDelete = () => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${staff.firstName} ${staff.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStaff(staff.id);
              onUpdate();
            } catch (err) {
              
            }
          },
        },
      ]
    );
  };

  if (editMode) {
    return (
      <StaffForm 
        staff={staff} 
        onCancel={() => setEditMode(false)} 
        onSuccess={() => {
          setEditMode(false);
          onUpdate();
        }} 
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card containerStyle={styles.card}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {staff.avatar ? (
              <Image source={{ uri: staff.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {staff.firstName?.charAt(0)}{staff.lastName?.charAt(0)}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.name}>
              {staff.firstName} {staff.middleName && `${staff.middleName} `}{staff.lastName}
            </Text>
            <Text style={styles.designation}>{staff.designation}</Text>
            <Text style={styles.department}>{staff.department?.name}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Edit"
            icon={<Icon name="edit" size={16} color="white" />}
            buttonStyle={styles.editButton}
            onPress={() => setEditMode(true)}
          />
          <Button
            title="Delete"
            icon={<Icon name="delete" size={16} color="white" />}
            buttonStyle={styles.deleteButton}
            onPress={handleDelete}
          />
        </View>
      </Card>

      <Tab
        value={activeTab}
        onChange={setActiveTab}
        indicatorStyle={styles.tabIndicator}
        variant="primary"
      >
        <Tab.Item title="Details" />
        <Tab.Item title="Performance" />
        <Tab.Item title="Analytics" />
      </Tab>

      <TabView value={activeTab} onChange={setActiveTab} animationType="spring">
        <TabView.Item style={styles.tabContent}>
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Employee ID:</Text>
              <Text style={styles.detailValue}>{staff.employeeId}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{staff.email}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone:</Text>
              <Text style={styles.detailValue}>{staff.phone}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Gender:</Text>
              <Text style={styles.detailValue}>{staff.gender}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Birth Date:</Text>
              <Text style={styles.detailValue}>
                {new Date(staff.birthDate).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Employment Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Joining Date:</Text>
              <Text style={styles.detailValue}>
                {new Date(staff.joiningDate).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Salary:</Text>
              <Text style={styles.detailValue}>
                ${staff.salary?.toLocaleString()}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bank Details:</Text>
              <Text style={styles.detailValue}>
                {staff.bankName} (A/C: {staff.accountNumber})
              </Text>
            </View>
          </View>

          {staff.bio && (
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Bio</Text>
              <Text style={styles.bioText}>{staff.bio}</Text>
            </View>
          )}
        </TabView.Item>

        <TabView.Item style={styles.tabContent}>
          {stats ? (
            <View>
              <PerformanceChart data={stats.performance} />
              <AttendanceChart data={stats.attendance} />
              <SalaryHistoryChart data={stats.salaryHistory} />
            </View>
          ) : (
            <View style={styles.loader}>
              <ActivityIndicator size="large" />
            </View>
          )}
        </TabView.Item>

        <TabView.Item style={styles.tabContent}>
          {analytics ? (
            <View>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              {/* Analytics charts would go here */}
            </View>
          ) : (
            <View style={styles.loader}>
              <ActivityIndicator size="large" />
            </View>
          )}
        </TabView.Item>
      </TabView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4a6da7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  designation: {
    fontSize: 16,
    color: '#555',
    marginBottom: 4,
  },
  department: {
    fontSize: 14,
    color: '#777',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  editButton: {
    backgroundColor: '#4a6da7',
    borderRadius: 4,
    paddingHorizontal: 12,
  },
  deleteButton: {
    backgroundColor: '#d9534f',
    borderRadius: 4,
    paddingHorizontal: 12,
  },
  tabIndicator: {
    backgroundColor: '#4a6da7',
    height: 3,
  },
  tabContent: {
    width: '100%',
    paddingTop: 16,
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#555',
  },
  detailValue: {
    color: '#333',
  },
  bioText: {
    color: '#333',
    lineHeight: 22,
  },
  loader: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StaffDetails;
