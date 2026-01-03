import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Modal,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  Avatar,
  Divider,
  ScrollView,
  FormControl,
  Select,
  Input,
  Checkbox,
  Badge,
  Icon,
  useToast,
  useColorModeValue,
  Spinner,
  Center,
  AlertDialog,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import paymentService, { 
  PaymentData, 
  FeeStructure, 
  FeeItem 
} from '../services/paymentService';

// Enhanced Payment Item Interface for dynamic fees
interface DynamicPaymentItem {
  feeItemId: string;
  name: string;
  amount: number;
  discount: number;
  fine: number;
  total: number;
  isSelected: boolean;
  isOptional: boolean;
  dueDate?: string;
}

interface PaymentSlipProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  onPaymentSubmit: (paymentData: PaymentData) => Promise<void>;
}

// Payment Method Constants
const PAYMENT_METHOD = {
  CASH: 'CASH',
  CARD: 'CARD',
  BANK_TRANSFER: 'BANK_TRANSFER',
  MOBILE_PAYMENT: 'MOBILE_PAYMENT',
  CHECK: 'CHECK',
  SCHOLARSHIP: 'SCHOLARSHIP'
} as const;

const PaymentSlip: React.FC<PaymentSlipProps> = ({
  isOpen,
  onClose,
  student,
  onPaymentSubmit
}) => {
  // ========================================
  // STATE MANAGEMENT
  // ========================================
  
  const [loading, setLoading] = useState(false);
  const [feeStructuresLoading, setFeeStructuresLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [selectedFeeStructure, setSelectedFeeStructure] = useState<string>('');
  const [paymentItems, setPaymentItems] = useState<DynamicPaymentItem[]>([]);
  
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHOD.CASH);
  const [transactionId, setTransactionId] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [paymentType, setPaymentType] = useState<string>('TUITION_FEE');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringFrequency, setRecurringFrequency] = useState<string>('monthly');
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [paymentResponse, setPaymentResponse] = useState<any>(null);
  
  const toast = useToast();
  const cancelRef = useRef(null);
  const successRef = useRef(null);

  // ========================================
  // THEME COLORS
  // ========================================
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const primaryColor = useColorModeValue('blue.500', 'blue.300');
  const successColor = useColorModeValue('green.500', 'green.300');

  // ========================================
  // MONTH GENERATION
  // ========================================
  
  const availableMonths = useMemo(() => {
    const months = [];
    const now = new Date();
    
    // Past 6 months
    for (let i = 6; i >= 1; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy'),
        isPast: true,
        isCurrent: false
      });
    }
    
    // Current month
    months.push({
      value: format(now, 'yyyy-MM'),
      label: `${format(now, 'MMMM yyyy')} (Current)`,
      isPast: false,
      isCurrent: true
    });
    
    // Future 12 months
    for (let i = 1; i <= 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy'),
        isPast: false,
        isCurrent: false
      });
    }
    
    return months;
  }, []);

  // ========================================
  // DYNAMIC CALCULATIONS
  // ========================================
  
  const calculations = useMemo(() => {
    const selectedItems = paymentItems.filter(item => item.isSelected);
    const subtotal = selectedItems.reduce((sum, item) => sum + item.amount, 0);
    const totalDiscount = selectedItems.reduce((sum, item) => sum + item.discount, 0);
    const totalFine = selectedItems.reduce((sum, item) => sum + item.fine, 0);
    const total = subtotal - totalDiscount + totalFine;

    return {
      subtotal,
      totalDiscount,
      totalFine,
      total,
      itemCount: selectedItems.length,
      selectedItems
    };
  }, [paymentItems]);

  // ========================================
  // API INTEGRATION EFFECTS
  // ========================================
  
  // Load fee structures when modal opens
  useEffect(() => {
    if (isOpen && student) {
      loadFeeStructures();
      setSelectedMonth(format(new Date(), 'yyyy-MM')); // Default to current month
    }
  }, [isOpen, student]);

  // Load fee items when fee structure is selected
  useEffect(() => {
    if (selectedFeeStructure) {
      loadFeeItems(selectedFeeStructure);
    }
  }, [selectedFeeStructure]);

  // ========================================
  // API METHODS
  // ========================================
  
  const loadFeeStructures = async () => {
    setFeeStructuresLoading(true);
    try {

      // Try to get fee structures for student's class
      const classId = student?.classId || student?.class?.id;
      const params = classId ? { classId: classId.toString() } : {};
      
      const response = await paymentService.getFeeStructures(params);
      const structures = response.data || response || [];

      setFeeStructures(structures);
      
      // Auto-select default fee structure
      const defaultStructure = structures.find((fs: FeeStructure) => fs.isDefault);
      if (defaultStructure) {
        setSelectedFeeStructure(defaultStructure.id);
      } else if (structures.length > 0) {
        setSelectedFeeStructure(structures[0].id);
      }
      
    } catch (error) {

      // Ultimate fallback: Create default fee structure
      const defaultStructure: FeeStructure = {
        id: 'default-fees',
        uuid: 'default-fees-uuid',
        name: 'Default School Fees',
        description: 'Default fee structure when API is unavailable',
        isDefault: true,
        items: [
          { id: '1', uuid: '1-uuid', feeStructureId: 'default-fees', name: 'Tuition Fee', amount: 1500, isOptional: false },
          { id: '2', uuid: '2-uuid', feeStructureId: 'default-fees', name: 'Library Fee', amount: 100, isOptional: true },
          { id: '3', uuid: '3-uuid', feeStructureId: 'default-fees', name: 'Lab Fee', amount: 200, isOptional: true },
          { id: '4', uuid: '4-uuid', feeStructureId: 'default-fees', name: 'Transport Fee', amount: 300, isOptional: true },
          { id: '5', uuid: '5-uuid', feeStructureId: 'default-fees', name: 'Sports Fee', amount: 150, isOptional: true }
        ]
      };
      
      setFeeStructures([defaultStructure]);
      setSelectedFeeStructure('default-fees');

      toast.show({
        title: 'Fee Loading',
        description: 'Using default fees. Some features may be limited.',
        duration: 3000
      });
    } finally {
      setFeeStructuresLoading(false);
    }
  };

  const loadFeeItems = async (feeStructureId: string) => {
    setLoading(true);
    try {

      // Find the selected fee structure
      const selectedStructure = feeStructures.find(fs => fs.id === feeStructureId);
      if (!selectedStructure) {
        throw new Error('Fee structure not found');
      }

      let feeItems: FeeItem[] = [];

      // If items are already loaded in the structure, use them
      if (selectedStructure.items && selectedStructure.items.length > 0) {
        feeItems = selectedStructure.items;

      } else {
        // Otherwise, fetch from API
        try {
          const response = await paymentService.getFeeItems(feeStructureId);
          feeItems = response.data || response || [];

        } catch (apiError) {
          console.warn('⚠️ API call failed, using structure items:', apiError);
          feeItems = selectedStructure.items || [];
        }
      }

      // Convert to dynamic payment items
      const dynamicItems: DynamicPaymentItem[] = feeItems.map(item => ({
        feeItemId: item.id,
        name: item.name,
        amount: item.amount,
        discount: 0,
        fine: 0,
        total: item.amount,
        isSelected: !item.isOptional, // Auto-select required fees
        isOptional: item.isOptional,
        dueDate: item.dueDate
      }));

      setPaymentItems(dynamicItems);

    } catch (error) {
      
      toast.show({
        title: 'Error',
        description: 'Failed to load fee items',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // EVENT HANDLERS
  // ========================================
  
  const generateReceiptNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const time = date.getTime().toString().slice(-6);
    const studentId = student?.id || student?.studentId || Math.floor(Math.random() * 1000);
    return `RCP-${studentId}-${year}${month}${day}${time}`;
  };

  const handleItemSelection = (feeItemId: string, isSelected: boolean) => {
    setPaymentItems(items =>
      items.map(item =>
        item.feeItemId === feeItemId ? { ...item, isSelected } : item
      )
    );
  };

  const handleItemAmountChange = (feeItemId: string, field: 'amount' | 'discount' | 'fine', value: number) => {
    setPaymentItems(items =>
      items.map(item => {
        if (item.feeItemId === feeItemId) {
          const updated = { ...item, [field]: value };
          updated.total = updated.amount - updated.discount + updated.fine;
          return updated;
        }
        return item;
      })
    );
  };

  const handleSubmitPayment = async () => {
    if (calculations.itemCount === 0) {
      toast.show({
        title: 'No Items Selected',
        description: 'Please select at least one fee item to proceed',
        duration: 3000
      });
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmPaymentSubmission = async () => {
    setSubmitting(true);
    setShowConfirmDialog(false);
    
    try {

      // Prepare payment data according to backend schema
      const paymentData: PaymentData = {
        studentId: student?.id || student?.studentId ? parseInt(student.id || student.studentId) : undefined,
        parentId: student?.parentId ? parseInt(student.parentId) : undefined,
        feeStructureId: selectedFeeStructure,
        amount: calculations.subtotal,
        discount: calculations.totalDiscount,
        fine: calculations.totalFine,
        total: calculations.total,
        paymentDate: new Date().toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        status: 'PAID',
        method: paymentMethod as any,
        type: paymentType,
        transactionId: transactionId || undefined,
        remarks: remarks || `Payment for ${selectedMonth}`,
        metadata: {
          paymentSource: "frontend",
          userAgent: navigator?.userAgent || "Unknown",
          ipAddress: "Unknown", // Would need to be fetched from backend
          sessionId: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          paymentNotes: remarks || `Student payment for ${selectedMonth}`,
          additionalInfo: {
            discountReason: calculations.totalDiscount > 0 ? "Applied discount" : undefined,
            paymentChannel: paymentMethod.replace('_', ' '),
            processedBy: "System"
          },
          customFields: {
            department: student?.department || student?.class?.department || "Unknown",
            semester: selectedMonth,
            paymentCategory: "Regular",
            studentClass: student?.className || student?.class?.name || student?.grade || "Unknown"
          }
        },
        isRecurring: isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : undefined,
        nextPaymentDate: isRecurring && recurringFrequency === 'monthly' 
          ? new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
          : undefined,
        items: calculations.selectedItems.map(item => ({
          feeItemId: item.feeItemId,
          amount: item.amount,
          discount: item.discount,
          fine: item.fine,
          total: item.total
        }))
      };

      // Validate payment data
      const validation = paymentService.validatePaymentData(paymentData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Submit payment to backend
      const response = await paymentService.createPayment(paymentData);

      setPaymentResponse(response);
      
      // Call parent callback
      if (onPaymentSubmit) {
        await onPaymentSubmit(paymentData);
      }
      
      toast.show({
        title: 'Payment Successful!',
        description: `Receipt #${response.data?.receiptNumber || 'Generated'}`,
        duration: 5000
      });
      
      // Reset form after successful payment
      handleReset();
      
    } catch (error: any) {

      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Payment submission failed. Please try again.';
      
      toast.show({
        title: 'Payment Failed',
        description: errorMessage,
        duration: 5000
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setPaymentItems(items => 
      items.map(item => ({
        ...item,
        isSelected: !item.isOptional,
        discount: 0,
        fine: 0,
        total: item.amount
      }))
    );
    setTransactionId('');
    setRemarks('');
    setDueDate('');
    setPaymentType('TUITION_FEE');
    setIsRecurring(false);
    setRecurringFrequency('monthly');
    setShowAdvanced(false);
  };

  const handleClose = () => {
    handleReset();
    setPaymentResponse(null);
    onClose();
  };

  // ========================================
  // RENDER METHODS
  // ========================================

  // Loading state
  if (feeStructuresLoading) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} size="full">
        <Modal.Content maxWidth="95%" maxHeight="95%">
          <Modal.CloseButton />
          <Modal.Header bg={primaryColor} _text={{ color: 'white' }}>
            <HStack space={3} alignItems="center">
              <Icon as={MaterialIcons} name="payment" size="md" color="white" />
              <Text fontSize="lg" fontWeight="bold" color="white">
                Payment Slip - {student?.firstName || student?.user?.firstName || 'Unknown'} {student?.lastName || student?.user?.lastName || 'Student'}
              </Text>
            </HStack>
          </Modal.Header>
          <Modal.Body bg={bgColor} flex={1}>
            <Center flex={1}>
              <VStack space={4} alignItems="center">
                <Spinner size="lg" color={primaryColor} />
                <Text color={textColor} fontSize="lg">Loading Fee Structures...</Text>
                <Text color={mutedColor} fontSize="sm" textAlign="center">
                  Fetching available fees from the backend
                </Text>
              </VStack>
            </Center>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="full">
      <Modal.Content maxWidth="95%" maxHeight="95%">
        <Modal.CloseButton />
        <Modal.Header bg={primaryColor} _text={{ color: 'white' }}>
          <HStack space={3} alignItems="center">
            <Icon as={MaterialIcons} name="payment" size="md" color="white" />
            <Text fontSize="lg" fontWeight="bold" color="white">
              Payment Slip - {student?.firstName || student?.user?.firstName || 'Unknown'} {student?.lastName || student?.user?.lastName || 'Student'}
            </Text>
          </HStack>
        </Modal.Header>

        <Modal.Body bg={bgColor} p={0}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <VStack space={6} p={4}>
              
              {/* Payment Slip Header */}
              <Card bg={cardBg} p={4} borderRadius="xl" shadow={3}>
                <VStack space={4}>
                  <HStack justifyContent="space-between" alignItems="center">
                    <HStack space={3} alignItems="center">
                      <Avatar 
                        bg="blue.500" 
                        size="md"
                        source={student?.avatar ? { uri: student.avatar } : undefined}
                      >
                        {(student?.firstName || student?.user?.firstName)?.charAt(0)}{(student?.lastName || student?.user?.lastName)?.charAt(0)}
                      </Avatar>
                      <VStack>
                        <Text fontSize="lg" fontWeight="bold" color={textColor}>
                          {student?.firstName || student?.user?.firstName || 'Unknown'} {student?.lastName || student?.user?.lastName || 'Student'}
                        </Text>
                        <Text fontSize="sm" color={mutedColor}>
                          ID: {student?.admissionNo || student?.studentId || 'N/A'} | Class: {student?.className || student?.class?.name || student?.grade || 'N/A'}
                        </Text>
                      </VStack>
                    </HStack>
                    <VStack alignItems="flex-end">
                      <Text fontSize="xs" color={mutedColor}>Receipt #</Text>
                      <Text fontSize="sm" fontWeight="bold" color={textColor}>
                        {generateReceiptNumber()}
                      </Text>
                      <Text fontSize="xs" color={mutedColor}>
                        {format(new Date(), 'dd MMM yyyy, HH:mm')}
                      </Text>
                    </VStack>
                  </HStack>

                  <Divider />

                  {/* School & Parent Info */}
                  <HStack justifyContent="space-between">
                    <VStack flex={1}>
                      <Text fontSize="xs" color={mutedColor} fontWeight="bold">SCHOOL</Text>
                      <Text fontSize="sm" color={textColor}>
                        {student?.schoolName || student?.school?.name || 'Unknown School'}
                      </Text>
                      <Text fontSize="xs" color={mutedColor}>
                        {student?.schoolCode || student?.school?.code || 'N/A'}
                      </Text>
                    </VStack>
                    <VStack flex={1} alignItems="flex-end">
                      <Text fontSize="xs" color={mutedColor} fontWeight="bold">PARENT/GUARDIAN</Text>
                      <Text fontSize="sm" color={textColor}>
                        {student?.parentName || student?.parent?.firstName || student?.parent?.name || 
                         (student?.parent ? `${student.parent.firstName || ''} ${student.parent.lastName || ''}`.trim() : 'No Parent Info')}
                      </Text>
                      <Text fontSize="xs" color={mutedColor}>
                        {student?.parentEmail || student?.parent?.email || student?.parent?.user?.email || 'No parent email'}
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>
              </Card>

              {/* Fee Structure Selection */}
              {feeStructures.length > 1 && (
                <Card bg={cardBg} p={4} borderRadius="xl" shadow={2}>
                  <VStack space={4}>
                    <HStack space={3} alignItems="center">
                      <Icon as={MaterialIcons} name="account-balance" color={primaryColor} />
                      <Text fontSize="md" fontWeight="bold" color={textColor}>Fee Structure</Text>
                    </HStack>
                    
                    <FormControl>
                      <Text fontSize="sm" color={mutedColor} mb={1}>Select Fee Structure</Text>
                      <Select
                        selectedValue={selectedFeeStructure}
                        onValueChange={setSelectedFeeStructure}
                        bg="white"
                        borderColor={borderColor}
                        _selectedItem={{
                          bg: primaryColor,
                          endIcon: <Icon as={MaterialIcons} name="check" size="xs" />
                        }}
                      >
                        {feeStructures.map(structure => (
                          <Select.Item
                            key={structure.id}
                            label={`${structure.name}${structure.isDefault ? ' (Default)' : ''}`}
                            value={structure.id}
                          />
                        ))}
                      </Select>
                    </FormControl>
                  </VStack>
                </Card>
              )}

              {/* Payment Configuration */}
              <Card bg={cardBg} p={4} borderRadius="xl" shadow={2}>
                <VStack space={4}>
                  <HStack space={3} alignItems="center">
                    <Icon as={MaterialIcons} name="settings" color={primaryColor} />
                    <Text fontSize="md" fontWeight="bold" color={textColor}>Payment Configuration</Text>
                  </HStack>

                  <HStack space={4}>
                    {/* Month Selection */}
                    <FormControl flex={1}>
                      <Text fontSize="sm" color={mutedColor} mb={1}>Payment Month</Text>
                      <Select
                        selectedValue={selectedMonth}
                        onValueChange={setSelectedMonth}
                        bg="white"
                        borderColor={borderColor}
                        _selectedItem={{
                          bg: primaryColor,
                          endIcon: <Icon as={MaterialIcons} name="check" size="xs" />
                        }}
                      >
                        {availableMonths.map(month => (
                          <Select.Item
                            key={month.value}
                            label={month.label}
                            value={month.value}
                            _text={{
                              color: month.isPast ? 'red.500' : month.isCurrent ? 'green.500' : textColor
                            }}
                          />
                        ))}
                      </Select>
                    </FormControl>

                    {/* Payment Method */}
                    <FormControl flex={1}>
                      <Text fontSize="sm" color={mutedColor} mb={1}>Payment Method</Text>
                      <Select
                        selectedValue={paymentMethod}
                        onValueChange={setPaymentMethod}
                        bg="white"
                        borderColor={borderColor}
                        _selectedItem={{
                          bg: primaryColor,
                          endIcon: <Icon as={MaterialIcons} name="check" size="xs" />
                        }}
                      >
                        <Select.Item label="💰 Cash" value={PAYMENT_METHOD.CASH} />
                        <Select.Item label="💳 Card" value={PAYMENT_METHOD.CARD} />
                        <Select.Item label="🏦 Bank Transfer" value={PAYMENT_METHOD.BANK_TRANSFER} />
                        <Select.Item label="📱 Mobile Payment" value={PAYMENT_METHOD.MOBILE_PAYMENT} />
                        <Select.Item label="📋 Check" value={PAYMENT_METHOD.CHECK} />
                        <Select.Item label="🎓 Scholarship" value={PAYMENT_METHOD.SCHOLARSHIP} />
                      </Select>
                    </FormControl>
                  </HStack>

                  {/* Transaction ID (for digital payments) */}
                  {(paymentMethod === PAYMENT_METHOD.CARD || 
                    paymentMethod === PAYMENT_METHOD.BANK_TRANSFER || 
                    paymentMethod === PAYMENT_METHOD.MOBILE_PAYMENT) && (
                    <FormControl>
                      <Text fontSize="sm" color={mutedColor} mb={1}>Transaction ID</Text>
                      <Input
                        value={transactionId}
                        onChangeText={setTransactionId}
                        placeholder="Enter transaction reference ID"
                        bg="white"
                        borderColor={borderColor}
                      />
                    </FormControl>
                  )}
                </VStack>
              </Card>

              {/* Dynamic Fee Items Selection */}
              {loading ? (
                <Card bg={cardBg} p={4} borderRadius="xl" shadow={2}>
                  <Center py={8}>
                    <VStack space={3} alignItems="center">
                      <Spinner size="md" color={primaryColor} />
                      <Text color={textColor}>Loading Fee Items...</Text>
                    </VStack>
                  </Center>
                </Card>
              ) : (
                <Card bg={cardBg} p={4} borderRadius="xl" shadow={2}>
                  <VStack space={4}>
                    <HStack justifyContent="space-between" alignItems="center">
                      <HStack space={3} alignItems="center">
                        <Icon as={MaterialIcons} name="receipt-long" color={primaryColor} />
                        <Text fontSize="md" fontWeight="bold" color={textColor}>Select Fee Items</Text>
                      </HStack>
                      <Badge colorScheme="blue" variant="subtle">
                        {calculations.itemCount} selected
                      </Badge>
                    </HStack>

                    <VStack space={3}>
                      {paymentItems.map((item) => (
                        <HStack
                          key={item.feeItemId}
                          space={3}
                          alignItems="center"
                          bg="white"
                          p={3}
                          borderRadius="lg"
                          borderWidth={item.isSelected ? 2 : 1}
                          borderColor={item.isSelected ? primaryColor : borderColor}
                          shadow={item.isSelected ? 2 : 1}
                        >
                          <Checkbox
                            value={item.feeItemId}
                            isChecked={item.isSelected}
                            onChange={(isSelected) => handleItemSelection(item.feeItemId, isSelected)}
                            colorScheme="blue"
                          />
                          
                          <VStack flex={1}>
                            <HStack justifyContent="space-between" alignItems="center">
                              <Text fontSize="sm" fontWeight="bold" color={textColor}>
                                {item.name}
                                {!item.isOptional && (
                                  <Text fontSize="xs" color="red.500"> *required</Text>
                                )}
                              </Text>
                              <Text fontSize="lg" fontWeight="bold" color={item.isSelected ? successColor : mutedColor}>
                                ${item.total.toFixed(2)}
                              </Text>
                            </HStack>
                            <Text fontSize="xs" color={mutedColor}>
                              Base Amount: ${item.amount}
                              {item.dueDate && ` • Due: ${format(new Date(item.dueDate), 'MMM dd, yyyy')}`}
                            </Text>
                            
                            {/* Advanced Item Controls */}
                            {showAdvanced && item.isSelected && (
                              <HStack space={2} mt={2}>
                                <FormControl flex={1}>
                                  <Input
                                    size="xs"
                                    placeholder="Discount"
                                    value={item.discount.toString()}
                                    onChangeText={(text) => handleItemAmountChange(item.feeItemId, 'discount', parseFloat(text) || 0)}
                                    keyboardType="numeric"
                                  />
                                </FormControl>
                                <FormControl flex={1}>
                                  <Input
                                    size="xs"
                                    placeholder="Fine"
                                    value={item.fine.toString()}
                                    onChangeText={(text) => handleItemAmountChange(item.feeItemId, 'fine', parseFloat(text) || 0)}
                                    keyboardType="numeric"
                                  />
                                </FormControl>
                              </HStack>
                            )}
                          </VStack>
                        </HStack>
                      ))}
                    </VStack>

                    {/* Toggle Advanced Options */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => setShowAdvanced(!showAdvanced)}
                      leftIcon={<Icon as={MaterialIcons} name={showAdvanced ? "expand_less" : "expand_more"} />}
                    >
                      {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                    </Button>
                  </VStack>
                </Card>
              )}

              {/* Advanced Options */}
              {showAdvanced && (
                <Card bg={cardBg} p={4} borderRadius="xl" shadow={2}>
                  <VStack space={4}>
                    <HStack space={3} alignItems="center">
                      <Icon as={MaterialIcons} name="tune" color={primaryColor} />
                      <Text fontSize="md" fontWeight="bold" color={textColor}>Additional Options</Text>
                    </HStack>

                    <HStack space={4}>
                      <FormControl flex={1}>
                        <Text fontSize="sm" color={mutedColor} mb={1}>Payment Type</Text>
                        <Select
                          selectedValue={paymentType}
                          onValueChange={setPaymentType}
                          bg="white"
                          borderColor={borderColor}
                          _selectedItem={{
                            bg: primaryColor,
                            endIcon: <Icon as={MaterialIcons} name="check" size="xs" />
                          }}
                        >
                          <Select.Item label="Tuition Fee" value="TUITION_FEE" />
                          <Select.Item label="Library Fee" value="LIBRARY_FEE" />
                          <Select.Item label="Laboratory Fee" value="LABORATORY_FEE" />
                          <Select.Item label="Transport Fee" value="TRANSPORT_FEE" />
                          <Select.Item label="Sports Fee" value="SPORTS_FEE" />
                          <Select.Item label="Exam Fee" value="EXAM_FEE" />
                          <Select.Item label="Uniform Fee" value="UNIFORM_FEE" />
                          <Select.Item label="Meal Fee" value="MEAL_FEE" />
                          <Select.Item label="Hostel Fee" value="HOSTEL_FEE" />
                          <Select.Item label="Other Fee" value="OTHER" />
                        </Select>
                      </FormControl>
                      
                      <FormControl flex={1}>
                        <Text fontSize="sm" color={mutedColor} mb={1}>Due Date (Optional)</Text>
                        <Input
                          value={dueDate}
                          onChangeText={setDueDate}
                          placeholder="YYYY-MM-DD"
                          bg="white"
                          borderColor={borderColor}
                        />
                      </FormControl>
                    </HStack>

                    {/* Recurring Payment Options */}
                    <VStack space={3}>
                      <Checkbox
                        value="recurring"
                        isChecked={isRecurring}
                        onChange={setIsRecurring}
                        colorScheme="blue"
                      >
                        <Text fontSize="sm" color={textColor}>Set up recurring payment</Text>
                      </Checkbox>
                      
                      {isRecurring && (
                        <FormControl>
                          <Text fontSize="sm" color={mutedColor} mb={1}>Recurring Frequency</Text>
                          <Select
                            selectedValue={recurringFrequency}
                            onValueChange={setRecurringFrequency}
                            bg="white"
                            borderColor={borderColor}
                            _selectedItem={{
                              bg: primaryColor,
                              endIcon: <Icon as={MaterialIcons} name="check" size="xs" />
                            }}
                          >
                            <Select.Item label="Monthly" value="monthly" />
                            <Select.Item label="Quarterly" value="quarterly" />
                            <Select.Item label="Yearly" value="yearly" />
                          </Select>
                        </FormControl>
                      )}
                    </VStack>

                    <FormControl>
                      <Text fontSize="sm" color={mutedColor} mb={1}>Remarks</Text>
                      <Input
                        value={remarks}
                        onChangeText={setRemarks}
                        placeholder="Additional notes or remarks"
                        bg="white"
                        borderColor={borderColor}
                        multiline
                        numberOfLines={3}
                      />
                    </FormControl>
                  </VStack>
                </Card>
              )}

              {/* Payment Summary */}
              <Card bg={successColor} borderRadius="xl" shadow={3}>
                <VStack space={4} p={4}>
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="lg" fontWeight="bold" color="white">Payment Summary</Text>
                    <Icon as={MaterialIcons} name="receipt" color="white" size="md" />
                  </HStack>

                  <VStack space={2}>
                    <HStack justifyContent="space-between">
                      <Text color="white" opacity={0.9}>Subtotal ({calculations.itemCount} items)</Text>
                      <Text color="white" fontWeight="bold">${calculations.subtotal.toFixed(2)}</Text>
                    </HStack>
                    
                    {calculations.totalDiscount > 0 && (
                      <HStack justifyContent="space-between">
                        <Text color="white" opacity={0.9}>Discount</Text>
                        <Text color="white" fontWeight="bold">-${calculations.totalDiscount.toFixed(2)}</Text>
                      </HStack>
                    )}
                    
                    {calculations.totalFine > 0 && (
                      <HStack justifyContent="space-between">
                        <Text color="white" opacity={0.9}>Fine</Text>
                        <Text color="white" fontWeight="bold">+${calculations.totalFine.toFixed(2)}</Text>
                      </HStack>
                    )}
                    
                    <Divider bg="white" opacity={0.3} />
                    
                    <HStack justifyContent="space-between">
                      <Text fontSize="lg" color="white" fontWeight="bold">Total</Text>
                      <Text fontSize="xl" color="white" fontWeight="bold">${calculations.total.toFixed(2)}</Text>
                    </HStack>
                  </VStack>
                </VStack>
              </Card>
            </VStack>
          </ScrollView>
          </Modal.Body>

          {/* Footer with Action Buttons */}
          <Modal.Footer bg={cardBg} borderTopColor={borderColor}>
            <HStack space={3} flex={1}>
              <Button
                flex={1}
                variant="outline"
                onPress={handleReset}
                leftIcon={<Icon as={MaterialIcons} name="refresh" />}
                isDisabled={submitting}
              >
                Reset
              </Button>
              
              <Button
                flex={2}
                bg={primaryColor}
                onPress={handleSubmitPayment}
                leftIcon={<Icon as={MaterialIcons} name="payment" />}
                isLoading={submitting}
                isDisabled={calculations.itemCount === 0 || submitting}
                _pressed={{ bg: useColorModeValue('blue.600', 'blue.400') }}
              >
                {submitting ? 'Processing...' : `Pay $${calculations.total.toFixed(2)}`}
              </Button>
            </HStack>
          </Modal.Footer>
        </Modal.Content>

        {/* Payment Confirmation Dialog */}
        <AlertDialog isOpen={showConfirmDialog} onClose={() => setShowConfirmDialog(false)} leastDestructiveRef={cancelRef}>
          <AlertDialog.Content>
            <AlertDialog.CloseButton />
            <AlertDialog.Header>Confirm Payment</AlertDialog.Header>
            <AlertDialog.Body>
              <VStack space={3}>
                <Text>
                  Are you sure you want to process this payment?
                </Text>
                
                <Card bg={useColorModeValue('blue.50', 'blue.900')} p={3}>
                  <VStack space={2}>
                    <HStack justifyContent="space-between">
                      <Text fontWeight="bold">Student:</Text>
                      <Text>{student?.firstName || 'Unknown'} {student?.lastName || 'Student'}</Text>
                    </HStack>
                    <HStack justifyContent="space-between">
                      <Text fontWeight="bold">Amount:</Text>
                      <Text fontWeight="bold" color={successColor}>${calculations.total.toFixed(2)}</Text>
                    </HStack>
                    <HStack justifyContent="space-between">
                      <Text fontWeight="bold">Method:</Text>
                      <Text>{paymentMethod.replace('_', ' ')}</Text>
                    </HStack>
                    <HStack justifyContent="space-between">
                      <Text fontWeight="bold">Items:</Text>
                      <Text>{calculations.itemCount} fee(s)</Text>
                    </HStack>
                  </VStack>
                </Card>
              </VStack>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button.Group space={2}>
                <Button 
                  ref={cancelRef}
                  variant="unstyled" 
                  colorScheme="coolGray" 
                  onPress={() => setShowConfirmDialog(false)}
                  isDisabled={submitting}
                >
                  Cancel
                </Button>
                <Button 
                  colorScheme="blue" 
                  onPress={confirmPaymentSubmission}
                  isLoading={submitting}
                  leftIcon={<Icon as={MaterialIcons} name="check" />}
                >
                  Confirm Payment
                </Button>
              </Button.Group>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog>

        {/* Success Receipt Display */}
        {paymentResponse && (
          <AlertDialog isOpen={!!paymentResponse} onClose={() => setPaymentResponse(null)} leastDestructiveRef={successRef}>
            <AlertDialog.Content maxW="400px">
              <AlertDialog.Header bg={successColor} _text={{ color: 'white' }}>
                <HStack space={2} alignItems="center">
                  <Icon as={MaterialIcons} name="check-circle" color="white" />
                  <Text color="white" fontWeight="bold">Payment Successful!</Text>
                </HStack>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <VStack space={3}>
                  <Text textAlign="center" fontSize="md">
                    Your payment has been processed successfully.
                  </Text>
                  
                  <Card bg={useColorModeValue('green.50', 'green.900')} p={3}>
                    <VStack space={2}>
                      <HStack justifyContent="space-between">
                        <Text fontWeight="bold">Receipt #:</Text>
                        <Text fontWeight="bold" color={successColor}>
                          {paymentResponse.data?.receiptNumber || 'Generated'}
                        </Text>
                      </HStack>
                      <HStack justifyContent="space-between">
                        <Text fontWeight="bold">Amount Paid:</Text>
                        <Text fontWeight="bold" color={successColor}>
                          ${paymentResponse.data?.total?.toFixed(2) || calculations.total.toFixed(2)}
                        </Text>
                      </HStack>
                      <HStack justifyContent="space-between">
                        <Text fontWeight="bold">Date:</Text>
                        <Text>{format(new Date(), 'MMM dd, yyyy HH:mm')}</Text>
                      </HStack>
                      <HStack justifyContent="space-between">
                        <Text fontWeight="bold">Method:</Text>
                        <Text>{paymentMethod.replace('_', ' ')}</Text>
                      </HStack>
                    </VStack>
                  </Card>
                  
                  <Text fontSize="sm" color={mutedColor} textAlign="center">
                    A receipt has been generated. You can print or download it from the payments section.
                  </Text>
                </VStack>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button.Group space={2}>
                  <Button 
                    variant="outline" 
                    onPress={() => {
                      // TODO: Generate and download receipt
                      toast.show({
                        title: 'Feature Coming Soon',
                        description: 'Receipt download will be available soon'
                      });
                    }}
                    leftIcon={<Icon as={MaterialIcons} name="download" />}
                  >
                    Download Receipt
                  </Button>
                  <Button 
                    colorScheme="green" 
                    onPress={() => {
                      setPaymentResponse(null);
                      handleClose();
                    }}
                    leftIcon={<Icon as={MaterialIcons} name="check" />}
                  >
                    Done
                  </Button>
                </Button.Group>
              </AlertDialog.Footer>
            </AlertDialog.Content>
          </AlertDialog>
        )}
      </Modal>
    );
};

export default PaymentSlip; 
