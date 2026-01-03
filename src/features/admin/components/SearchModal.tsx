import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
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

const Searchbar = ({ placeholder, value, onChangeText, onSubmitEditing, style, ...props }: any) => (
  <View style={[styles.searchbarContainer, style]}>
    <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
    <TextInput
      style={styles.searchbarInput}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      onSubmitEditing={onSubmitEditing}
      placeholderTextColor="#999"
      {...props}
    />
  </View>
);

const SearchModal: React.FC<SearchModalProps> = ({ visible, onClose, searchQuery, onSearchChange, onSearch }) => {
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
              title="Search"
              right={() => <IconButton icon="close" onPress={onClose} />}
            />
            <CardContent>
              <Searchbar
                placeholder="Search..."
                value={searchQuery}
                onChangeText={onSearchChange}
                onSubmitEditing={onSearch}
                style={styles.searchBar}
              />
              <View style={styles.buttonRow}>
                <Button mode="outlined" onPress={onClose} style={styles.searchButton}>
                  Cancel
                </Button>
                <Button mode="contained" onPress={onSearch} style={styles.searchButton}>
                  Search
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
  searchBar: {
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  searchButton: {
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
  searchbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchbarInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
  },
});

export default SearchModal; 
