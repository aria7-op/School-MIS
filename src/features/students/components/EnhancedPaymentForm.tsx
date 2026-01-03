import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Switch,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import googleDriveService from '../services/googleDriveService';
import paymentService, { PaymentData } from '../services/paymentService';

const { width } = Dimensions.get('window');
const isMobile = width < 600;

interface EnhancedPaymentFormProps {
  onPaymentSuccess: (result: any) => void;
  student?: any;
}

const EnhancedPaymentForm: React.FC<EnhancedPaymentFormProps> = ({
  onPaymentSuccess,
  student
}) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [generatingBill, setGeneratingBill] = useState(false);
  
  // Payment form data
  const [amount, setAmount] = useState('');
  const [discount, setDiscount] = useState('');
  const [fine, setFine] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [remarks, setRemarks] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  // Bill generation options
  const [generateBill, setGenerateBill] = useState(true);
  const [billTemplate, setBillTemplate] = useState<any>(null);
  const [billOptions, setBillOptions] = useState({
    includeLogo: true,
    includeQRCode: true,
    includeSignature: true,
    sendEmail: false,
    emailAddress: '',
  });

  // Available templates
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const availableTemplates = await googleDriveService.getAvailableTemplates();
      setTemplates(availableTemplates);
      
      // Set default template if available
      if (availableTemplates.length > 0) {
        setBillTemplate(availableTemplates[0]);
      }
    } catch (error: any) {
      
    } finally {
      setTemplatesLoading(false);
    }
  };

  const calculateTotal = () => {
    const amountValue = parseFloat(amount) || 0;
    const discountValue = parseFloat(discount) || 0;
    const fineValue = parseFloat(fine) || 0;
    return amountValue - discountValue + fineValue;
  };

  const validateForm = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return false;
    }
    
    if (generateBill && !billTemplate) {
      Alert.alert('Error', 'Please select a bill template');
      return false;
    }
    
    if (billOptions.sendEmail && !billOptions.emailAddress) {
      Alert.alert('Error', 'Please enter email address for bill delivery');
      return false;
    }
    
    return true;
  };

  const handleSubmitPayment = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Prepare payment data
      const paymentData: PaymentData = {
        studentId: student?.id ? parseInt(student.id) : undefined,
        parentId: student?.parentId ? parseInt(student.parentId) : undefined,
        amount: parseFloat(amount),
        discount: parseFloat(discount) || 0,
        fine: parseFloat(fine) || 0,
        total: calculateTotal(),
        paymentDate: new Date().toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        status: 'PAID',
        method: paymentMethod as any,
        type: 'TUITION_FEE', // This is correct - matches backend enum
        remarks: remarks || 'Payment with bill generation',
        metadata: {
          paymentSource: "google_drive_integration",
          billGenerated: generateBill,
          templateUsed: billTemplate?.name || 'None',
          userAgent: navigator?.userAgent || "Unknown",
          sessionId: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          paymentNotes: remarks || `Student payment with bill generation`,
          additionalInfo: {
            discountReason: parseFloat(discount) > 0 ? "Applied discount" : undefined,
            paymentChannel: paymentMethod.replace('_', ' '),
            processedBy: "Google Drive Integration"
          },
          customFields: {
            department: student?.department || student?.class?.department || "Unknown",
            semester: new Date().toISOString().slice(0, 7),
            paymentCategory: "Google Drive Bill",
            studentClass: student?.className || student?.class?.name || student?.grade || "Unknown"
          }
        }
      };

      // Submit payment
      const paymentResult = await paymentService.createPayment(paymentData);
      
      // Generate bill if requested
      let billResult = null;
      if (generateBill && billTemplate) {
        setGeneratingBill(true);
        try {
          billResult = await googleDriveService.generateBill({
            paymentId: paymentResult.data?.id || paymentResult.id,
            studentId: student?.id,
            studentName: `${student?.firstName || ''} ${student?.lastName || ''}`.trim(),
            amount: paymentData.total,
            paymentDate: paymentData.paymentDate,
            templateId: billTemplate.fileId,
            templateName: billTemplate.name,
            options: billOptions,
            metadata: {
              paymentMethod: paymentMethod,
              discount: paymentData.discount,
              fine: paymentData.fine,
              remarks: remarks,
              generatedBy: "Enhanced Payment Form"
            }
          });
        } catch (billError: any) {
          
          Alert.alert('Warning', 'Payment successful but bill generation failed: ' + billError.message);
        } finally {
          setGeneratingBill(false);
        }
      }

      // Call success callback
      onPaymentSuccess({
        payment: paymentResult,
        bill: billResult,
        paymentData
      });

      Alert.alert(
        'Payment Successful!',
        generateBill && billResult 
          ? 'Payment processed and bill generated successfully!'
          : 'Payment processed successfully!',
        [
          {
            text: 'View Bill',
            onPress: () => {
              if (billResult?.previewUrl) {
                if (typeof window !== 'undefined') {
                  window.open(billResult.previewUrl, '_blank');
                }
              }
            },
            style: billResult ? 'default' : 'cancel'
          },
          {
            text: 'OK',
            style: 'default'
          }
        ]
      );

    } catch (error: any) {
      
      Alert.alert('Error', error.message || 'Payment submission failed');
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentSection = () => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <View style={styles.sectionHeader}>
        <Icon name="payment" size={24} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Payment Details
        </Text>
      </View>

      <View style={styles.formRow}>
        <View style={styles.formField}>
          <Text style={[styles.label, { color: colors.text }]}>Amount *</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: colors.border
            }]}
            value={amount}
            onChangeText={setAmount}
            placeholder="Enter amount"
            keyboardType="numeric"
            placeholderTextColor={colors.text}
          />
        </View>
        
        <View style={styles.formField}>
          <Text style={[styles.label, { color: colors.text }]}>Discount</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: colors.border
            }]}
            value={discount}
            onChangeText={setDiscount}
            placeholder="0.00"
            keyboardType="numeric"
            placeholderTextColor={colors.text}
          />
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={styles.formField}>
          <Text style={[styles.label, { color: colors.text }]}>Fine</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: colors.border
            }]}
            value={fine}
            onChangeText={setFine}
            placeholder="0.00"
            keyboardType="numeric"
            placeholderTextColor={colors.text}
          />
        </View>
        
        <View style={styles.formField}>
          <Text style={[styles.label, { color: colors.text }]}>Payment Method</Text>
          <View style={[styles.selectContainer, { borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.selectButton, { backgroundColor: colors.background }]}
              onPress={() => {
                Alert.alert(
                  'Payment Method',
                  'Select payment method',
                  [
                    { text: 'Cash', onPress: () => setPaymentMethod('CASH') },
                    { text: 'Card', onPress: () => setPaymentMethod('CARD') },
                    { text: 'Bank Transfer', onPress: () => setPaymentMethod('BANK_TRANSFER') },
                    { text: 'Mobile Payment', onPress: () => setPaymentMethod('MOBILE_PAYMENT') },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
              }}
            >
              <Text style={[styles.selectText, { color: colors.text }]}>
                {paymentMethod.replace('_', ' ')}
              </Text>
              <Icon name="arrow-drop-down" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.formField}>
        <Text style={[styles.label, { color: colors.text }]}>Due Date (Optional)</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.background,
            color: colors.text,
            borderColor: colors.border
          }]}
          value={dueDate}
          onChangeText={setDueDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.text}
        />
      </View>

      <View style={styles.formField}>
        <Text style={[styles.label, { color: colors.text }]}>Remarks</Text>
        <TextInput
          style={[styles.textArea, { 
            backgroundColor: colors.background,
            color: colors.text,
            borderColor: colors.border
          }]}
          value={remarks}
          onChangeText={setRemarks}
          placeholder="Additional notes..."
          multiline
          numberOfLines={3}
          placeholderTextColor={colors.text}
        />
      </View>
    </View>
  );

  const renderBillSection = () => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <View style={styles.sectionHeader}>
        <Icon name="receipt" size={24} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Bill Generation
        </Text>
      </View>

      <View style={styles.switchRow}>
        <Text style={[styles.switchLabel, { color: colors.text }]}>
          Generate Bill
        </Text>
        <Switch
          value={generateBill}
          onValueChange={setGenerateBill}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={generateBill ? '#fff' : '#f4f3f4'}
        />
      </View>

      {generateBill && (
        <>
          <View style={styles.formField}>
            <Text style={[styles.label, { color: colors.text }]}>Bill Template</Text>
            <View style={[styles.selectContainer, { borderColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.selectButton, { backgroundColor: colors.background }]}
                onPress={() => {
                  if (templates.length === 0) {
                    Alert.alert('No Templates', 'Please create templates first');
                    return;
                  }
                  
                  Alert.alert(
                    'Select Template',
                    'Choose a bill template',
                    [
                      ...templates.map(template => ({
                        text: template.name,
                        onPress: () => setBillTemplate(template)
                      })),
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  );
                }}
                disabled={templatesLoading}
              >
                <Text style={[styles.selectText, { color: colors.text }]}>
                  {billTemplate ? billTemplate.name : 'Select template...'}
                </Text>
                <Icon name="arrow-drop-down" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.billOptions}>
            <Text style={[styles.label, { color: colors.text }]}>Bill Options</Text>
            
            <View style={styles.optionRow}>
              <Text style={[styles.optionLabel, { color: colors.text }]}>Include Logo</Text>
              <Switch
                value={billOptions.includeLogo}
                onValueChange={(value) => setBillOptions(prev => ({ ...prev, includeLogo: value }))}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={billOptions.includeLogo ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.optionRow}>
              <Text style={[styles.optionLabel, { color: colors.text }]}>Include QR Code</Text>
              <Switch
                value={billOptions.includeQRCode}
                onValueChange={(value) => setBillOptions(prev => ({ ...prev, includeQRCode: value }))}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={billOptions.includeQRCode ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.optionRow}>
              <Text style={[styles.optionLabel, { color: colors.text }]}>Include Signature</Text>
              <Switch
                value={billOptions.includeSignature}
                onValueChange={(value) => setBillOptions(prev => ({ ...prev, includeSignature: value }))}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={billOptions.includeSignature ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.optionRow}>
              <Text style={[styles.optionLabel, { color: colors.text }]}>Send Email</Text>
              <Switch
                value={billOptions.sendEmail}
                onValueChange={(value) => setBillOptions(prev => ({ ...prev, sendEmail: value }))}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={billOptions.sendEmail ? '#fff' : '#f4f3f4'}
              />
            </View>

            {billOptions.sendEmail && (
              <View style={styles.formField}>
                <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border
                  }]}
                  value={billOptions.emailAddress}
                  onChangeText={(value) => setBillOptions(prev => ({ ...prev, emailAddress: value }))}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  placeholderTextColor={colors.text}
                />
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );

  const renderSummary = () => (
    <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
      <Text style={styles.summaryTitle}>Payment Summary</Text>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Amount:</Text>
        <Text style={styles.summaryValue}>${parseFloat(amount) || 0}</Text>
      </View>
      
      {parseFloat(discount) > 0 && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Discount:</Text>
          <Text style={styles.summaryValue}>-${parseFloat(discount)}</Text>
        </View>
      )}
      
      {parseFloat(fine) > 0 && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Fine:</Text>
          <Text style={styles.summaryValue}>+${parseFloat(fine)}</Text>
        </View>
      )}
      
      <View style={styles.summaryTotal}>
        <Text style={styles.summaryTotalLabel}>Total:</Text>
        <Text style={styles.summaryTotalValue}>${calculateTotal()}</Text>
      </View>
      
      {generateBill && billTemplate && (
        <View style={styles.billInfo}>
          <Text style={styles.billInfoText}>
            📄 Bill will be generated using: {billTemplate.name}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Enhanced Payment Form
        </Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Process payment with automated bill generation
        </Text>
      </View>

      {renderPaymentSection()}
      {renderBillSection()}
      {renderSummary()}

      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: colors.primary },
          (loading || generatingBill) && { opacity: 0.6 }
        ]}
        onPress={handleSubmitPayment}
        disabled={loading || generatingBill}
      >
        <Icon name="payment" size={20} color="white" />
        <Text style={styles.submitButtonText}>
          {loading ? 'Processing Payment...' : 
           generatingBill ? 'Generating Bill...' : 
           `Pay $${calculateTotal()}`}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  section: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  formField: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectContainer: {
    borderWidth: 1,
    borderRadius: 8,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectText: {
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  billOptions: {
    marginTop: 16,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionLabel: {
    fontSize: 14,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: 'white',
    opacity: 0.9,
  },
  summaryValue: {
    color: 'white',
    fontWeight: '600',
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  summaryTotalLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryTotalValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  billInfo: {
    marginTop: 12,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
  },
  billInfoText: {
    color: 'white',
    fontSize: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EnhancedPaymentForm; 
