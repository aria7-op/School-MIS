import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: { id: string; label: string; selected: boolean }[];
  onToggle: (id: string) => void;
  onApply: () => void;
  onReset: () => void;
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
      mode === 'outlined' && styles.buttonOutlined,
      style,
    ]}
    onPress={onPress}
    {...props}
  >
    <Text style={[
      styles.buttonText,
      mode === 'contained' && styles.buttonTextContained,
      mode === 'outlined' && styles.buttonTextOutlined,
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

const Chip = ({ children, selected, onPress, style, ...props }: any) => (
  <TouchableOpacity
    style={[
      styles.chip,
      selected && styles.chipSelected,
      style,
    ]}
    onPress={onPress}
    {...props}
  >
    <Text style={[
      styles.chipText,
      selected && styles.chipTextSelected,
    ]}>
      {children}
    </Text>
  </TouchableOpacity>
);

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  filters = [],
  onToggle,
  onApply,
  onReset,
}) => {
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
              title="Filter Options"
              right={() => <IconButton icon="close" onPress={onClose} />}
            />
            <CardContent>
              <Text style={styles.label}>Select filters:</Text>
              <View style={styles.chipRow}>
                {filters.map((filter) => (
                  <Chip
                    key={filter.id}
                    selected={filter.selected}
                    onPress={() => onToggle(filter.id)}
                    style={styles.chip}
                  >
                    {filter.label}
                  </Chip>
                ))}
              </View>
              <View style={styles.buttonRow}>
                <Button mode="outlined" onPress={onReset} style={styles.filterButton}>
                  Reset
                </Button>
                <Button mode="contained" onPress={onApply} style={styles.filterButton}>
                  Apply
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
  label: {
    marginBottom: 8,
    fontSize: 16,
    color: '#333',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  filterButton: {
    marginLeft: 8,
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
  buttonOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonTextContained: {
    color: '#fff',
  },
  buttonTextOutlined: {
    color: '#007AFF',
  },
  iconButton: {
    padding: 4,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  chipSelected: {
    backgroundColor: '#007AFF',
  },
  chipText: {
    fontSize: 12,
    color: '#333',
  },
  chipTextSelected: {
    color: '#fff',
  },
});

export default FilterModal; 
