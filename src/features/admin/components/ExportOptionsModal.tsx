import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ExportOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onExport: (type: string) => void;
}

// Custom styled components
const Card = ({ children, style, ...props }: any) => (
  <View style={[styles.card, style]} {...props}>
    {children}
  </View>
);

const CardTitle = ({ title, right, ...props }: any) => (
  <View style={styles.cardTitle} {...props}>
    <Text style={styles.cardTitleText}>{title}</Text>
    {right && right({})}
  </View>
);

const CardContent = ({ children, style, ...props }: any) => (
  <View style={[styles.cardContent, style]} {...props}>
    {children}
  </View>
);

const Button = ({ children, mode = 'contained', onPress, style, ...props }: any) => (
  <TouchableOpacity
    style={[
      styles.button,
      mode === 'contained' && styles.buttonContained,
      style,
    ]}
    onPress={onPress}
    {...props}
  >
    <Text style={[
      styles.buttonText,
      mode === 'contained' && styles.buttonTextContained,
    ]}>
      {children}
    </Text>
  </TouchableOpacity>
);

const IconButton = ({ icon, onPress, style, ...props }: any) => (
  <TouchableOpacity
    style={[styles.iconButton, style]}
    onPress={onPress}
    {...props}
  >
    <MaterialIcons name={icon} size={24} color="#666" />
  </TouchableOpacity>
);

const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({ visible, onClose, onExport }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <Card>
            <CardTitle
              title="Export Options"
              right={() => <IconButton icon="close" onPress={onClose} />}
            />
            <CardContent>
              <Text style={styles.modalText}>Select the format to export data:</Text>
              <View style={styles.buttonRow}>
                <Button mode="contained" style={styles.exportButton} onPress={() => onExport('csv')}>
                  Export as CSV
                </Button>
                <Button mode="contained" style={styles.exportButton} onPress={() => onExport('xlsx')}>
                  Export as Excel
                </Button>
                <Button mode="contained" style={styles.exportButton} onPress={() => onExport('pdf')}>
                  Export as PDF
                </Button>
              </View>
            </CardContent>
          </Card>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    margin: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  cardTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cardTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardContent: {
    padding: 16,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  buttonRow: {
    marginTop: 16,
  },
  exportButton: {
    marginVertical: 4,
  },
  // Custom component styles
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    minHeight: 36,
  },
  buttonContained: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonTextContained: {
    color: '#fff',
  },
  iconButton: {
    padding: 4,
  },
});

export default ExportOptionsModal; 
