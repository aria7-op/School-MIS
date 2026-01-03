// src/features/classes/components/AddClassButton.tsx
import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useTheme } from '@react-navigation/native';
import AddClassModal from './AddClassModal';
import { Class } from '../types';

interface AddClassButtonProps {
  onClassAdded: (newClass: Class) => void;
}

const AddClassButton: React.FC<AddClassButtonProps> = ({ onClassAdded }) => {
  const { colors } = useTheme();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleClassSubmit = (classData: Omit<Class, 'id'>) => {
    // Add the new class to the server
    fetch('https://sapi.ariadeltatravel.com/api/addClass', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(classData),
    })
    .then(response => response.json())
    .then(data => {
      if (data.id) {
        onClassAdded({ ...classData, id: data.id });
      }
    })
    .catch(error => console.error('Error adding class:', error));
  };

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setIsModalVisible(true)}
      >
        <Text style={styles.buttonText}>Add New Class</Text>
      </TouchableOpacity>

      <AddClassModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleClassSubmit}
      />
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#6366f1',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default AddClassButton;
