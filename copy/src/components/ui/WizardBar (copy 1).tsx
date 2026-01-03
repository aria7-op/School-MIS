import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PaymentModal from './modals/PaymentModal';
import api from '../../services/api/api';
import ViewStaff from './modals/ViewStaff';
import SalaryPaymentModal from './SalaryPaymentModal';
import AddBudgetModal from '../../features/finance/components/AddBudgetModal';
import CustomerForm from '../../features/customers/customerForm';
import AddClassButton from '../../features/classes/components/AddClassButton';
import { Class } from '../../features/classes/types';
import AddSubjectButton from '../../features/subjects/components/AddSubjectButton';
import { Subject } from '../../features/subjects/types';
import AddSubjectModal from '../../features/subjects/components/AddSubjectModal';
// import AddStaffButton from '../../features/staff/components/AddStaffButton';
import { StaffMember } from '../../features/staff/types';
// import AddStaffModal from '../../features/staff/components/AddStaffModal';
import AddClassModal from '../../features/classes/components/AddClassModal';
import customerApi from '../../features/customers/api';
import { useTheme } from '@react-navigation/native';
import { useTranslation } from '../../contexts/TranslationContext';

interface WizardBarProps {
  rtl?: boolean;
  position?: 'left' | 'right';
}

const WizardBar: React.FC<WizardBarProps> = ({ rtl, position = 'right' }) => {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(60));
  const [showStaffView, setShowStaffView] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const { t } = useTranslation();

  const getAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No authentication token found');
      return token;
    } catch (error) {
      
      throw error;
    }
  };

  const fetchStaffMembers = async () => {
    setIsLoading(true);
    try {
      const token = await getAuthToken();
      const response = await api.getStaffMembers(token);
      setStaffMembers(response.data || []);
      setShowSalaryModal(true);
    } catch (error) {
      
      Alert.alert('Error', 'Failed to fetch staff members');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const token = await getAuthToken();
      const response = await fetch('https://sapi.ariadeltatravel.com/api/students', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      const studentsArray = Array.isArray(data) ? data : [];

      setStudents(studentsArray);
      setShowPaymentModal(true);
    } catch (error) {
      
      Alert.alert('Error', 'Failed to fetch students');
    } finally {
      setIsLoading(false);

    }
  };

  const quickActions = [
    { icon: 'account-group', label: t('view_staff'), action: 'viewStaff' },
    { icon: 'cash-plus', label: t('add_payment'), action: 'addPayment' },
    { icon: 'cash-multiple', label: t('pay_salary'), action: 'paySalary' },
    { icon: 'wallet', label: t('add_budgets'), action: 'addBudget' },
    { icon: 'account-plus-outline', label: t('add_visitor'), action: 'addCustomer' },
  ];

  const toggleExpand = () => {
    Animated.timing(animation, {
      toValue: expanded ? 60 : 200,
      duration: 200,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  const closeAllModals = () => {
    setShowStaffView(false);
    setShowPaymentModal(false);
    setShowBudgetModal(false);
    setShowCustomerForm(false);
    setShowSalaryModal(false);
  };

  const handleAction = (action: string) => {
    closeAllModals();
    switch (action) {
      case 'viewStaff':
        setShowStaffView(true);
        break;
      case 'addPayment':
        fetchStudents();
        break;
      case 'paySalary':
        fetchStaffMembers();
        break;
      case 'addBudget':
        setShowBudgetModal(true);
        break;
      case 'addCustomer':
        setEditingCustomer(null);
        setShowCustomerForm(true);
        break;
      case 'addClass':
        setShowAddClassModal(true);
        break;
      default:

    }
  };

  const handleCustomerSubmit = async (formData: any) => {
    try {
      await customerApi.addCustomer(formData);
      setShowCustomerForm(false);
      Alert.alert('Success', 'Visitor added successfully');
    } catch (error) {
      
      Alert.alert('Error', 'Failed to add customer');
    }
  };

  // Debug log for PaymentModal rendering

  return (
    <>
      {/* Class Form Modal - Will only show when showAddClassModal is true */}
      {showAddClassModal && (
        <AddClassModal
          visible={showAddClassModal}
          onClose={() => setShowAddClassModal(false)}
          onSubmit={(newClass: Omit<Class, 'id'>) => {
            // Handle new class addition

            setShowAddClassModal(false);
          }}
        />
      )}

      {/* Subject Form Modal - Will only show when showAddSubjectModal is true */}
      {showAddSubjectModal && (
        <AddSubjectModal
          visible={showAddSubjectModal}
          onClose={() => setShowAddSubjectModal(false)}
          onSubmit={(newSubject: Omit<Subject, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
            // Handle new subject addition

            setShowAddSubjectModal(false);
          }}
        />
      )}

      {/* Staff/Teacher Form Modal - Will only show when showAddStaffModal is true
      {showAddStaffModal && (
        <AddStaffModal
          visible={showAddStaffModal}
          onClose={() => setShowAddStaffModal(false)}
          onAddStaff={(staff) => {
            // Handle new staff/teacher addition
        setShowAddStaffModal(false);
          }}
        />
      )}        */}
         
      <Animated.View style={[
        styles.wizardBarContainer,
        { width: animation, backgroundColor: colors.card },
        position === 'left'
          ? { left: 0, right: undefined}
          : { right: 0, left: undefined},
        rtl ? { flexDirection: 'column', direction: 'rtl' } : {}
      ]}>
        <TouchableOpacity style={styles.wizardToggleButton} onPress={toggleExpand}>
          <MaterialCommunityIcons
            name={expanded ? 'chevron-right' : 'chevron-left'}
            size={24}
            color="#6366f1"
          />
        </TouchableOpacity>

        {expanded ? (
          <>
            <Text style={[styles.wizardBarTitle, rtl && { textAlign: 'right' }]}>{t('quick_actions')}</Text>
            <View style={styles.wizardActions}>
              {quickActions.map((item) => (
                <TouchableOpacity
                  key={item.action}
                  style={[styles.wizardActionItem, rtl && { flexDirection: 'row-reverse' }]}
                  onPress={() => handleAction(item.action)}
                >
                  <MaterialCommunityIcons name={item.icon} size={20} color="#6366f1" style={[styles.wizardActionIcon, rtl ? { marginLeft: 10, marginRight: 0 } : { marginRight: 10, marginLeft: 0 }]} />
                  <Text style={[styles.wizardActionText, rtl && { textAlign: 'right' }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.wizardActionItem, rtl && { flexDirection: 'row-reverse' }]}
                onPress={() => setShowAddClassModal(true)}
              >
                <MaterialCommunityIcons
                  name="school"
                  size={20}
                  color="#6366f1"
                  style={[styles.wizardActionIcon, rtl ? { marginLeft: 10, marginRight: 0 } : { marginRight: 10, marginLeft: 0 }]}
                />
                <Text style={[styles.wizardActionText, rtl && { textAlign: 'right' }]}>{t('add_class')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.wizardActionItem, rtl && { flexDirection: 'row-reverse' }]}
                onPress={() => setShowAddSubjectModal(true)}
              >
                <MaterialCommunityIcons
                  name="book-open-variant"
                  size={20}
                  color="#6366f1"
                  style={[styles.wizardActionIcon, rtl ? { marginLeft: 10, marginRight: 0 } : { marginRight: 10, marginLeft: 0 }]}
                />
                <Text style={[styles.wizardActionText, rtl && { textAlign: 'right' }]}>{t('add_subject')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.wizardActionItem, rtl && { flexDirection: 'row-reverse' }]}
                onPress={() => setShowAddStaffModal(true)}
              >
                <MaterialCommunityIcons
                  name="account-plus"
                  size={20}
                  color="#6366f1"
                  style={[styles.wizardActionIcon, rtl ? { marginLeft: 10, marginRight: 0 } : { marginRight: 10, marginLeft: 0 }]}
                />
                <Text style={[styles.wizardActionText, rtl && { textAlign: 'right' }]}>{t('add_users')}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.collapsedActions}>
            {quickActions.map((item, index) => (
              <TouchableOpacity
                key={item.action}
                style={[styles.collapsedActionItem, { marginTop: index === 0 ? 0 : 10 }, rtl && { flexDirection: 'row-reverse' }]}
                onPress={() => handleAction(item.action)}
              >
                <MaterialCommunityIcons name={item.icon} size={20} color="#6366f1"/>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.collapsedActionItem, { marginTop: 10 }, rtl && { flexDirection: 'row-reverse' }]}
              onPress={() => setShowAddSubjectModal(true)}
            >
              <MaterialCommunityIcons name="book-open-variant" size={20} color="#6366f1" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.collapsedActionItem, { marginTop: 10 }, rtl && { flexDirection: 'row-reverse' }]}
              onPress={() => setShowAddStaffModal(true)}
            >
              <MaterialCommunityIcons name="account-plus" size={20} color="#6366f1" />
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      {/* Budget Modal */}
      <AddBudgetModal
        visible={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        onSave={() => setShowBudgetModal(false)}
      />

      {/* Staff View Modal */}
      <ViewStaff
        visible={showStaffView}
        onClose={() => setShowStaffView(false)}
        onEdit={() => {}}
        onDelete={() => {}}
      />

      {/* Customer Form Modal - Will only show when showCustomerForm is true */}
      {showCustomerForm && (
        <CustomerForm
          visible={showCustomerForm}
          initialValues={undefined}
          onSubmit={handleCustomerSubmit}
          loading={isLoading}
          onClose={() => setShowCustomerForm(false)}
        />
      )}

      {/* Salary Payment Modal */}
      <SalaryPaymentModal
        visible={showSalaryModal}
        onClose={() => setShowSalaryModal(false)}
        onSubmit={() => setShowSalaryModal(false)}
        staffMembers={staffMembers}
      />

      {/* Payment Modal */}
      <PaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        students={students}
        onSubmit={() => setShowPaymentModal(false)}
        isLoadingStudents={isLoading}
      />
    </>
  );
};

const styles = StyleSheet.create({
  wizardBarContainer: {
    paddingVertical: 20,
    justifyContent: 'flex-start',
    alignItems: 'center',
    height: '100%',
    position: 'absolute',
    zIndex: 10,
    overflow: 'hidden',
    minWidth: 60,
    maxWidth: 240,
  },
  wizardToggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  wizardBarTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    width: '100%',
    textAlign: 'center',
  },
  wizardActions: {
    width: '100%',
    paddingHorizontal: 10,
    gap: 8,
  },
  wizardActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#f9fafb',
    width: '100%',
  },
  wizardActionIcon: {
    marginRight: 10,
  },
  wizardActionText: {
    color: '#4b5563',
    fontSize: 13,
    fontWeight: '500',
  },
  collapsedActions: {
    alignItems: 'center',
    marginTop: 10,
  },
  collapsedActionItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WizardBar;
