import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

interface PrintPreviewModalProps {
  visible: boolean;
  content: string;
  type: 'bill' | 'payroll';
  onClose: () => void;
  onPrint: () => void;
}

const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  visible,
  content,
  type,
  onClose,
  onPrint,
}) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {type === 'bill' ? 'Bill Preview' : 'Payroll Preview'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <WebView
          originWhitelist={['*']}
          source={{ html: content }}
          style={styles.webview}
        />
        
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.card }]}
            onPress={onClose}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={onPrint}
          >
            <Text style={[styles.buttonText, { color: 'white' }]}>Print</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  webview: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  buttonText: {
    fontWeight: '600',
  },
});

export default PrintPreviewModal;
