import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { Payroll } from '../services/comprehensiveFinanceApi';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface PayrollPrintModalProps {
  visible: boolean;
  onClose: () => void;
  payroll: Payroll | null;
}

const { width } = Dimensions.get('window');

const PayrollPrintModal: React.FC<PayrollPrintModalProps> = ({ visible, onClose, payroll }) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);

  const generateHTML = (payroll: Payroll) => {
    const formatCurrency = (amount: number) => {
      return `Afg ${amount.toLocaleString()}`;
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Payroll Slip - ${payroll.employeeName}</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 0;
              color: #333;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #3b82f6;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .company-name {
              font-size: 28px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 5px;
            }
            .company-subtitle {
              font-size: 14px;
              color: #6b7280;
              margin-bottom: 10px;
            }
            .payroll-title {
              font-size: 24px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 5px;
            }
            .payroll-period {
              font-size: 16px;
              color: #6b7280;
            }
            .content {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .employee-info, .payroll-info {
              width: 48%;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #1f2937;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 8px;
              margin-bottom: 15px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .info-label {
              font-weight: 500;
              color: #6b7280;
            }
            .info-value {
              font-weight: 600;
              color: #1f2937;
            }
            .salary-breakdown {
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 30px;
            }
            .salary-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #f3f4f6;
            }
            .salary-row:last-child {
              border-bottom: none;
            }
            .net-salary-row {
              border-top: 2px solid #3b82f6;
              padding-top: 15px;
              margin-top: 15px;
              font-weight: bold;
              font-size: 18px;
            }
            .positive {
              color: #059669;
            }
            .negative {
              color: #dc2626;
            }
            .net-salary {
              color: #1e40af;
              font-size: 20px;
            }
            .status-section {
              text-align: center;
              margin-bottom: 30px;
            }
            .status-badge {
              display: inline-block;
              padding: 10px 20px;
              border-radius: 20px;
              font-weight: bold;
              font-size: 16px;
            }
            .status-paid {
              background-color: #d1fae5;
              color: #059669;
            }
            .status-pending {
              background-color: #fef3c7;
              color: #d97706;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 12px;
            }
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
            }
            .signature-box {
              width: 45%;
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #000;
              margin-top: 40px;
              margin-bottom: 5px;
            }
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 60px;
              color: rgba(59, 130, 246, 0.1);
              z-index: -1;
              pointer-events: none;
            }
          </style>
        </head>
        <body>
          <div class="watermark">PAID</div>
          
          <div class="header">
            <div class="company-name">Excellence School</div>
            <div class="company-subtitle">Excellence in Education Since 2010</div>
            <div class="company-subtitle">123 Education Street, Kabul, Afghanistan</div>
            <div class="company-subtitle">Phone: +93 123 456 789 | Email: info@excellenceschool.af</div>
            <div class="payroll-title">PAYROLL SLIP</div>
            <div class="payroll-period">${payroll.month} ${payroll.year}</div>
          </div>

          <div class="content">
            <div class="employee-info">
              <div class="section-title">Employee Information</div>
              <div class="info-row">
                <span class="info-label">Employee ID:</span>
                <span class="info-value">${payroll.employeeId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Employee Name:</span>
                <span class="info-value">${payroll.employeeName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Pay Period:</span>
                <span class="info-value">${payroll.month} ${payroll.year}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Payment Date:</span>
                <span class="info-value">${payroll.paidAt ? formatDate(payroll.paidAt) : 'Pending'}</span>
              </div>
            </div>
            
            <div class="payroll-info">
              <div class="section-title">Payroll Details</div>
              <div class="info-row">
                <span class="info-label">Payroll ID:</span>
                <span class="info-value">${payroll.id}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="info-value">${payroll.status.toUpperCase()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Generated:</span>
                <span class="info-value">${new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div class="salary-breakdown">
            <div class="section-title">Salary Breakdown</div>
            <div class="salary-row">
              <span class="info-label">Basic Salary:</span>
              <span class="info-value">${formatCurrency(payroll.basicSalary)}</span>
            </div>
            <div class="salary-row">
              <span class="info-label">Allowances:</span>
              <span class="info-value positive">+ ${formatCurrency(payroll.allowances)}</span>
            </div>
            <div class="salary-row">
              <span class="info-label">Deductions:</span>
              <span class="info-value negative">- ${formatCurrency(payroll.deductions)}</span>
            </div>
            <div class="salary-row net-salary-row">
              <span class="info-label">Net Salary:</span>
              <span class="info-value net-salary">${formatCurrency(payroll.netSalary)}</span>
            </div>
          </div>

          <div class="status-section">
            <div class="status-badge ${payroll.status === 'paid' ? 'status-paid' : 'status-pending'}">
              ${payroll.status.toUpperCase()}
            </div>
          </div>

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div>Employee Signature</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div>Authorized Signature</div>
            </div>
          </div>

          <div class="footer">
            <p>This is a computer-generated document. No physical signature required.</p>
            <p>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p>© 2024 Excellence School. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrint = async () => {
    if (!payroll) return;
    
    setLoading(true);
    try {
      const html = generateHTML(payroll);
      await Print.printAsync({
        html,
        printerUrl: undefined, // Use default printer
      });
      Alert.alert('Success', 'Payroll slip has been sent to printer!');
    } catch (error) {
      
      Alert.alert('Error', 'Failed to print payroll slip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!payroll) return;
    
    setLoading(true);
    try {
      const html = generateHTML(payroll);
      const { uri } = await Print.printToFileAsync({ html });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Payroll Slip',
        });
      } else {
        Alert.alert('Success', 'Payroll slip has been saved as PDF!');
      }
    } catch (error) {
      
      Alert.alert('Error', 'Failed to download payroll slip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!payroll) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return `Afg ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Payroll Slip Preview</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Print Actions */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handlePrint}
              disabled={loading}
            >
              <Feather name="printer" size={20} color="white" />
              <Text style={styles.actionButtonText}>Print A4</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.success || '#10b981' }]}
              onPress={handleDownload}
              disabled={loading}
            >
              <Feather name="download" size={20} color="white" />
              <Text style={styles.actionButtonText}>Save PDF</Text>
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                {loading ? 'Generating PDF...' : 'Processing...'}
              </Text>
            </View>
          )}

          {/* Payroll Content Preview */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Company Header */}
            <View style={styles.companyHeader}>
              <View style={styles.logoContainer}>
                <Feather name="building" size={40} color={colors.primary} />
              </View>
              <View style={styles.companyInfo}>
                <Text style={[styles.companyName, { color: colors.text }]}>
                  Excellence School
                </Text>
                <Text style={[styles.companySubtitle, { color: colors.textSecondary }]}>
                  Excellence in Education Since 2010
                </Text>
                <Text style={[styles.companyAddress, { color: colors.textSecondary }]}>
                  123 Education Street, Kabul, Afghanistan
                </Text>
                <Text style={[styles.companyContact, { color: colors.textSecondary }]}>
                  Phone: +93 123 456 789 | Email: info@excellenceschool.af
                </Text>
              </View>
            </View>

            {/* Payroll Title */}
            <View style={styles.payrollTitle}>
              <Text style={[styles.payrollTitleText, { color: colors.text }]}>
                PAYROLL SLIP
              </Text>
              <Text style={[styles.payrollPeriod, { color: colors.textSecondary }]}>
                {payroll.month} {payroll.year}
              </Text>
            </View>

            {/* Employee Information */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Employee Information
              </Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Employee ID:
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {payroll.employeeId}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Employee Name:
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {payroll.employeeName}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Pay Period:
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {payroll.month} {payroll.year}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Payment Date:
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {payroll.paidAt ? formatDate(payroll.paidAt) : 'Pending'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Salary Breakdown */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Salary Breakdown
              </Text>
              <View style={styles.salaryBreakdown}>
                <View style={styles.salaryRow}>
                  <Text style={[styles.salaryLabel, { color: colors.textSecondary }]}>
                    Basic Salary:
                  </Text>
                  <Text style={[styles.salaryValue, { color: colors.text }]}>
                    {formatCurrency(payroll.basicSalary)}
                  </Text>
                </View>
                <View style={styles.salaryRow}>
                  <Text style={[styles.salaryLabel, { color: colors.textSecondary }]}>
                    Allowances:
                  </Text>
                  <Text style={[styles.salaryValue, { color: colors.success || '#10b981' }]}>
                    + {formatCurrency(payroll.allowances)}
                  </Text>
                </View>
                <View style={styles.salaryRow}>
                  <Text style={[styles.salaryLabel, { color: colors.textSecondary }]}>
                    Deductions:
                  </Text>
                  <Text style={[styles.salaryValue, { color: colors.error || '#ef4444' }]}>
                    - {formatCurrency(payroll.deductions)}
                  </Text>
                </View>
                <View style={[styles.salaryRow, styles.netSalaryRow]}>
                  <Text style={[styles.salaryLabel, styles.netSalaryLabel, { color: colors.text }]}>
                    Net Salary:
                  </Text>
                  <Text style={[styles.salaryValue, styles.netSalaryValue, { color: colors.primary }]}>
                    {formatCurrency(payroll.netSalary)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Payment Status */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Payment Status
              </Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: payroll.status === 'paid' ? (colors.success + '20') : (colors.warning + '20') }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: payroll.status === 'paid' ? colors.success : colors.warning }
                ]}>
                  {payroll.status.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Signature Section */}
            <View style={styles.signatureSection}>
              <View style={styles.signatureBox}>
                <View style={styles.signatureLine} />
                <Text style={[styles.signatureLabel, { color: colors.textSecondary }]}>
                  Employee Signature
                </Text>
              </View>
              <View style={styles.signatureBox}>
                <View style={styles.signatureLine} />
                <Text style={[styles.signatureLabel, { color: colors.textSecondary }]}>
                  Authorized Signature
                </Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                This is a computer-generated document. No signature required.
              </Text>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </Text>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                © 2024 Excellence School. All rights reserved.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: width - 40,
    maxHeight: '90%',
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    color: '#1e40af',
  },
  companySubtitle: {
    fontSize: 12,
    marginBottom: 2,
    fontStyle: 'italic',
  },
  companyAddress: {
    fontSize: 12,
    marginBottom: 2,
  },
  companyContact: {
    fontSize: 12,
  },
  payrollTitle: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  payrollTitleText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  payrollPeriod: {
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  infoGrid: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  salaryBreakdown: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 20,
    gap: 12,
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  salaryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  salaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  netSalaryRow: {
    borderTopWidth: 2,
    borderTopColor: '#3b82f6',
    paddingTop: 12,
    marginTop: 8,
  },
  netSalaryLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  netSalaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 24,
  },
  signatureBox: {
    width: '45%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#000',
    marginBottom: 8,
  },
  signatureLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
});

export default PayrollPrintModal; 
