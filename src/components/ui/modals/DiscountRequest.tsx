import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import jsPDF from 'jspdf';
import secureApiService from '../../../services/secureApiService';

const DiscountRequest = ({ visible, data, onClose, onPrint, onPdfUploaded }) => {
  if (!data) return null;

  const handlePrintAndUpload = async () => {
    // 1. Generate PDF
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Discount Request', 20, 20);
    doc.setFontSize(12);
    doc.text(`Student: ${data.student.firstName} ${data.student.lastName}`, 20, 35);
    doc.text(`Class: ${data.student.class?.class_name || 'N/A'}`, 20, 45);
    doc.text(`Date: ${data.date}`, 20, 55);
    doc.text(`Total Amount: $${data.amount}`, 20, 65);
    doc.text(`Discount: $${data.discount}`, 20, 75);
    doc.text(`Final Amount: $${data.final_amount}`, 20, 85);
    doc.text(`Reason: ${data.reason || '-'}`, 20, 95);
    doc.text(`Status: ${data.payment_status}`, 20, 105);
    doc.text('Signature: ____________________', 20, 120);
    doc.text('Thank you for your request!', 20, 135);
    doc.text('Powered by Tailoring App', 20, 145);

    // 2. Convert PDF to Blob
    const pdfBlob = doc.output('blob');
    const formData = new FormData();
    formData.append('file', pdfBlob, 'discount_request.pdf');

    // 3. Upload PDF to backend
    try {
      const uploadRes = await secureApiService.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const pdfUrl = uploadRes.data?.url || uploadRes.data?.path;
      if (onPdfUploaded && pdfUrl) onPdfUploaded(pdfUrl);
    } catch (err) {
      alert('Failed to upload PDF');
      return;
    }

    // 4. Optionally, call onPrint (for window.print)
    if (onPrint) onPrint();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Decorative Header with Bird Icon */}
          <View style={styles.decorHeader}>
            <MaterialIcons name="flight" size={36} color="#6366f1" style={styles.birdIcon} />
            <Text style={styles.decorTitle}>Discount Request</Text>
          </View>
          {/* Watermark Bird Icon */}
          <MaterialIcons name="flight" size={120} color="#e0e7ff" style={styles.watermark} />
          <View style={styles.billContent}>
            <Text style={styles.studentName}>{data.student.firstName} {data.student.lastName}</Text>
            <Text style={styles.detail}>Class: <Text style={styles.bold}>{data.student.class?.class_name || 'N/A'}</Text></Text>
            <Text style={styles.detail}>Date: <Text style={styles.bold}>{data.date}</Text></Text>
            <View style={styles.sectionDivider} />
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>${data.amount}</Text>
            <Text style={styles.detail}>Discount: <Text style={styles.bold}>${data.discount}</Text></Text>
            <Text style={styles.detail}>Final Amount: <Text style={styles.bold}>${data.final_amount}</Text></Text>
            <Text style={styles.detail}>Reason: <Text style={styles.bold}>{data.reason || '-'}</Text></Text>
            <Text style={styles.detail}>Status: <Text style={styles.bold}>{data.payment_status}</Text></Text>
            <View style={styles.sectionDivider} />
            {/* Signature Section */}
            <View style={styles.signatureRow}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Signature</Text>
            </View>
            <Text style={styles.thankYou}>Thank you for your request!</Text>
            <Text style={styles.poweredBy}>Powered by Tailoring App</Text>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.printButton, { marginBottom: 0 }]}
              onPress={handlePrintAndUpload}
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
    borderRadius: 18,
    padding: 0,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  decorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    zIndex: 2,
  },
  birdIcon: {
    marginRight: 12,
  },
  decorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6366f1',
    letterSpacing: 1,
  },
  watermark: {
    position: 'absolute',
    top: 80,
    left: '50%',
    marginLeft: -60,
    opacity: 0.08,
    zIndex: 0,
    pointerEvents: 'none',
  },
  billContent: {
    padding: 28,
    paddingTop: 18,
    zIndex: 2,
  },
  studentName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 2,
  },
  detail: {
    fontSize: 15,
    color: '#4b5563',
    marginBottom: 2,
  },
  bold: {
    fontWeight: '700',
    color: '#111827',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  amountLabel: {
    fontSize: 15,
    color: '#6366f1',
    fontWeight: '600',
    marginTop: 8,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#10b981',
    marginBottom: 6,
  },
  signatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
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
    fontSize: 16,
    marginTop: 18,
  },
  poweredBy: {
    textAlign: 'center',
    color: '#a1a1aa',
    fontSize: 13,
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

export default DiscountRequest; 
