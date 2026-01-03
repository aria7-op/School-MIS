import React, { useState } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Tabs,
  Tab,
  TabBar,
  Icon,
  useToast,
  Fab,
  IconButton,
  Modal,
  Button,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import usePaymentsApi from '../hooks/usePaymentsApi';
import PaymentDashboard from '../components/PaymentDashboard';
import PaymentList from '../components/PaymentList';
import PaymentReports from '../components/PaymentReports';
import PaymentAudit from '../components/PaymentAudit';
import StudentSearchModal from '../components/StudentSearchModal';
import PaymentForm from '../components/PaymentForm';
import PaymentBill from '../components/PaymentBill';
import DiscountRequestForm from '../components/DiscountRequestForm';
import PaymentAnalytics from '../components/PaymentAnalytics';

const PaymentsScreen: React.FC = () => {
  const { payments, loading, error } = usePaymentsApi();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showStudentSearch, setShowStudentSearch] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showPaymentBill, setShowPaymentBill] = useState(false);
  const [showDiscountRequest, setShowDiscountRequest] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const toast = useToast();

  const handleViewPayment = (payment: any) => {
    setSelectedPayment(payment);
    setShowPaymentBill(true);
  };

  const handleEditPayment = (payment: any) => {
    setSelectedPayment(payment);
    setShowPaymentForm(true);
  };

  const handleDeletePayment = async (paymentId: number) => {
    // This would be handled by the PaymentList component
    toast.show({
      description: 'Payment deleted successfully',
      status: 'success',
    });
  };

  const handleStudentSelect = (student: any) => {
    setSelectedStudent(student);
    setShowStudentSearch(false);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setSelectedPayment(null);
    setSelectedStudent(null);
    toast.show({
      description: 'Payment processed successfully',
      status: 'success',
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <PaymentDashboard />;
      case 'payments':
        return (
          <PaymentList
            onViewPayment={handleViewPayment}
            onEditPayment={handleEditPayment}
            onDeletePayment={handleDeletePayment}
            showBulkActions={true}
          />
        );
      case 'reports':
        return <PaymentReports />;
      case 'audit':
        return <PaymentAudit />;
      default:
        return <PaymentDashboard />;
    }
  };

  return (
    <Box flex={1} bg="coolGray.50">
      <Tabs value={activeTab} onChange={setActiveTab}>
        <TabBar>
          <Tab value="dashboard">
            <HStack space={2} alignItems="center">
              <Icon as={MaterialIcons} name="dashboard" size="sm" />
              <Text>Dashboard</Text>
            </HStack>
          </Tab>
          <Tab value="payments">
            <HStack space={2} alignItems="center">
              <Icon as={MaterialIcons} name="payment" size="sm" />
              <Text>Payments</Text>
            </HStack>
          </Tab>
          <Tab value="reports">
            <HStack space={2} alignItems="center">
              <Icon as={MaterialIcons} name="assessment" size="sm" />
              <Text>Reports</Text>
            </HStack>
          </Tab>
          <Tab value="audit">
            <HStack space={2} alignItems="center">
              <Icon as={MaterialIcons} name="history" size="sm" />
              <Text>Audit</Text>
            </HStack>
          </Tab>
        </TabBar>
      </Tabs>

      <Box flex={1}>
        {renderTabContent()}
      </Box>

      {/* Floating Action Button */}
      <Fab
        renderInPortal={false}
        shadow={2}
        size="lg"
        icon={<Icon as={MaterialIcons} name="add" size="lg" color="white" />}
        onPress={() => setShowStudentSearch(true)}
      />

      {/* Student Search Modal */}
      <Modal isOpen={showStudentSearch} onClose={() => setShowStudentSearch(false)} size="xl">
        <Modal.Content>
          <Modal.Header>Search Student</Modal.Header>
          <Modal.Body>
            <StudentSearchModal onStudentSelect={handleStudentSelect} />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onPress={() => setShowStudentSearch(false)}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Payment Form Modal */}
      <Modal isOpen={showPaymentForm} onClose={() => setShowPaymentForm(false)} size="xl">
        <Modal.Content>
          <Modal.Header>
            {selectedPayment ? 'Edit Payment' : 'New Payment'}
          </Modal.Header>
          <Modal.Body>
            <PaymentForm
              payment={selectedPayment}
              student={selectedStudent}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowPaymentForm(false)}
            />
          </Modal.Body>
        </Modal.Content>
      </Modal>

      {/* Payment Bill Modal */}
      <Modal isOpen={showPaymentBill} onClose={() => setShowPaymentBill(false)} size="xl">
        <Modal.Content>
          <Modal.Header>Payment Bill</Modal.Header>
          <Modal.Body>
            <PaymentBill
              payment={selectedPayment}
              onClose={() => setShowPaymentBill(false)}
            />
          </Modal.Body>
        </Modal.Content>
      </Modal>

      {/* Discount Request Modal */}
      <Modal isOpen={showDiscountRequest} onClose={() => setShowDiscountRequest(false)} size="md">
        <Modal.Content>
          <Modal.Header>Request Discount</Modal.Header>
          <Modal.Body>
            <DiscountRequestForm
              payment={selectedPayment}
              onSuccess={() => setShowDiscountRequest(false)}
              onCancel={() => setShowDiscountRequest(false)}
            />
          </Modal.Body>
        </Modal.Content>
      </Modal>

      {/* Analytics Modal */}
      <Modal isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} size="xl">
        <Modal.Content>
          <Modal.Header>Payment Analytics</Modal.Header>
          <Modal.Body>
            <PaymentAnalytics />
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </Box>
  );
};

export default PaymentsScreen; 
