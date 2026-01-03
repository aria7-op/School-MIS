import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  FlatList,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from '../../../../contexts/TranslationContext';

interface BillItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface GenerateBillModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (bill: any) => void;
}

const GenerateBillModal: React.FC<GenerateBillModalProps> = ({ visible, onClose, onSave }) => {
  const { colors } = useTheme();
  const { t, lang } = useTranslation();
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    billNumber: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    taxRate: 15,
    discountRate: 0,
    notes: '',
    paymentTerms: 'Net 30',
  });

  const [items, setItems] = useState<BillItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, amount: 0 }
  ]);

  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const newSubtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const newTaxAmount = (newSubtotal * formData.taxRate) / 100;
    const newDiscountAmount = (newSubtotal * formData.discountRate) / 100;
    const newTotal = newSubtotal + newTaxAmount - newDiscountAmount;

    setSubtotal(newSubtotal);
    setTaxAmount(newTaxAmount);
    setDiscountAmount(newDiscountAmount);
    setTotal(newTotal);
  }, [items, formData.taxRate, formData.discountRate]);

  const generateBillNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-3);
    return `BILL-${year}${month}-${timestamp}`;
  };

  const addItem = () => {
    const newItem: BillItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof BillItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.amount = updatedItem.quantity * updatedItem.unitPrice;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSave = () => {
    if (!formData.customerName.trim()) {
      Alert.alert('Validation Error', 'Please enter customer name.');
      return;
    }

    if (!formData.billNumber.trim()) {
      setFormData({ ...formData, billNumber: generateBillNumber() });
    }

    const validItems = items.filter(item => 
      item.description.trim() && item.quantity > 0 && item.unitPrice > 0
    );

    if (validItems.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one valid item.');
      return;
    }

    onSave({
      ...formData,
      items: validItems,
      subtotal,
      taxAmount,
      discountAmount,
      total,
    });

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      billNumber: '',
      billDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      taxRate: 15,
      discountRate: 0,
      notes: '',
      paymentTerms: 'Net 30',
    });
    setItems([{ id: '1', description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderItem = ({ item, index }: { item: BillItem; index: number }) => (
    <View style={[styles.itemContainer, { backgroundColor: colors.card }]}>
      <View style={styles.itemHeader}>
        <Text style={[styles.itemNumber, { color: colors.text }]}>Item {index + 1}</Text>
        {items.length > 1 && (
          <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.removeButton}>
            <Icon name="delete" size={20} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
      
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        placeholder="Description"
        placeholderTextColor={colors.text + '80'}
        value={item.description}
        onChangeText={(text) => updateItem(item.id, 'description', text)}
      />
      
      <View style={styles.itemRow}>
        <View style={styles.quantityContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Qty</Text>
          <TextInput
            style={[styles.quantityInput, { borderColor: colors.border, color: colors.text }]}
            value={item.quantity.toString()}
            onChangeText={(text) => updateItem(item.id, 'quantity', parseInt(text) || 0)}
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Unit Price</Text>
          <TextInput
            style={[styles.priceInput, { borderColor: colors.border, color: colors.text }]}
            value={item.unitPrice.toString()}
            onChangeText={(text) => updateItem(item.id, 'unitPrice', parseFloat(text) || 0)}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor={colors.text + '80'}
          />
        </View>
        
        <View style={styles.amountContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Amount</Text>
          <Text style={[styles.amountText, { color: colors.text }]}>
            ${item.amount.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Generate Bill</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Customer Information */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer Information</Text>
              
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="Customer Name *"
                placeholderTextColor={colors.text + '80'}
                value={formData.customerName}
                onChangeText={(text) => setFormData({ ...formData, customerName: text })}
              />
              
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="Email Address"
                placeholderTextColor={colors.text + '80'}
                value={formData.customerEmail}
                onChangeText={(text) => setFormData({ ...formData, customerEmail: text })}
                keyboardType="email-address"
              />
              
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="Phone Number"
                placeholderTextColor={colors.text + '80'}
                value={formData.customerPhone}
                onChangeText={(text) => setFormData({ ...formData, customerPhone: text })}
                keyboardType="phone-pad"
              />
            </View>

            {/* Bill Details */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Bill Details</Text>
              
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                    placeholder="Bill Number"
                    placeholderTextColor={colors.text + '80'}
                    value={formData.billNumber}
                    onChangeText={(text) => setFormData({ ...formData, billNumber: text })}
                  />
                </View>
                <View style={styles.halfWidth}>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                    placeholder="Payment Terms"
                    placeholderTextColor={colors.text + '80'}
                    value={formData.paymentTerms}
                    onChangeText={(text) => setFormData({ ...formData, paymentTerms: text })}
                  />
                </View>
              </View>
              
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                    placeholder="Bill Date (YYYY-MM-DD)"
                    placeholderTextColor={colors.text + '80'}
                    value={formData.billDate}
                    onChangeText={(text) => setFormData({ ...formData, billDate: text })}
                  />
                </View>
                <View style={styles.halfWidth}>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                    placeholder="Due Date (YYYY-MM-DD)"
                    placeholderTextColor={colors.text + '80'}
                    value={formData.dueDate}
                    onChangeText={(text) => setFormData({ ...formData, dueDate: text })}
                  />
                </View>
              </View>
            </View>

            {/* Bill Items */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Bill Items</Text>
                <TouchableOpacity onPress={addItem} style={styles.addButton}>
                  <Icon name="add" size={20} color="#fff" />
                  <Text style={styles.addButtonText}>Add Item</Text>
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>

            {/* Totals */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Summary</Text>
              
              <View style={styles.totalsContainer}>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>Subtotal:</Text>
                  <Text style={[styles.totalValue, { color: colors.text }]}>${subtotal.toFixed(2)}</Text>
                </View>
                
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>Tax Rate (%):</Text>
                  <TextInput
                    style={[styles.taxInput, { borderColor: colors.border, color: colors.text }]}
                    value={formData.taxRate.toString()}
                    onChangeText={(text) => setFormData({ ...formData, taxRate: parseFloat(text) || 0 })}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>Tax Amount:</Text>
                  <Text style={[styles.totalValue, { color: colors.text }]}>${taxAmount.toFixed(2)}</Text>
                </View>
                
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>Discount Rate (%):</Text>
                  <TextInput
                    style={[styles.taxInput, { borderColor: colors.border, color: colors.text }]}
                    value={formData.discountRate.toString()}
                    onChangeText={(text) => setFormData({ ...formData, discountRate: parseFloat(text) || 0 })}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>Discount Amount:</Text>
                  <Text style={[styles.totalValue, { color: colors.text }]}>${discountAmount.toFixed(2)}</Text>
                </View>
                
                <View style={[styles.totalRow, styles.grandTotal]}>
                  <Text style={[styles.grandTotalLabel, { color: colors.text }]}>Total:</Text>
                  <Text style={[styles.grandTotalValue, { color: colors.text }]}>${total.toFixed(2)}</Text>
                </View>
              </View>
            </View>

            {/* Notes */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
              <TextInput
                style={[styles.notesInput, { borderColor: colors.border, color: colors.text }]}
                placeholder="Additional notes or terms..."
                placeholderTextColor={colors.text + '80'}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
              <Text style={styles.buttonText}>Generate Bill</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    maxHeight: '90%',
    elevation: 5,
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
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  itemContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemNumber: {
    fontWeight: '600',
  },
  removeButton: {
    padding: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  quantityContainer: {
    width: '25%',
  },
  priceContainer: {
    width: '35%',
  },
  amountContainer: {
    width: '35%',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  quantityInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
  },
  priceInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 6,
  },
  totalsContainer: {
    gap: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  taxInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    width: 80,
    textAlign: 'center',
  },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default GenerateBillModal; 
