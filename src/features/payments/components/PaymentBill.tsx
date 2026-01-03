import React from 'react';
import { ScrollView } from 'react-native';
import {
  Modal,
  Button,
  Box,
  Text,
  VStack,
  HStack,
  Divider,
  Badge,
  useToast
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';

interface PaymentBillProps {
  visible: boolean;
  onDismiss: () => void;
  payment: any;
  onDiscountRequest?: () => void;
}

const PaymentBill: React.FC<PaymentBillProps> = ({
  visible,
  onDismiss,
  payment,
  onDiscountRequest
}) => {
  const toast = useToast();
  if (!payment) return null;
  const { student, items = [], total, discount, status, receiptNumber, paymentDate, method } = payment;

  const canRequestDiscount = status === 'PENDING' || status === 'PARTIALLY_PAID';

  return (
    <Modal isOpen={visible} onClose={onDismiss} size="xl">
      <Modal.Content maxWidth="420px">
        <Modal.CloseButton />
        <Modal.Header>Payment Bill</Modal.Header>
        <Modal.Body>
          <ScrollView>
            {/* Student Info */}
            <Box bg="gray.100" p={3} borderRadius={8} mb={4}>
              <Text bold fontSize="md">{student?.firstName} {student?.lastName}</Text>
              <Text fontSize="sm" color="gray.500">ID: {student?.studentId} | Class: {student?.class?.name || 'N/A'}</Text>
            </Box>
            {/* Bill Info */}
            <VStack space={2} mb={4}>
              <HStack justifyContent="space-between">
                <Text>Receipt #:</Text>
                <Text>{receiptNumber || '-'}</Text>
              </HStack>
              <HStack justifyContent="space-between">
                <Text>Date:</Text>
                <Text>{paymentDate ? new Date(paymentDate).toLocaleDateString() : '-'}</Text>
              </HStack>
              <HStack justifyContent="space-between">
                <Text>Method:</Text>
                <Text>{method}</Text>
              </HStack>
              <HStack justifyContent="space-between">
                <Text>Status:</Text>
                <Badge colorScheme={status === 'PAID' ? 'success' : status === 'PENDING' ? 'warning' : 'danger'}>{status}</Badge>
              </HStack>
            </VStack>
            <Divider my={2} />
            {/* Fee Items */}
            <VStack mb={4}>
              <Text bold mb={2}>Fee Breakdown</Text>
              {items.map((item: any) => (
                <HStack key={item.feeItemId || item.id} justifyContent="space-between" mb={1}>
                  <Text>{item.feeItem?.name || item.description || 'Fee'}</Text>
                  <Text>${item.amount.toLocaleString()}</Text>
                </HStack>
              ))}
            </VStack>
            <Divider my={2} />
            {/* Summary */}
            <VStack space={1}>
              <HStack justifyContent="space-between">
                <Text>Subtotal:</Text>
                <Text>${items.reduce((sum: number, item: any) => sum + item.amount, 0).toLocaleString()}</Text>
              </HStack>
              {discount > 0 && (
                <HStack justifyContent="space-between">
                  <Text>Discount:</Text>
                  <Text color="green.600">-${discount.toLocaleString()}</Text>
                </HStack>
              )}
              <Divider my={1} />
              <HStack justifyContent="space-between">
                <Text bold>Total:</Text>
                <Text bold color="primary.600">${total.toLocaleString()}</Text>
              </HStack>
            </VStack>
          </ScrollView>
        </Modal.Body>
        <Modal.Footer>
          <Button.Group space={2}>
            {canRequestDiscount && onDiscountRequest && (
              <Button variant="outline" colorScheme="warning" onPress={onDiscountRequest} leftIcon={<MaterialIcons name="request-quote" size={18} color="#f59e42" />}>Request Discount</Button>
            )}
            <Button variant="outline" onPress={() => toast.show({ description: 'Print/Download not implemented', status: 'info' })} leftIcon={<MaterialIcons name="print" size={18} color="#4f46e5" />}>Print/Download</Button>
            <Button onPress={onDismiss}>Close</Button>
          </Button.Group>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
};

export default PaymentBill; 
