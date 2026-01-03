import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';

interface PaymentBillData {
  student: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    class?: {
      class_name: string;
    };
    parent?: {
      firstName: string;
      lastName: string;
      phone: string;
    };
  };
  payment: {
    amount: number;
    discount: number;
    total: number;
    method: string;
    type: string;
    remarks?: string;
    dueDate: string;
    receiptNumber?: string;
  };
  school?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
}

interface EnhancedPaymentBillProps {
  visible: boolean;
  data: PaymentBillData;
  onClose: () => void;
  onPrint: () => void;
  onSave: () => void;
}

const EnhancedPaymentBill: React.FC<EnhancedPaymentBillProps> = ({
  visible,
  data,
  onClose,
  onPrint,
  onSave,
}) => {
  const { colors } = useTheme();
  const outstanding = data.payment.total - data.payment.amount;

  const formatCurrency = (amount: number) => {
    return `Afg ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH': return 'cash';
      case 'CARD': return 'credit-card';
      case 'BANK_TRANSFER': return 'bank';
      case 'MOBILE_PAYMENT': return 'cellphone';
      default: return 'cash';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'TUITION_FEE': return '#3b82f6';
      case 'TRANSPORT_FEE': return '#10b981';
      case 'LIBRARY_FEE': return '#f59e0b';
      case 'LABORATORY_FEE': return '#ef4444';
      case 'SPORTS_FEE': return '#22c55e';
      case 'EXAM_FEE': return '#f97316';
      case 'UNIFORM_FEE': return '#8b5cf6';
      case 'MEAL_FEE': return '#ec4899';
      case 'HOSTEL_FEE': return '#06b6d4';
      case 'OTHER': return '#6b7280';
      default: return '#6b7280';
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.schoolInfo}>
                <MaterialCommunityIcons 
                  name="school" 
                  size={32} 
                  color={colors.primary} 
                />
                <View style={styles.schoolDetails}>
                  <Text style={[styles.schoolName, { color: colors.text }]}>
                    {data.school?.name || 'School Management System'}
                  </Text>
                  {data.school?.address && (
                    <Text style={[styles.schoolAddress, { color: colors.text + '80' }]}>
                      {data.school.address}
                    </Text>
                  )}
                  {data.school?.phone && (
                    <Text style={[styles.schoolContact, { color: colors.text + '80' }]}>
                      Phone: {data.school.phone}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.receiptHeader}>
                <Text style={[styles.receiptTitle, { color: colors.text }]}>
                  PAYMENT RECEIPT
                </Text>
                <Text style={[styles.receiptNumber, { color: colors.primary }]}>
                  #{data.payment.receiptNumber || `RCP-Afg {Date.now()}`}
                </Text>
              </View>
            </View>

            {/* Bill Information */}
            <View style={styles.billInfoSection}>
              <View style={styles.infoRow}>
                <View style={styles.infoColumn}>
                  <Text style={[styles.infoLabel, { color: colors.text + '80' }]}>Date:</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {formatDate(new Date().toISOString())}
                  </Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={[styles.infoLabel, { color: colors.text + '80' }]}>Due Date:</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {formatDate(data.payment.dueDate)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Student Information */}
            <View style={styles.studentSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Student Information</Text>
              <View style={styles.studentCard}>
                <View style={styles.studentAvatar}>
                  <MaterialCommunityIcons 
                    name="account" 
                    size={32} 
                    color={colors.primary} 
                  />
                </View>
                <View style={styles.studentDetails}>
                  <Text style={[styles.studentName, { color: colors.text }]}>
                    {data.student.firstName} {data.student.lastName}
                  </Text>
                  <Text style={[styles.studentInfo, { color: colors.text + '80' }]}>
                    Class: {data.student.class?.class_name || 'N/A'}
                  </Text>
                  <Text style={[styles.studentInfo, { color: colors.text + '80' }]}>
                    Phone: {data.student.phone}
                  </Text>
                  {data.student.email && (
                    <Text style={[styles.studentInfo, { color: colors.text + '80' }]}>
                      Email: {data.student.email}
                    </Text>
                  )}
                </View>
              </View>
              
              {data.student.parent && (
                <View style={styles.parentCard}>
                  <Text style={[styles.parentTitle, { color: colors.text }]}>Parent/Guardian</Text>
                  <Text style={[styles.parentName, { color: colors.text }]}>
                    {data.student.parent.firstName} {data.student.parent.lastName}
                  </Text>
                  <Text style={[styles.parentInfo, { color: colors.text + '80' }]}>
                    Phone: {data.student.parent.phone}
                  </Text>
                </View>
              )}
            </View>

            {/* Payment Details */}
            <View style={styles.paymentSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Details</Text>
              
              <View style={styles.paymentTypeCard}>
                <View style={[styles.typeBadge, { backgroundColor: getTypeColor(data.payment.type) + '20' }]}>
                  <Text style={[styles.typeText, { color: getTypeColor(data.payment.type) }]}>
                    {data.payment.type.replace('_', ' ')}
                  </Text>
                </View>
                <View style={styles.methodInfo}>
                  <MaterialCommunityIcons 
                    name={getMethodIcon(data.payment.method)} 
                    size={20} 
                    color={colors.text + '60'} 
                  />
                  <Text style={[styles.methodText, { color: colors.text + '60' }]}>
                    {data.payment.method.replace('_', ' ')}
                  </Text>
                </View>
              </View>

              {/* Payment Breakdown */}
              <View style={styles.breakdownSection}>
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.text }]}>Amount Due:</Text>
                  <Text style={[styles.breakdownValue, { color: colors.text }]}>
                    {formatCurrency(data.payment.amount)}
                  </Text>
                </View>
                {data.payment.discount > 0 && (
                  <View style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: colors.text }]}>Discount:</Text>
                    <Text style={[styles.breakdownValue, { color: '#10b981' }]}>
                      -{formatCurrency(data.payment.discount)}
                    </Text>
                  </View>
                )}
                <View style={[styles.breakdownRow, styles.totalRow]}>
                  <Text style={[styles.breakdownLabel, styles.totalLabel, { color: colors.text }]}>
                    Total Amount:
                  </Text>
                  <Text style={[styles.breakdownValue, styles.totalValue, { color: colors.primary }]}>
                    {formatCurrency(data.payment.total)}
                  </Text>
                </View>
              </View>

              {/* Outstanding Amount */}
              {outstanding > 0 && (
                <View style={styles.outstandingSection}>
                  <Text style={[styles.outstandingLabel, { color: '#ef4444' }]}>
                    Outstanding Amount:
                  </Text>
                  <Text style={[styles.outstandingValue, { color: '#ef4444' }]}>
                    {formatCurrency(outstanding)}
                  </Text>
                </View>
              )}

              {/* Remarks */}
              {data.payment.remarks && (
                <View style={styles.remarksSection}>
                  <Text style={[styles.remarksLabel, { color: colors.text }]}>Remarks:</Text>
                  <Text style={[styles.remarksText, { color: colors.text + '80' }]}>
                    {data.payment.remarks}
                  </Text>
                </View>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footerSection}>
              <View style={styles.signatureSection}>
                <View style={styles.signatureLine} />
                <Text style={[styles.signatureLabel, { color: colors.text + '80' }]}>
                  Authorized Signature
                </Text>
              </View>
              <Text style={[styles.thankYou, { color: colors.text }]}>
                Thank you for your payment!
              </Text>
              <Text style={[styles.poweredBy, { color: colors.text + '60' }]}>
                Generated by School Management System
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.printButton, { backgroundColor: colors.primary }]}
              onPress={onPrint}
            >
              <MaterialIcons name="print" size={20} color="white" />
              <Text style={styles.actionButtonText}>Print</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton, { backgroundColor: '#10b981' }]}
              onPress={onSave}
            >
              <MaterialIcons name="save" size={20} color="white" />
              <Text style={styles.actionButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.closeButton, { backgroundColor: colors.border }]}
              onPress={onClose}
            >
              <MaterialIcons name="close" size={20} color={colors.text} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: Platform.OS === 'web' ? 600 : '95%',
    maxWidth: 600,
    maxHeight: '90%',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  schoolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  schoolDetails: {
    marginLeft: 12,
    alignItems: 'center',
  },
  schoolName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  schoolAddress: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 2,
  },
  schoolContact: {
    fontSize: 12,
    textAlign: 'center',
  },
  receiptHeader: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    width: '100%',
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  receiptNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  billInfoSection: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoColumn: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  studentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  studentInfo: {
    fontSize: 12,
    marginBottom: 2,
  },
  parentCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  parentTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  parentName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  parentInfo: {
    fontSize: 12,
  },
  paymentSection: {
    marginBottom: 24,
  },
  paymentTypeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  breakdownSection: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  outstandingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  outstandingLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  outstandingValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  remarksSection: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  remarksLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  remarksText: {
    fontSize: 12,
    lineHeight: 16,
  },
  footerSection: {
    alignItems: 'center',
    marginTop: 24,
  },
  signatureSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  signatureLine: {
    width: 120,
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 12,
  },
  thankYou: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  poweredBy: {
    fontSize: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  printButton: {
    // backgroundColor: colors.primary
  },
  saveButton: {
    // backgroundColor: '#10b981'
  },
  closeButton: {
    // backgroundColor: colors.border
  },
});

export default EnhancedPaymentBill; 
