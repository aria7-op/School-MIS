import React, { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, Text, TouchableOpacity, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// Components
import {
  FinancialMetricsCard,
  CashFlowChart,
  RevenueAnalysisChart,
  PaymentTrendsChart
} from '../../finance';

// Analytics Components
import StaffAnalyticsDashboard from '../../staff/components/AnalyticsDashboard';
import StudentMetrics from '../components/StudentMetrics';
import TeacherMetrics from '../components/TeacherMetrics';
import SystemHealth from '../components/SystemHealth';
import ActivityLogs from '../components/ActivityLogs';
import QuickActions from '../components/QuickActions';
import EnrollmentManager from '../components/EnrollmentManager';

// Hooks
import useFinancialAnalytics from '../../finance/hooks/useFinancialAnalytics';
import useSystemMetrics from '../hooks/useSystemMetrics';
import useActivityLogs from '../hooks/useActivityLogs';

// Custom styled components
const Card = ({ children, style, ...props }: any) => (
  <View style={[styles.card, style]} {...props}>
    {children}
  </View>
);

const CardContent = ({ children, style, ...props }: any) => (
  <View style={[styles.cardContent, style]} {...props}>
    {children}
  </View>
);

const Button = ({ children, mode = 'contained', onPress, style, icon, ...props }: any) => (
  <TouchableOpacity
    style={[
      styles.button,
      mode === 'contained' && styles.buttonContained,
      mode === 'outlined' && styles.buttonOutlined,
      style,
    ]}
    onPress={onPress}
    {...props}
  >
    {icon && <View style={styles.buttonIcon}>{icon()}</View>}
    <Text style={[
      styles.buttonText,
      mode === 'contained' && styles.buttonTextContained,
      mode === 'outlined' && styles.buttonTextOutlined,
    ]}>
      {children}
    </Text>
  </TouchableOpacity>
);

const AdminDashboard = () => {
  const [selectedSection, setSelectedSection] = useState('overview');
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<string>('');

  const { financialMetrics, loading: financeLoading } = useFinancialAnalytics();
  const { systemMetrics, loading: systemLoading } = useSystemMetrics();
  const { logs, loading: logsLoading } = useActivityLogs();

  const sections = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'finance', label: 'Finance', icon: 'attach-money' },
    { id: 'users', label: 'Users', icon: 'people' },
    { id: 'academic', label: 'Academic', icon: 'school' },
    { id: 'system', label: 'System', icon: 'settings' },
  ];

  const renderSection = () => {
    switch (selectedSection) {
      case 'overview':
        return (
          <>
            <QuickActions />
            <View style={styles.row}>
              <View style={[styles.card, styles.halfCard]}>
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>Financial Overview</Text>
                  <FinancialMetricsCard metrics={financialMetrics} />
                </View>
              </View>
              <View style={[styles.card, styles.halfCard]}>
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>System Health</Text>
                  <SystemHealth metrics={systemMetrics} />
                </View>
              </View>
            </View>
            <ActivityLogs logs={logs} />
          </>
        );
      case 'finance':
        return (
          <>
            <CashFlowChart />
            <View style={styles.row}>
              <RevenueAnalysisChart />
              <PaymentTrendsChart />
            </View>
          </>
        );
      case 'users':
        return <StaffAnalyticsDashboard />;
      case 'academic':
        return (
          <View style={styles.row}>
            <StudentMetrics />
            <TeacherMetrics />
          </View>
        );
      case 'system':
        return <SystemHealth metrics={systemMetrics} detailed />;
      default:
        return null;
    }
  };

  const renderModal = () => (
    <Modal
      visible={showModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <Text style={styles.modalText}>{modalContent}</Text>
          <Button onPress={() => setShowModal(false)}>Close</Button>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <View style={styles.tabs}>
          {sections.map((section) => (
            <TouchableOpacity
              key={section.id}
              style={[
                styles.tab,
                selectedSection === section.id && styles.tabActive
              ]}
              onPress={() => setSelectedSection(section.id)}
            >
              <MaterialIcons
                name={section.icon}
                size={24}
                color={selectedSection === section.id ? '#fff' : '#007AFF'}
              />
              <Text style={[
                styles.tabText,
                selectedSection === section.id && styles.tabTextActive
              ]}>
                {section.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {renderSection()}
      {/* Bulk Promotions Section */}
      <Card style={{ marginTop: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Bulk Promotions / Student Enrollments</Text>
        <EnrollmentManager />
      </Card>
      {renderModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  tabs: {
    flexDirection: 'row',
    marginTop: 16,
    flexWrap: 'wrap',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 8,
  },
  tabTextActive: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
  },
  halfCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  // Custom component styles
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    minHeight: 36,
  },
  buttonContained: {
    backgroundColor: '#007AFF',
  },
  buttonOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonTextContained: {
    color: '#fff',
  },
  buttonTextOutlined: {
    color: '#007AFF',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
});

export default AdminDashboard;
