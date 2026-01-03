/**
 * Example usage of CustomerFormWindow with WindowManager
 * 
 * To use this in your app:
 * 
 * 1. Wrap your app root with WindowManagerProvider:
 * 
 * ```tsx
 * import { WindowManagerProvider } from './features/customers/components/WindowManager';
 * 
 * function App() {
 *   return (
 *     <WindowManagerProvider>
 *       <YourAppContent />
 *     </WindowManagerProvider>
 *   );
 * }
 * ```
 * 
 * 2. Use the hook to open customer forms:
 * 
 * ```tsx
 * import { useCustomerFormWindow } from './features/customers/hooks/useCustomerFormWindow';
 * 
 * function YourComponent() {
 *   const { openCustomerForm } = useCustomerFormWindow({
 *     onSubmit: async (customerData) => {
 *       // Handle form submission
 *       console.log('Customer saved:', customerData);
 *     },
 *     loading: false,
 *   });
 * 
 *   return (
 *     <TouchableOpacity onPress={() => openCustomerForm()}>
 *       <Text>Add Customer</Text>
 *     </TouchableOpacity>
 *   );
 * }
 * ```
 * 
 * Features:
 * - Three-column layout for form fields
 * - Close, minimize, and maximize buttons in window header
 * - Gmail-style minimized tray at bottom of screen
 * - Auto-save drafts every 2 seconds after changes
 * - Restore form state when reopening minimized forms
 * - Draft indicator shows when draft is saved
 * - Prompts to save draft before closing if there are unsaved changes
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WindowManagerProvider } from './WindowManager';
import { useCustomerFormWindow } from '../hooks/useCustomerFormWindow';

// Example component
const CustomerFormExample: React.FC = () => {
  const { openCustomerForm } = useCustomerFormWindow({
    onSubmit: async (customerData) => {
      console.log('Customer submitted:', customerData);
      // Here you would typically call your API to save the customer
    },
    loading: false,
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.button}
        onPress={() => openCustomerForm()}
      >
        <Text style={styles.buttonText}>Open Customer Form</Text>
      </TouchableOpacity>
    </View>
  );
};

// Wrap with WindowManagerProvider at app root level
export const CustomerFormWindowExample: React.FC = () => {
  return (
    <WindowManagerProvider>
      <CustomerFormExample />
    </WindowManagerProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  button: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomerFormWindowExample;

