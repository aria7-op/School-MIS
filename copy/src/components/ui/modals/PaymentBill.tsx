import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@react-navigation/native';

interface PaymentBillProps {
  visible: boolean;
  data: any;
  onClose: () => void;
  onPrint: () => void;
}

const PaymentBill: React.FC<PaymentBillProps> = ({ visible, data, onClose, onPrint }) => {
  const { colors } = useTheme();
  if (!data) return null;
  const outstanding = (parseFloat(data.amount) - parseFloat(data.amount_paid || '0') - parseFloat(data.discount || '0')).toFixed(2);
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={styles.schoolName}>Tailoring School</Text>
            <Text style={styles.schoolAddress}>123 Fashion Ave, Lagos, NG | +234 800 000 0000</Text>
            <Text style={styles.receiptTitle}>PAYMENT RECEIPT</Text>
          </View>

          {/* Receipt Info Row */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Receipt No:</Text>
            <Text style={styles.infoValue}>{data.reference || 'N/A'}</Text>
            <Text style={styles.infoLabel}>Date:</Text>
            <Text style={styles.infoValue}>{data.date}</Text>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={styles.infoValue}>{data.payment_status}</Text>
          </View>

          {/* Payee Info */}
          <View style={styles.payeeRow}>
            <Text style={styles.payeeLabel}>Student:</Text>
            <Text style={styles.payeeValue}>{data.student.firstName} {data.student.lastName}</Text>
            <Text style={styles.payeeLabel}>Class:</Text>
            <Text style={styles.payeeValue}>{data.student.class?.class_name || 'N/A'}</Text>
            <Text style={styles.payeeLabel}>Method:</Text>
            <Text style={styles.payeeValue}>{data.payment_method}</Text>
          </View>

          {/* Table Section */}
          <View style={styles.tableSection}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeader, {flex:2}]}>Description</Text>
              <Text style={styles.tableHeader}>Amount</Text>
              <Text style={styles.tableHeader}>Discount</Text>
              <Text style={styles.tableHeader}>Final</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, {flex:2}]}>Tuition Fee</Text>
              <Text style={styles.tableCell}>${data.amount}</Text>
              <Text style={styles.tableCell}>${data.discount || '0.00'}</Text>
              <Text style={styles.tableCell}>${data.final_amount}</Text>
            </View>
          </View>

          {/* Totals Row */}
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Total:</Text>
            <Text style={styles.totalsValue}>${data.amount}</Text>
            <Text style={styles.totalsLabel}>Paid:</Text>
            <Text style={styles.totalsValue}>${data.amount_paid}</Text>
            <Text style={styles.totalsLabel}>Outstanding:</Text>
            <Text style={styles.totalsValue}>${outstanding}</Text>
          </View>

          {/* Signature Section */}
          <View style={styles.signatureRow}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Signature</Text>
          </View>

          {/* Footer */}
          <Text style={styles.thankYou}>Thank you for your payment!</Text>
          <Text style={styles.poweredBy}>Powered by Tailoring App</Text>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.printButton, { marginBottom: 0 }]}
              onPress={onPrint}
            >
              <Text style={styles.printButtonText}>Print</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Close</Text>
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
    width: Platform.OS === 'web' ? 480 : '90%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 0,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  schoolName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#22223b',
    marginBottom: 2,
  },
  schoolAddress: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginTop: 4,
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
    marginRight: 2,
  },
  infoValue: {
    fontSize: 13,
    color: '#22223b',
    fontWeight: '600',
    marginRight: 8,
    minWidth: 48,
  },
  payeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  payeeLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
    marginRight: 2,
  },
  payeeValue: {
    fontSize: 13,
    color: '#22223b',
    fontWeight: '600',
    marginRight: 8,
    minWidth: 48,
  },
  tableSection: {
    marginTop: 10,
    marginBottom: 10,
    marginHorizontal: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    backgroundColor: '#f9fafb',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f3f4f6',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeader: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'left',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    color: '#22223b',
    textAlign: 'left',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  totalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  totalsLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
    marginRight: 2,
  },
  totalsValue: {
    fontSize: 13,
    color: '#22223b',
    fontWeight: '700',
    marginRight: 8,
    minWidth: 48,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  signatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 18,
  },
  signatureLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d1d5db',
    marginRight: 12,
  },
  signatureLabel: {
    fontSize: 15,
    color: '#6366f1',
    fontWeight: '600',
    letterSpacing: 1,
  },
  thankYou: {
    textAlign: 'center',
    color: '#10b981',
    fontWeight: '700',
    fontSize: 15,
    marginTop: 10,
  },
  poweredBy: {
    textAlign: 'center',
    color: '#a1a1aa',
    fontSize: 12,
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 18,
    paddingTop: 0,
    zIndex: 2,
  },
  printButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    marginRight: 8,
  },
  printButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  closeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    marginLeft: 8,
  },
  closeButtonText: {
    color: '#4b5563',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default PaymentBill; 
