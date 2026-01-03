import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import {
  Modal,
  Button,
  Input,
  Box,
  Text,
  VStack,
  HStack,
  Checkbox,
  Select,
  CheckIcon,
  Divider,
  useToast
} from 'native-base';

interface FeeItem {
  id: number;
  name: string;
  amount: number;
  description?: string;
  type: string;
}

interface PaymentFormProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (paymentData: any) => void;
  student: any;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  visible,
  onDismiss,
  onSubmit,
  student
}) => {
  const [selectedFeeItems, setSelectedFeeItems] = useState<FeeItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [remarks, setRemarks] = useState('');
  const [installmentPlan, setInstallmentPlan] = useState(false);
  const [numberOfInstallments, setNumberOfInstallments] = useState(1);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Mock fee items - in real app, fetch from API
  const availableFeeItems: FeeItem[] = [
    { id: 1, name: 'Tuition Fee', amount: 5000, type: 'TUITION_FEE', description: 'Monthly tuition fee' },
    { id: 2, name: 'Transport Fee', amount: 800, type: 'TRANSPORT_FEE', description: 'Monthly transport fee' },
    { id: 3, name: 'Library Fee', amount: 200, type: 'LIBRARY_FEE', description: 'Annual library membership' },
    { id: 4, name: 'Laboratory Fee', amount: 300, type: 'LABORATORY_FEE', description: 'Science lab fee' },
    { id: 5, name: 'Sports Fee', amount: 150, type: 'SPORTS_FEE', description: 'Sports facilities fee' },
    { id: 6, name: 'Exam Fee', amount: 400, type: 'EXAM_FEE', description: 'Examination fee' },
  ];

  const paymentMethods = [
    { value: 'CASH', label: 'Cash' },
    { value: 'CARD', label: 'Card' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'MOBILE_PAYMENT', label: 'Mobile Payment' },
    { value: 'CHECK', label: 'Check' },
  ];

  const calculateTotal = () => {
    const subtotal = selectedFeeItems.reduce((sum, item) => sum + item.amount, 0);
    return subtotal - discountAmount;
  };

  const handleFeeItemToggle = (item: FeeItem) => {
    setSelectedFeeItems(prev =>
      prev.find(i => i.id === item.id)
        ? prev.filter(i => i.id !== item.id)
        : [...prev, item]
    );
  };

  const handleSubmit = async () => {
    if (selectedFeeItems.length === 0) {
      toast.show({ description: 'Please select at least one fee item', status: 'warning' });
      return;
    }
    if (calculateTotal() <= 0) {
      toast.show({ description: 'Total amount must be greater than 0', status: 'warning' });
      return;
    }
    setLoading(true);
    try {
      const paymentData = {
        studentId: student.id,
        amount: selectedFeeItems.reduce((sum, item) => sum + item.amount, 0),
        discount: discountAmount,
        total: calculateTotal(),
        method: paymentMethod,
        remarks,
        paymentDate: new Date().toISOString(),
        status: 'PENDING',
        type: selectedFeeItems[0]?.type || 'TUITION_FEE',
        items: selectedFeeItems.map(item => ({
          feeItemId: item.id,
          amount: item.amount,
          discount: 0,
          fine: 0,
          total: item.amount,
          description: item.description
        })),
        installments: installmentPlan ? numberOfInstallments : undefined,
        discountReason: discountAmount > 0 ? discountReason : undefined
      };
      onSubmit(paymentData);
    } catch (error: any) {
      toast.show({ description: error.message || 'Failed to create payment', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={visible} onClose={onDismiss} size="xl">
      <Modal.Content maxWidth="400px">
        <Modal.CloseButton />
        <Modal.Header>Create Payment</Modal.Header>
        <Modal.Body>
          <ScrollView>
            {/* Student Info */}
            {student && (
              <Box bg="gray.100" p={3} borderRadius={8} mb={4}>
                <Text bold fontSize="md">{student.firstName} {student.lastName}</Text>
                <Text fontSize="sm" color="gray.500">ID: {student.studentId} | Class: {student.class?.name || 'N/A'}</Text>
              </Box>
            )}
            {/* Fee Items Selection */}
            <VStack space={2} mb={4}>
              <Text bold>Select Fee Items</Text>
              {availableFeeItems.map(item => (
                <Checkbox
                  key={item.id}
                  value={item.id.toString()}
                  isChecked={!!selectedFeeItems.find(i => i.id === item.id)}
                  onChange={() => handleFeeItemToggle(item)}
                  my={1}
                >
                  <HStack alignItems="center" space={2}>
                    <Text>{item.name} </Text>
                    <Text color="gray.500">${item.amount.toLocaleString()}</Text>
                    <Text color="gray.400" fontSize="xs">{item.type.replace('_', ' ')}</Text>
                  </HStack>
                </Checkbox>
              ))}
            </VStack>
            <Divider my={2} />
            {/* Payment Method */}
            <VStack mb={4}>
              <Text bold mb={1}>Payment Method</Text>
              <Select
                selectedValue={paymentMethod}
                minWidth="200"
                accessibilityLabel="Select method"
                placeholder="Select method"
                _selectedItem={{ bg: 'primary.100', endIcon: <CheckIcon size="5" /> }}
                mt={1}
                onValueChange={setPaymentMethod}
              >
                {paymentMethods.map(method => (
                  <Select.Item key={method.value} label={method.label} value={method.value} />
                ))}
              </Select>
            </VStack>
            <Divider my={2} />
            {/* Discount Section */}
            <VStack mb={4}>
              <Text bold mb={1}>Discount (Optional)</Text>
              <Input
                placeholder="Discount Amount"
                keyboardType="numeric"
                value={discountAmount ? discountAmount.toString() : ''}
                onChangeText={text => setDiscountAmount(Number(text) || 0)}
                mb={2}
              />
              {discountAmount > 0 && (
                <Input
                  placeholder="Discount Reason"
                  value={discountReason}
                  onChangeText={setDiscountReason}
                  mb={2}
                />
              )}
            </VStack>
            <Divider my={2} />vs
            {/* Installment Plan */}
            <VStack mb={4}>
              <Checkbox
                isChecked={installmentPlan}
                onChange={setInstallmentPlan}
                value="installment"
                mb={2}
              >
                Pay in Installments
              </Checkbox>
              {installmentPlan && (
                <Input
                  placeholder="Number of Installments"
                  keyboardType="numeric"
                  value={numberOfInstallments.toString()}
                  onChangeText={text => setNumberOfInstallments(Number(text) || 1)}
                  mb={2}
                />
              )}
            </VStack>
            <Divider my={2} />
            {/* Remarks */}
            <VStack mb={4}>
              <Text bold mb={1}>Remarks</Text>
              <Input
                placeholder="Remarks"
                value={remarks}
                onChangeText={setRemarks}
                multiline
                numberOfLines={3}
              />
            </VStack>
            {/* Summary */}
            <Box bg="gray.50" p={3} borderRadius={8} mt={2}>
              <Text bold mb={1}>Payment Summary</Text>
              <HStack justifyContent="space-between">
                <Text>Subtotal:</Text>
                <Text>${selectedFeeItems.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}</Text>
              </HStack>
              {discountAmount > 0 && (
                <HStack justifyContent="space-between">
                  <Text>Discount:</Text>
                  <Text color="green.600">-${discountAmount.toLocaleString()}</Text>
                </HStack>
              )}
              <Divider my={1} />
              <HStack justifyContent="space-between">
                <Text bold>Total:</Text>
                <Text bold color="primary.600">${calculateTotal().toLocaleString()}</Text>
              </HStack>
              {installmentPlan && numberOfInstallments > 1 && (
                <HStack justifyContent="space-between">
                  <Text>Per Installment:</Text>
                  <Text>${(calculateTotal() / numberOfInstallments).toLocaleString()}</Text>
                </HStack>
              )}
            </Box>
          </ScrollView>
        </Modal.Body>
        <Modal.Footer>
          <Button.Group space={2}>
            <Button variant="outline" onPress={onDismiss}>Cancel</Button>
            <Button
              onPress={handleSubmit}
              isLoading={loading}
              isDisabled={selectedFeeItems.length === 0 || calculateTotal() <= 0}
            >
              Create Payment
            </Button>
          </Button.Group>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
};

export default PaymentForm;

