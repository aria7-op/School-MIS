import React, { useState } from 'react';
import {
  Modal,
  Button,
  Input,
  Box,
  Text,
  VStack,
  HStack,
  Divider,
  useToast
} from 'native-base';

interface DiscountRequestFormProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: { amount: number; reason: string }) => void;
  payment: any;
}

const DiscountRequestForm: React.FC<DiscountRequestFormProps> = ({
  visible,
  onDismiss,
  onSubmit,
  payment
}) => {
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  if (!payment) return null;

  const handleSubmit = async () => {
    if (!amount || amount <= 0) {
      toast.show({ description: 'Enter a valid discount amount', status: 'warning' });
      return;
    }
    if (!reason) {
      toast.show({ description: 'Enter a reason for the discount', status: 'warning' });
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ amount, reason });
    } catch (e: any) {
      toast.show({ description: e.message || 'Failed to request discount', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={visible} onClose={onDismiss} size="md">
      <Modal.Content maxWidth="350px">
        <Modal.CloseButton />
        <Modal.Header>Request Discount</Modal.Header>
        <Modal.Body>
          <VStack space={3}>
            <Box bg="gray.100" p={3} borderRadius={8}>
              <Text bold>Payment Total: ${payment.total?.toLocaleString()}</Text>
              <Text color="gray.500">Status: {payment.status}</Text>
            </Box>
            <Divider my={1} />
            <Input
              placeholder="Discount Amount"
              keyboardType="numeric"
              value={amount ? amount.toString() : ''}
              onChangeText={text => setAmount(Number(text) || 0)}
            />
            <Input
              placeholder="Reason for Discount"
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
            />
          </VStack>
        </Modal.Body>
        <Modal.Footer>
          <Button.Group space={2}>
            <Button variant="outline" onPress={onDismiss}>Cancel</Button>
            <Button onPress={handleSubmit} isLoading={loading} isDisabled={!amount || !reason} colorScheme="warning">Submit</Button>
          </Button.Group>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
};

export default DiscountRequestForm; 
