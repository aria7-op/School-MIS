import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Account } from '../types/finance';

const AccountSelector: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account>({
    id: '1',
    name: 'Main Account',
    balance: 4523.87,
    currency: 'Afg',
    type: 'checking'
  });
  const { colors } = useTheme();

  const accounts: Account[] = [
    selectedAccount,
    // TODO: Replace with actual account data from API
  ];

  return (
    <>
      <TouchableOpacity 
        style={[styles.container, { backgroundColor: colors.card }]}
        onPress={() => setVisible(true)}
      >
        <View style={styles.accountInfo}>
          <Text style={[styles.accountName, { color: colors.text }]}>
            {selectedAccount.name}
          </Text>
          <Text style={[styles.accountBalance, { color: colors.text }]}>
            {selectedAccount.balance >= 0 ? 'Afg ' : '-Afg '}
            {Math.abs(selectedAccount.balance).toFixed(2)}
          </Text>
        </View>
        <MaterialIcons 
          name="arrow-drop-down" 
          size={24} 
          color={colors.text} 
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select Account
            </Text>
            {accounts.map(account => (
              <TouchableOpacity
                key={account.id}
                style={styles.accountItem}
                onPress={() => {
                  setSelectedAccount(account);
                  setVisible(false);
                }}
              >
                <Text style={[styles.accountItemName, { color: colors.text }]}>
                  {account.name}
                </Text>
                <Text style={[
                  styles.accountItemBalance,
                  { color: account.balance >= 0 ? '#4CAF50' : '#F44336' }
                ]}>
                  {account.balance >= 0 ? 'Afg ' : '-Afg '}
                  {Math.abs(account.balance).toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    margin: 20,
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  accountItemName: {
    fontSize: 16,
  },
  accountItemBalance: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AccountSelector;
